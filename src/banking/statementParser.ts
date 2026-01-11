import { parseCSV } from 'utils/csvParser';
import * as XLSXImport from 'xlsx';

type XLSXWorkBook = {
  SheetNames: string[];
  Sheets: Record<string, unknown>;
};

type XLSXModule = {
  read: (data: Uint8Array, opts: Record<string, unknown>) => XLSXWorkBook;
  utils: {
    sheet_to_json: (
      sheet: unknown,
      opts: Record<string, unknown>
    ) => unknown[];
  };
};

const XLSX = XLSXImport as unknown as XLSXModule;

export type ParsedStatement = {
  rows: string[][];
  fileType: 'csv' | 'xlsx' | 'xls' | 'unknown';
};

export function parseStatementFile(
  fileName: string,
  data: Uint8Array
): ParsedStatement {
  const ext = getFileExtension(fileName);

  if (ext === 'csv') {
    const text = new TextDecoder().decode(data);
    return { rows: parseCSV(text), fileType: 'csv' };
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(data, {
      type: 'array',
      cellDates: true,
      raw: true,
    });

    const firstSheet = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheet];
    const matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: '',
    }) as unknown[][];

    const rows = matrix.map((row) => row.map((v) => toCellString(v)));
    return { rows, fileType: ext };
  }

  return { rows: [], fileType: 'unknown' };
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length < 2) {
    return '';
  }

  return parts[parts.length - 1].toLowerCase();
}

function toCellString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  return String(value);
}
