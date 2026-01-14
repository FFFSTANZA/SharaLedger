import * as XLSX from 'xlsx';
import { parseCSV } from 'utils/csvParser';

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

  // Allow 0 amount transactions (some banks have these)
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
    'trans date',
    'tran date',
  ];

  // First try to find by header
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toLowerCase().trim() || '';
    if (dateKeywords.some((kw) => header.includes(kw))) {
      return i;
    }
  }

  // Try to detect by content - be more flexible with date patterns
  const datePatterns = [
    /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/, // dd/mm/yyyy, dd-mm-yyyy
    /^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/, // yyyy/mm/dd
    /^\d{1,2}\s+\w{3}\s+\d{2,4}$/, // 15 Jan 2024
    /^\w{3}\s+\d{1,2},?\s+\d{2,4}$/, // Jan 15, 2024
    /^\d{1,2}\-\w{3}\-\d{2,4}$/, // 15-Jan-2024
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
    'description of transaction',
    'transaction details',
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
    // Skip date, amount, and balance columns when looking for description
    if (cell.length > maxLength && !/^\d+[\.\,\-]?\d*$/.test(cell) && !/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(cell)) {
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
    'debit amount',
    'credit amount',
    'withdrawal',
    'deposit',
    'debit',
    'credit',
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

  // Try to detect by content - be more flexible with amount patterns
  for (let i = 0; i < row.length; i++) {
    const cell = row[i]?.trim() || '';
    // Match numbers with optional decimal, commas, currency symbols, Cr/Dr, parentheses
    const cleaned = cell.replace(/[₹$€£]/g, '').trim();
    if (/^[\-\+\(]?[\d,]+\.?\d*[\)]?(?:cr|dr)?$/i.test(cleaned)) {
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
    .replace(/\s/g, '')
    .trim();

  // Handle Cr/Dr notation (common in Indian banks)
  if (cleaned.toLowerCase().endsWith('cr')) {
    cleaned = cleaned.slice(0, -2);
  } else if (cleaned.toLowerCase().endsWith('dr')) {
    cleaned = '-' + cleaned.slice(0, -2);
  }

  // Handle parentheses for negative numbers: (123.45) -> -123.45
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }

  // Handle Indian number format (1,00,000 = 100000) and Western format (1,000 = 1000)
  // Indian format uses commas after every 2 digits from right (lakhs notation)
  // If we have pattern like 1,23,456 or 12,34,567 - remove commas to get 123456 or 1234567
  // If we have pattern like 1,234.56 - this is Western format with thousand separators
  // We need to detect which format is being used

  // Check for Indian format: has comma after 2 digits from right (e.g., 1,23,456 or 12,34,567)
  const indianFormatPattern = /^\d{1,2},\d{2},\d{3}(,\d{2})*$/;
  // Check for Western format: has comma after every 3 digits from right (e.g., 1,234,567)
  const westernFormatPattern = /^\d{1,3}(,\d{3})+$/;

  if (indianFormatPattern.test(cleaned)) {
    // Indian format: remove all commas
    cleaned = cleaned.replace(/,/g, '');
  } else if (westernFormatPattern.test(cleaned)) {
    // Western format: remove all commas
    cleaned = cleaned.replace(/,/g, '');
  } else if (/^\d{1,3},\d{2}$/.test(cleaned)) {
    // Likely Indian format like 1,00 or 12,34
    cleaned = cleaned.replace(/,/g, '');
  } else {
    // Mixed or other formats: remove commas only if followed by 3 digits pattern
    // This handles cases like "1,234.56" -> "1234.56" correctly
    cleaned = cleaned.replace(/,(?=\d{3})/g, '');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function getTransactionType(amount: number): 'credit' | 'debit' | null {
  if (amount > 0) return 'credit';
  if (amount < 0) return 'debit';
  // For zero amount transactions, return null - will need to be determined from context
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
