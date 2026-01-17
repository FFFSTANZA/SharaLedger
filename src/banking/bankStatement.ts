import { DateTime } from 'luxon';

export type DebitCredit = 'Debit' | 'Credit';

export function parseStatementDate(value: string): Date {
  const v = value?.trim();
  if (!v) {
    throw new Error('Missing transaction date');
  }

  const candidates: DateTime[] = [];
  candidates.push(DateTime.fromISO(v));

  const formats = [
    'yyyy-MM-dd',
    'dd-MM-yyyy',
    'dd/MM/yyyy',
    'MM/dd/yyyy',
    'dd.MM.yyyy',
    'yyyy/MM/dd',
  ];

  for (const fmt of formats) {
    candidates.push(DateTime.fromFormat(v, fmt));
  }

  candidates.push(DateTime.fromJSDate(new Date(v)));

  const dt = candidates.find((d) => d.isValid);
  if (!dt) {
    throw new Error(`Invalid transaction date: ${value}`);
  }

  return dt.startOf('day').toJSDate();
}

export function parseStatementAmount(value: string): number {
  const v = value?.trim();
  if (!v) {
    return 0;
  }

  const normalized = v.replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const num = Number.parseFloat(normalized);
  if (Number.isNaN(num)) {
    throw new Error(`Invalid amount: ${value}`);
  }

  return num;
}

function normalizeHashToken(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Deterministic hash used for duplicate import prevention.
 *
 * Requirement: transaction_date + amount + description + bank_account
 */
export function getBankStatementEntryHash(params: {
  transactionDate: Date;
  amount: number;
  description: string;
  bankAccount: string;
}): string {
  const date = DateTime.fromJSDate(params.transactionDate).toISODate();
  const amount = Number(params.amount).toFixed(2);

  const payload = [
    date,
    amount,
    normalizeHashToken(params.description),
    normalizeHashToken(params.bankAccount),
  ].join('|');

  return cyrb53(payload).toString(16);
}

/**
 * cyrb53 (public domain) - fast non-cryptographic 53-bit hash.
 * Good enough for deterministic dedupe keys in local DB.
 */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;

  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);

  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export type BankStatementCsvColumns = {
  dateIdx: number;
  descriptionIdx: number;
  amountIdx?: number;
  debitIdx?: number;
  creditIdx?: number;
  debitCreditIdx?: number;
};

export function detectBankStatementCsvColumns(headers: string[]): BankStatementCsvColumns {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const keys = headers.map(norm);

  const findIdx = (matcher: (h: string) => boolean) => {
    const idx = keys.findIndex(matcher);
    return idx === -1 ? undefined : idx;
  };

  const dateIdx = findIdx((h) =>
    ['date', 'transactiondate', 'valuedate', 'postingdate'].some((k) =>
      h.includes(k)
    )
  );

  const descriptionIdx = findIdx((h) =>
    ['description', 'narration', 'details', 'particulars', 'remarks'].some((k) =>
      h.includes(k)
    )
  );

  const debitIdx = findIdx(
    (h) =>
      h.includes('debit') ||
      h.includes('withdrawal') ||
      h === 'dr' ||
      h.endsWith('dr')
  );

  const creditIdx = findIdx(
    (h) =>
      h.includes('credit') ||
      h.includes('deposit') ||
      h === 'cr' ||
      h.endsWith('cr')
  );

  const amountIdx = findIdx((h) =>
    ['amount', 'value', 'amt'].some((k) => h.includes(k))
  );

  const debitCreditIdx = findIdx((h) =>
    ['debitcredit', 'drcr', 'type', 'indicator', 'transactiontype'].some((k) =>
      h.includes(k)
    )
  );

  if (dateIdx === undefined) {
    throw new Error('Could not detect transaction date column');
  }

  if (descriptionIdx === undefined) {
    throw new Error('Could not detect description column');
  }

  const hasAmount = amountIdx !== undefined;
  const hasSplit = debitIdx !== undefined || creditIdx !== undefined;

  if (!hasAmount && !hasSplit) {
    throw new Error('Could not detect amount column');
  }

  return {
    dateIdx,
    descriptionIdx,
    amountIdx,
    debitIdx,
    creditIdx,
    debitCreditIdx,
  };
}

export function parseDebitCredit(params: {
  row: string[];
  columns: BankStatementCsvColumns;
}): { amount: number; debitCredit: DebitCredit } {
  const { row, columns } = params;

  const debit =
    columns.debitIdx !== undefined
      ? parseStatementAmount(row[columns.debitIdx] ?? '')
      : 0;

  const credit =
    columns.creditIdx !== undefined
      ? parseStatementAmount(row[columns.creditIdx] ?? '')
      : 0;

  if (debit || credit) {
    if (debit && credit) {
      return {
        amount: Math.abs(credit - debit),
        debitCredit: credit > debit ? 'Credit' : 'Debit',
      };
    }

    return debit
      ? { amount: Math.abs(debit), debitCredit: 'Debit' }
      : { amount: Math.abs(credit), debitCredit: 'Credit' };
  }

  const amount =
    columns.amountIdx !== undefined
      ? parseStatementAmount(row[columns.amountIdx] ?? '')
      : 0;

  const indicatorRaw =
    columns.debitCreditIdx !== undefined ? row[columns.debitCreditIdx] ?? '' : '';

  const indicator = indicatorRaw.trim().toLowerCase();

  if (indicator.includes('cr') || indicator.includes('credit')) {
    return { amount: Math.abs(amount), debitCredit: 'Credit' };
  }

  if (indicator.includes('dr') || indicator.includes('debit')) {
    return { amount: Math.abs(amount), debitCredit: 'Debit' };
  }

  if (amount < 0) {
    return { amount: Math.abs(amount), debitCredit: 'Debit' };
  }

  return { amount: Math.abs(amount), debitCredit: 'Credit' };
}
