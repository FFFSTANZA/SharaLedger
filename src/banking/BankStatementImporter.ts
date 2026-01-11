import { DateTime } from 'luxon';
import { Money } from 'pesa';
import { Fyo } from 'fyo';
import { Importer } from 'src/importer';
import { RawValue } from 'schemas/types';
import { ModelNameEnum } from 'models/types';
import {
  autoMapColumns,
  detectHeaderRowIndex,
  getHeaderSignature,
  normalizeHeader,
  type BankStatementField,
} from './bankStatementMapping';

type BankImportProfileRow = {
  name: string;
  bankName?: string;
  dateFormat?: string;
  ignoreHeaderRowsCount?: number;
  columnMapping?: string;
  headerSignature?: string;
};

export class BankStatementImporter extends Importer {
  mappingConfidence = 0;
  headerRowIndex = 0;
  headerSignature = '';
  dateFormat?: string;
  matchedProfileName?: string;

  constructor(fyo: Fyo) {
    super(ModelNameEnum.BankTransaction, fyo);
  }

  async selectStatement(rows: string[][], fileName: string) {
    this.valueMatrix = [];
    this.docs = [];

    const headerRowIndex = detectHeaderRowIndex(rows);
    const headerRow = rows[headerRowIndex] ?? [];

    this.headerRowIndex = headerRowIndex;
    this.headerSignature = getHeaderSignature(headerRow);

    const profiles = (await this.fyo.db.getAll(ModelNameEnum.BankImportProfile, {
      fields: ['name', 'bankName', 'dateFormat', 'ignoreHeaderRowsCount', 'columnMapping', 'headerSignature'],
    })) as BankImportProfileRow[];

    const profile = findBestProfileMatch(
      profiles,
      this.headerSignature,
      headerRow
    );

    let fieldIndexMap: Partial<Record<BankStatementField, number>>;
    let confidence = 0;

    if (profile) {
      this.matchedProfileName = profile.name;
      this.dateFormat = profile.dateFormat || undefined;

      fieldIndexMap = getFieldIndexMapFromProfile(profile, headerRow);
      confidence = 1;
    } else {
      const detected = autoMapColumns(headerRow);
      fieldIndexMap = detected.fieldIndexMap;
      confidence = detected.confidence;
    }

    this.mappingConfidence = confidence;
    this.applyFieldIndexMap(fieldIndexMap, headerRow.length);

    const dataRows = rows.slice(headerRowIndex + 1);
    this.assignValueMatrixFromParsed(
      dataRows.filter((r) => r.some((v) => String(v ?? '').trim() !== ''))
    );

    if (!profile) {
      const mapped = getProfileMappingFromHeaderRow(headerRow, fieldIndexMap);
      this.dateFormat ??= inferDateFormatFromRows(dataRows);
      await this.saveOrUpdateProfile(fileName, mapped);
    }
  }

  applyFieldIndexMap(
    fieldIndexMap: Partial<Record<BankStatementField, number>>,
    columnCount: number
  ) {
    this.clearAndResizeAssignedTemplateFields(columnCount);

    const schemaName = this.schemaName;
    const templateKeyByField: Record<BankStatementField, string> = {
      date: `${schemaName}.date`,
      description: `${schemaName}.description`,
      debit: `${schemaName}.debit`,
      credit: `${schemaName}.credit`,
      balance: `${schemaName}.balance`,
      bankReference: `${schemaName}.bankReference`,
    };

    for (const field of Object.keys(templateKeyByField) as BankStatementField[]) {
      const index = fieldIndexMap[field];
      if (index == null || index < 0 || index >= columnCount) {
        continue;
      }

      this.assignedTemplateFields[index] = templateKeyByField[field];
    }
  }

  override getValueMatrixItem(index: number, rawValue: RawValue) {
    const key = this.assignedTemplateFields[index];
    const tf = key ? this.templateFieldsMap.get(key) : undefined;

    if (!tf) {
      return super.getValueMatrixItem(index, rawValue);
    }

    const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

    if (value === '') {
      return { rawValue, value: null };
    }

    if (tf.fieldname === 'date') {
      const date = parseBankDate(value, this.dateFormat);
      if (!date) {
        return { rawValue, value: null, error: true };
      }

      return { rawValue, value: date };
    }

    if (['debit', 'credit', 'balance'].includes(tf.fieldname)) {
      const money = parseBankMoney(value, this.fyo);
      if (!money) {
        return { rawValue, value: null, error: true };
      }

      return { rawValue, value: money };
    }

    if (['description', 'bankReference'].includes(tf.fieldname)) {
      return { rawValue, value: String(value).replaceAll(/\s+/g, ' ').trim() };
    }

    return super.getValueMatrixItem(index, rawValue);
  }

  async saveOrUpdateProfile(
    fileName: string,
    mapping: Partial<Record<BankStatementField, string>>
  ) {
    const headerSignature = this.headerSignature;
    const existing = (await this.fyo.db.getAll(ModelNameEnum.BankImportProfile, {
      fields: ['name'],
      filters: { headerSignature },
    })) as { name: string }[];

    if (existing.length) {
      return;
    }

    const bankName = inferBankNameFromFileName(fileName);

    const profile = this.fyo.doc.getNewDoc(ModelNameEnum.BankImportProfile, {
      bankName,
      ignoreHeaderRowsCount: this.headerRowIndex,
      dateFormat: this.dateFormat ?? '',
      debitCreditLogic: 'SeparateColumns',
      columnMapping: JSON.stringify(mapping),
      headerSignature,
    });

    await profile.sync();
  }
}

function parseBankMoney(value: RawValue, fyo: Fyo): Money | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'number') {
    return fyo.pesa(value);
  }

  const s = String(value)
    .replaceAll(/,/g, '')
    .replaceAll(/\s+/g, '')
    .trim();

  if (!s) {
    return null;
  }

  const isParenNegative = s.startsWith('(') && s.endsWith(')');
  const cleaned = isParenNegative ? s.slice(1, -1) : s;

  try {
    const money = fyo.pesa(cleaned);
    return isParenNegative ? money.neg() : money;
  } catch {
    return null;
  }
}

function parseBankDate(value: RawValue, dateFormat?: string): Date | null {
  if (value === null) {
    return null;
  }

  const s = String(value).trim();
  if (!s) {
    return null;
  }

  const iso = DateTime.fromISO(s);
  if (iso.isValid) {
    return iso.toJSDate();
  }

  const formats = [
    dateFormat,
    'dd/MM/yyyy',
    'd/M/yyyy',
    'dd-MM-yyyy',
    'd-M-yyyy',
    'dd/MM/yy',
    'd/M/yy',
    'dd-MM-yy',
    'd-M-yy',
    'dd-MMM-yyyy',
    'd-MMM-yyyy',
    'dd MMM yyyy',
    'd MMM yyyy',
  ].filter(Boolean) as string[];

  for (const fmt of formats) {
    const dt = DateTime.fromFormat(s, fmt);
    if (dt.isValid) {
      return dt.toJSDate();
    }
  }

  return null;
}

function inferDateFormatFromRows(rows: string[][]): string {
  for (const row of rows.slice(0, 50)) {
    for (const cell of row) {
      const c = String(cell ?? '').trim();
      if (!c) {
        continue;
      }

      if (DateTime.fromFormat(c, 'dd/MM/yyyy').isValid) {
        return 'dd/MM/yyyy';
      }

      if (DateTime.fromFormat(c, 'dd-MM-yyyy').isValid) {
        return 'dd-MM-yyyy';
      }

      if (DateTime.fromFormat(c, 'd/M/yyyy').isValid) {
        return 'd/M/yyyy';
      }

      if (DateTime.fromFormat(c, 'd-M-yyyy').isValid) {
        return 'd-M-yyyy';
      }

      if (DateTime.fromISO(c).isValid) {
        return 'yyyy-MM-dd';
      }
    }
  }

  return '';
}

function getProfileMappingFromHeaderRow(
  headerRow: string[],
  fieldIndexMap: Partial<Record<BankStatementField, number>>
): Partial<Record<BankStatementField, string>> {
  const mapping: Partial<Record<BankStatementField, string>> = {};

  for (const key of Object.keys(fieldIndexMap) as BankStatementField[]) {
    const idx = fieldIndexMap[key];
    if (idx == null) {
      continue;
    }

    mapping[key] = normalizeHeader(headerRow[idx] ?? '');
  }

  return mapping;
}

function findBestProfileMatch(
  profiles: BankImportProfileRow[],
  headerSignature: string,
  headerRow: string[]
): BankImportProfileRow | undefined {
  const normalizedSignature = headerSignature;

  const exact = profiles.find((p) => p.headerSignature === normalizedSignature);
  if (exact) {
    return exact;
  }

  const headerTokens = new Set(normalizedSignature.split('|').filter(Boolean));

  let best: BankImportProfileRow | undefined;
  let bestScore = 0;

  for (const p of profiles) {
    const sig = p.headerSignature;
    if (!sig) {
      continue;
    }

    const tokens = new Set(sig.split('|').filter(Boolean));
    const intersection = [...headerTokens].filter((t) => tokens.has(t)).length;
    const union = new Set([...headerTokens, ...tokens]).size;
    const score = union ? intersection / union : 0;

    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  if (bestScore >= 0.7) {
    return best;
  }

  const headerHasDates = headerRow.some((h) => normalizeHeader(h).includes('date'));
  if (headerHasDates) {
    return best;
  }

  return undefined;
}

function getFieldIndexMapFromProfile(
  profile: BankImportProfileRow,
  headerRow: string[]
): Partial<Record<BankStatementField, number>> {
  const mapping = safeJsonParse<Record<string, string>>(profile.columnMapping);
  const headerNormalized = headerRow.map(normalizeHeader);

  const fieldIndexMap: Partial<Record<BankStatementField, number>> = {};

  const keys: BankStatementField[] = [
    'date',
    'description',
    'debit',
    'credit',
    'balance',
    'bankReference',
  ];

  for (const key of keys) {
    const expected = normalizeHeader(mapping?.[key] ?? '');
    if (!expected) {
      continue;
    }

    let idx = headerNormalized.findIndex((h) => h === expected);
    if (idx < 0) {
      idx = headerNormalized.findIndex((h) => h.includes(expected));
    }

    if (idx >= 0) {
      fieldIndexMap[key] = idx;
    }
  }

  return fieldIndexMap;
}

function safeJsonParse<T>(value?: string): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function inferBankNameFromFileName(fileName: string): string {
  const base = fileName.replaceAll(/\.[^.]+$/g, '');
  return base.slice(0, 140);
}
