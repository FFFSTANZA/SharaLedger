import * as XLSX from 'xlsx';
import { parseCSV } from '../../../utils/csvParser';

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit' | null;
  balance?: number;
  currency?: string;
  reference?: string;
  chequeNo?: string;
  bankName?: string;
}

export interface StatementParseResult {
  transactions: ParsedTransaction[];
  headers: string[];
  bankName?: string;
  accountNumber?: string;
  dateFormat?: string;
  rawRows: string[][];
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}

export function parseStatementFile(
  fileName: string,
  data: Uint8Array
): StatementParseResult {
  const extension = getFileExtension(fileName);

  switch (extension) {
    case 'csv':
    case 'txt':
      return parseCSVStatement(data);
    case 'xlsx':
    case 'xls':
      return parseExcelStatement(data);
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
}

function parseCSVStatement(data: Uint8Array): StatementParseResult {
  const text = new TextDecoder().decode(data);
  const rows: string[][] = parseCSV(text);

  if (!rows || rows.length === 0) {
    throw new Error('Empty or invalid CSV file');
  }

  return processParsedData(rows);
}

function parseExcelStatement(data: Uint8Array): StatementParseResult {
  const workbook = XLSX.read(data, { type: 'array' });

  if (workbook.SheetNames.length === 0) {
    throw new Error('No sheets found in Excel file');
  }

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: '',
  }) as unknown as string[][];

  if (!rows || rows.length === 0) {
    throw new Error('Empty Excel sheet');
  }

  return processParsedData(rows);
}

function processParsedData(rows: string[][]): StatementParseResult {
  const headers = rows[0] || [];
  const rawRows = rows.slice(1);

  const transactions: ParsedTransaction[] = [];
  let bankName: string | undefined;
  let accountNumber: string | undefined;

  for (const row of rawRows) {
    if (
      !row ||
      row.length === 0 ||
      row.every((cell) => !cell || cell.trim() === '')
    ) {
      continue;
    }

    const transaction = parseRowToTransaction(row, headers);
    if (transaction) {
      transactions.push(transaction);
    }
  }

  return {
    transactions,
    headers,
    bankName,
    accountNumber,
    rawRows,
  };
}

function parseRowToTransaction(
  row: string[],
  headers: string[]
): ParsedTransaction | null {
  // Try to find date column
  const dateIndex = findDateColumn(row, headers);
  if (dateIndex === -1) return null;

  // Try to find description column
  const descIndex = findDescriptionColumn(row, headers);

  // Try to find amount column
  const amountIndex = findAmountColumn(row, headers);

  // Try to find balance column
  const balanceIndex = findBalanceColumn(row, headers);

  const dateStr = row[dateIndex]?.trim();
  const description = descIndex >= 0 ? row[descIndex]?.trim() : '';
  const amountStr = amountIndex >= 0 ? row[amountIndex]?.trim() : '0';
  const balanceStr = balanceIndex >= 0 ? row[balanceIndex]?.trim() : undefined;

  if (!dateStr || !description) {
    return null;
  }

  const amount = parseAmount(amountStr);
  if (isNaN(amount)) {
    return null;
  }

  const type = getTransactionType(amount);
  const balance = balanceStr ? parseAmount(balanceStr) : undefined;

  return {
    date: dateStr,
    description,
    amount: Math.abs(amount),
    type,
    balance: isNaN(balance as number) ? undefined : balance,
  };
}

function findDateColumn(row: string[], headers: string[]): number {
  const dateKeywords = [
    'date',
    'txn date',
    'transaction date',
    'posting date',
    'value date',
    'dt',
    'datetime',
  ];

  // First try to find by header
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toLowerCase().trim() || '';
    if (dateKeywords.some((kw) => header.includes(kw))) {
      return i;
    }
  }

  // Try to detect by content
  const datePatterns = [
    /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/,
    /^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/,
    /^\d{1,2}\s+\w+\s+\d{2,4}$/,
    /^\w+\s+\d{1,2},?\s+\d{2,4}$/,
  ];

  for (let i = 0; i < row.length; i++) {
    const cell = row[i]?.trim() || '';
    if (datePatterns.some((p) => p.test(cell))) {
      return i;
    }
  }

  return -1;
}

function findDescriptionColumn(row: string[], headers: string[]): number {
  const descKeywords = [
    'description',
    'narrative',
    'particulars',
    'details',
    'memo',
    'remarks',
    'narration',
    'transaction',
  ];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toLowerCase().trim() || '';
    if (descKeywords.some((kw) => header.includes(kw))) {
      return i;
    }
  }

  // For rows without headers, look for longest text field
  let maxLengthIndex = 0;
  let maxLength = 0;

  for (let i = 0; i < row.length; i++) {
    const cell = row[i]?.trim() || '';
    if (cell.length > maxLength && !/^\d+[\.\,\-]?\d*$/.test(cell)) {
      maxLength = cell.length;
      maxLengthIndex = i;
    }
  }

  return maxLengthIndex;
}

function findAmountColumn(row: string[], headers: string[]): number {
  const amountKeywords = [
    'amount',
    'value',
    'sum',
    'rs',
    'inr',
    '₹',
    'credit',
    'debit',
    'withdrawal',
    'deposit',
  ];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toLowerCase().trim() || '';
    if (
      amountKeywords.some((kw) => header.includes(kw)) &&
      !header.includes('balance')
    ) {
      return i;
    }
  }

  // Try to detect by content
  for (let i = 0; i < row.length; i++) {
    const cell = row[i]?.trim() || '';
    if (/^[\-\+]?[\d,]+\.?\d*$/.test(cell.replace(/[₹$€£]/g, '').trim())) {
      return i;
    }
  }

  return -1;
}

function findBalanceColumn(row: string[], headers: string[]): number {
  const balanceKeywords = [
    'balance',
    'closing balance',
    'running balance',
    'available',
    'bal',
  ];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toLowerCase().trim() || '';
    if (balanceKeywords.some((kw) => header.includes(kw))) {
      return i;
    }
  }

  return -1;
}

function parseAmount(value: string): number {
  if (!value) return 0;

  // Remove currency symbols and spaces
  let cleaned = value
    .replace(/[₹$€£]/g, '')
    .replace(/[,\s]/g, '')
    .trim();

  // Handle Cr/Dr notation
  if (cleaned.toLowerCase().endsWith('cr')) {
    cleaned = cleaned.slice(0, -2);
  } else if (cleaned.toLowerCase().endsWith('dr')) {
    cleaned = '-' + cleaned.slice(0, -2);
  }

  // Handle parentheses for negative
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function getTransactionType(amount: number): 'credit' | 'debit' | null {
  if (amount > 0) return 'credit';
  if (amount < 0) return 'debit';
  return null;
}

export function detectBankType(
  headers: string[],
  sampleData: string[][]
): string {
  const allText =
    headers.join(' ').toLowerCase() +
    ' ' +
    sampleData
      .slice(0, 5)
      .map((r) => r.join(' '))
      .join(' ')
      .toLowerCase();

  const bankPatterns: Record<string, RegExp[]> = {
    'HDFC Bank': [/hdfc/i, /axis bank/i],
    'State Bank of India': [/sbi/i, /state bank/i],
    'ICICI Bank': [/icici/i],
    'Axis Bank': [/axis/i],
    'Yes Bank': [/yes bank/i],
    'Punjab National Bank': [/pnb/i, /punjab national/i],
    'Bank of Baroda': [/baroda/i, /bob/i],
    'Canara Bank': [/canara/i],
    'Union Bank': [/union bank/i],
    'Indian Bank': [/indian bank/i],
    'IDFC First': [/idfc/i],
  };

  for (const [bankName, patterns] of Object.entries(bankPatterns)) {
    if (patterns.some((p) => p.test(allText))) {
      return bankName;
    }
  }

  return 'Generic';
}

export function detectDateFormat(dateStr: string): string {
  if (!dateStr) return 'dd/MM/yyyy';

  const patterns = [
    { regex: /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/, format: 'dd/MM/yyyy' },
    { regex: /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2}$/, format: 'dd/MM/yy' },
    { regex: /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/, format: 'yyyy/MM/dd' },
    { regex: /^\d{1,2}\s+\w+\s+\d{4}$/, format: 'dd MMM yyyy' },
    { regex: /^\w+\s+\d{1,2},?\s+\d{4}$/, format: 'MMM dd, yyyy' },
    { regex: /^\d{1,2}\.\d{1,2}\.\d{4}$/, format: 'dd.MM.yyyy' },
  ];

  for (const { regex, format } of patterns) {
    if (regex.test(dateStr)) {
      return format;
    }
  }

  return 'dd/MM/yyyy';
}
