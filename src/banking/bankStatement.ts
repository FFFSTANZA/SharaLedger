import { DateTime } from 'luxon';

export type DebitCredit = 'Debit' | 'Credit';

/**
 * Enhanced bank statement CSV column detection with better pattern matching
 */
export function detectBankStatementCsvColumns(
  headers: string[]
): BankStatementCsvColumns {
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
    ['description', 'narration', 'details', 'particulars', 'remarks'].some(
      (k) => h.includes(k)
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

  const balanceIdx = findIdx((h) =>
    ['balance', 'runningbalance', 'closingbalance'].some((k) => h.includes(k))
  );

  const referenceIdx = findIdx((h) =>
    ['reference', 'ref', 'transactionid', 'txnid', 'cheque', 'chequeno'].some(
      (k) => h.includes(k)
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
    balanceIdx,
    referenceIdx,
  };
}

export type BankStatementCsvColumns = {
  dateIdx: number;
  descriptionIdx: number;
  amountIdx?: number;
  debitIdx?: number;
  creditIdx?: number;
  debitCreditIdx?: number;
  balanceIdx?: number;
  referenceIdx?: number;
};

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
    'dd-MMM-yyyy',
    'MMM dd, yyyy',
    'dd MMM yyyy',
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

  // Handle various currency formats
  const normalized = v
    .replace(/,/g, '') // Remove commas
    .replace(/\s/g, '') // Remove spaces
    .replace(/[^0-9.-]/g, ''); // Keep only numbers, dots, and minus

  const num = Number.parseFloat(normalized);
  if (Number.isNaN(num)) {
    throw new Error(`Invalid amount: ${value}`);
  }

  return num;
}

function normalizeHashToken(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
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
  reference?: string;
}): string {
  const date = DateTime.fromJSDate(params.transactionDate).toISODate();
  const amount = Number(params.amount).toFixed(2);

  const payload = [
    date,
    amount,
    normalizeHashToken(params.description),
    normalizeHashToken(params.bankAccount),
    normalizeHashToken(params.reference || ''),
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
    columns.debitCreditIdx !== undefined
      ? row[columns.debitCreditIdx] ?? ''
      : '';

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

/**
 * Enhanced smart categorization based on transaction description with better pattern matching
 */
export interface CategorizationSuggestion {
  docType: 'Payment' | 'Receipt Entry' | 'Journal Entry';
  category: string;
  confidence: number;
  reason: string;
  suggestedAccount?: string;
}

export function categorizeTransaction(
  description: string,
  amount: number,
  debitCredit: DebitCredit
): CategorizationSuggestion {
  const desc = description.toLowerCase();

  // Enhanced payment patterns (money going out)
  const paymentPatterns = [
    {
      pattern: /transfer|wire|neft|imps|rtgs|online.*transfer/,
      category: 'Bank Transfer',
      confidence: 0.9,
    },
    {
      pattern: /atm|withdrawal|cash.*draw/,
      category: 'Cash Withdrawal',
      confidence: 0.9,
    },
    {
      pattern: /cheque|chq|chk|check.*payment/,
      category: 'Cheque Payment',
      confidence: 0.8,
    },
    {
      pattern: /utility|electricity|water|gas|internet|phone|bill.*payment/,
      category: 'Utilities',
      confidence: 0.8,
    },
    {
      pattern: /salary|wages|payroll|employee.*payment/,
      category: 'Salary Payment',
      confidence: 0.9,
    },
    {
      pattern: /rent|lease|property.*rent/,
      category: 'Rent Payment',
      confidence: 0.8,
    },
    {
      pattern: /vendor|supplier|purchase|procurement/,
      category: 'Vendor Payment',
      confidence: 0.7,
    },
    {
      pattern: /tax|gst|tds|income.*tax/,
      category: 'Tax Payment',
      confidence: 0.9,
    },
    {
      pattern: /insurance|premium|life.*insurance/,
      category: 'Insurance Payment',
      confidence: 0.8,
    },
    {
      pattern: /loan.*payment|emi|home.*loan/,
      category: 'Loan EMI',
      confidence: 0.8,
    },
    {
      pattern: /credit.*card|credit.*payment/,
      category: 'Credit Card Payment',
      confidence: 0.8,
    },
    {
      pattern: /subscription|netflix|spotify|software.*license/,
      category: 'Subscription',
      confidence: 0.7,
    },
  ];

  // Enhanced receipt patterns (money coming in)
  const receiptPatterns = [
    {
      pattern: /deposit|cash.*deposit|bank.*deposit/,
      category: 'Cash Deposit',
      confidence: 0.9,
    },
    {
      pattern: /interest|dividend|roi|return.*investment/,
      category: 'Investment Income',
      confidence: 0.9,
    },
    { pattern: /refund|return|reversal/, category: 'Refund', confidence: 0.8 },
    {
      pattern: /customer|client|sales|revenue/,
      category: 'Customer Receipt',
      confidence: 0.8,
    },
    {
      pattern: /loan|advance|borrowing/,
      category: 'Loan/Advance Receipt',
      confidence: 0.8,
    },
    {
      pattern: /freelance|consulting|service.*income/,
      category: 'Service Income',
      confidence: 0.8,
    },
    {
      pattern: /rent.*income|property.*income/,
      category: 'Rental Income',
      confidence: 0.8,
    },
  ];

  // Journal patterns (adjustments/transfers)
  const journalPatterns = [
    {
      pattern: /adjustment|correction|reversal|write.*off/,
      category: 'Adjustment Entry',
      confidence: 0.9,
    },
    {
      pattern: /opening|balance|carried.*forward/,
      category: 'Balance Transfer',
      confidence: 0.8,
    },
    {
      pattern: /commission|charges|fee|bank.*charge/,
      category: 'Bank Charges',
      confidence: 0.8,
    },
    {
      pattern: /forex|foreign.*exchange|currency.*exchange/,
      category: 'Forex Exchange',
      confidence: 0.8,
    },
    {
      pattern: /dividend|bonus|profit.*sharing/,
      category: 'Dividend Income',
      confidence: 0.8,
    },
  ];

  // Add more context-aware patterns
  const enhancedPatterns =
    debitCredit === 'Debit' ? paymentPatterns : receiptPatterns;
  const allPatterns = [...enhancedPatterns, ...journalPatterns];

  // First pass: exact pattern matching
  for (const { pattern, category, confidence } of allPatterns) {
    if (pattern.test(desc)) {
      const docType =
        debitCredit === 'Debit' ? 'Payment Entry' : 'Receipt Entry';
      return {
        docType: docType as 'Payment' | 'Receipt Entry',
        category,
        confidence,
        reason: `Pattern matched: ${pattern.source}`,
      };
    }
  }

  // Second pass: keyword-based fuzzy matching for better accuracy
  const keywordCategories: {
    [key: string]: { category: string; keywords: string[]; confidence: number };
  } = {
    Insurance: {
      category: 'Insurance Payment',
      keywords: ['policy', 'premium', 'claim'],
      confidence: 0.7,
    },
    Investment: {
      category: 'Investment Income',
      keywords: ['sip', 'mutual fund', 'equity', 'stock'],
      confidence: 0.7,
    },
    Food: {
      category: 'Food & Dining',
      keywords: ['restaurant', 'food', 'meal', 'dining'],
      confidence: 0.6,
    },
    Transport: {
      category: 'Transport',
      keywords: ['uber', 'ola', 'fuel', 'gas', 'petrol'],
      confidence: 0.6,
    },
    Healthcare: {
      category: 'Healthcare',
      keywords: ['hospital', 'medicine', 'doctor', 'medical'],
      confidence: 0.6,
    },
  };

  for (const [key, config] of Object.entries(keywordCategories)) {
    if (config.keywords.some((keyword) => desc.includes(keyword))) {
      const docType =
        debitCredit === 'Debit' ? 'Payment Entry' : 'Receipt Entry';
      return {
        docType: docType as 'Payment' | 'Receipt Entry',
        category: config.category,
        confidence: config.confidence,
        reason: `Keyword matched: ${key}`,
      };
    }
  }

  // Default categorization with better fallback logic
  const defaultDocType =
    debitCredit === 'Debit' ? 'Payment Entry' : 'Receipt Entry';
  const defaultCategory =
    debitCredit === 'Debit' ? 'General Expense' : 'General Income';

  return {
    docType: defaultDocType as 'Payment' | 'Receipt Entry',
    category: defaultCategory,
    confidence: 0.3,
    reason: 'Default categorization based on debit/credit direction',
  };
}

/**
 * Enhanced CSV row parsing with better error handling
 */
export interface EnhancedPreviewRow {
  rowIndex: number;
  transactionDate: Date;
  description: string;
  amount: number;
  debitCredit: DebitCredit;
  hash: string;
  isDuplicate: boolean;
  error?: string;
  reference?: string;
  balance?: number;
  categorization?: CategorizationSuggestion;
}

export function parseCsvRow(
  row: string[],
  columns: BankStatementCsvColumns,
  rowIndex: number,
  bankAccount: string,
  existingHashes: Set<string>,
  seenInFile: Set<string>
): EnhancedPreviewRow {
  const emptyRow = !row?.length || row.every((c) => !String(c ?? '').trim());

  if (emptyRow) {
    return {
      rowIndex,
      transactionDate: new Date(),
      description: '',
      amount: 0,
      debitCredit: 'Debit',
      hash: '',
      isDuplicate: false,
      error: 'Empty row',
    };
  }

  try {
    const transactionDate = parseStatementDate(row[columns.dateIdx] ?? '');

    const description = String(row[columns.descriptionIdx] ?? '').trim();

    const { amount, debitCredit } = parseDebitCredit({ row, columns });

    const reference =
      columns.referenceIdx !== undefined
        ? String(row[columns.referenceIdx] ?? '').trim()
        : undefined;

    const balance =
      columns.balanceIdx !== undefined
        ? parseStatementAmount(row[columns.balanceIdx] ?? '')
        : undefined;

    const hash = getBankStatementEntryHash({
      transactionDate,
      amount,
      description,
      bankAccount,
      reference,
    });

    const isDuplicate = seenInFile.has(hash);
    seenInFile.add(hash);

    const categorization = categorizeTransaction(
      description,
      amount,
      debitCredit
    );

    return {
      rowIndex,
      transactionDate,
      description,
      amount,
      debitCredit,
      hash,
      isDuplicate,
      reference,
      balance,
      categorization,
    };
  } catch (err) {
    return {
      rowIndex,
      transactionDate: new Date(),
      description: row.join(', '),
      amount: 0,
      debitCredit: 'Debit',
      hash: '',
      isDuplicate: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
