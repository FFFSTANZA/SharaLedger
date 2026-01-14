export interface ColumnMapping {
  date?: number;
  description?: number;
  amount?: number;
  type?: number;
  balance?: number;
  reference?: number;
  chequeNo?: number;
}

export interface BankMapping {
  bankName: string;
  keywords: string[];
  columnMapping: ColumnMapping;
  dateFormat?: string;
  exampleHeaders?: string[];
}

// Indian bank column mappings
export const bankMappings: BankMapping[] = [
  {
    bankName: 'HDFC Bank',
    keywords: ['hdfc', 'housing development finance corporation'],
    columnMapping: { date: 0, description: 1, amount: 2, balance: 3 },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: ['Date', 'Description', 'Amount', 'Balance'],
  },
  {
    bankName: 'State Bank of India',
    keywords: ['sbi', 'state bank of india', 'state bank'],
    columnMapping: {
      date: 0,
      description: 1,
      chequeNo: 2,
      amount: 3,
      balance: 4,
    },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: ['Txn Date', 'Description', 'Chq No', 'Amount', 'Balance'],
  },
  {
    bankName: 'ICICI Bank',
    keywords: ['icici', 'industrial credit and investment corporation'],
    columnMapping: { date: 0, description: 1, amount: 2, type: 3, balance: 4 },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: ['Date', 'Description', 'Amount', 'CR/DR', 'Balance'],
  },
  {
    bankName: 'Axis Bank',
    keywords: ['axis bank', 'utimf'],
    columnMapping: { date: 0, description: 1, amount: 2, balance: 3 },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: [
      'Date',
      'Particulars',
      'Withdrawals',
      'Deposits',
      'Balance',
    ],
  },
  {
    bankName: 'Yes Bank',
    keywords: ['yes bank'],
    columnMapping: { date: 0, description: 1, amount: 2, balance: 3 },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: [
      'Value Dt',
      'Transaction Date',
      'Description',
      'Amount',
      'Balance',
    ],
  },
  {
    bankName: 'Punjab National Bank',
    keywords: ['pnb', 'punjab national bank'],
    columnMapping: {
      date: 0,
      description: 1,
      chequeNo: 2,
      amount: 3,
      balance: 4,
    },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: ['Date', 'Particulars', 'Cheque No', 'Amount', 'Balance'],
  },
  {
    bankName: 'Bank of Baroda',
    keywords: ['baroda', 'bob', 'bank of baroda'],
    columnMapping: { date: 0, description: 1, amount: 2, balance: 3 },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: ['Date', 'Description', 'Amount', 'Balance'],
  },
  {
    bankName: 'Canara Bank',
    keywords: ['canara bank', 'canara'],
    columnMapping: { date: 0, description: 1, amount: 2, balance: 3 },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: ['Date', 'Description', 'Amount', 'Balance'],
  },
  {
    bankName: 'Union Bank of India',
    keywords: ['union bank', 'union bank of india'],
    columnMapping: { date: 0, description: 1, amount: 2, balance: 3 },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: ['Date', 'Description', 'Amount', 'Balance'],
  },
  {
    bankName: 'Indian Bank',
    keywords: ['indian bank'],
    columnMapping: { date: 0, description: 1, amount: 2, balance: 3 },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: ['Date', 'Description', 'Amount', 'Balance'],
  },
  {
    bankName: 'IDFC First Bank',
    keywords: ['idfc', 'idfc first'],
    columnMapping: { date: 0, description: 1, amount: 2, balance: 3 },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: ['Date', 'Description', 'Amount', 'Balance'],
  },
  {
    bankName: 'Kotak Mahindra Bank',
    keywords: ['kotak', 'kotak mahindra'],
    columnMapping: { date: 0, description: 1, amount: 2, balance: 3 },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: ['Date', 'Description', 'Amount', 'Balance'],
  },
  {
    bankName: 'Bandhan Bank',
    keywords: ['bandhan'],
    columnMapping: { date: 0, description: 1, amount: 2, balance: 3 },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: ['Date', 'Description', 'Amount', 'Balance'],
  },
  {
    bankName: 'Standard Chartered',
    keywords: ['standard chartered', 'stan chart'],
    columnMapping: { date: 0, description: 1, amount: 2, balance: 3 },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: ['Date', 'Description', 'Amount', 'Balance'],
  },
  {
    bankName: 'HSBC Bank',
    keywords: ['hsbc', 'hongkong and shanghai banking'],
    columnMapping: { date: 0, description: 1, amount: 2, balance: 3 },
    dateFormat: 'dd/MM/yyyy',
    exampleHeaders: ['Date', 'Description', 'Amount', 'Balance'],
  },
];

export function detectBankMapping(
  headers: string[],
  sampleRows: string[][]
): BankMapping | null {
  const headersText = headers.join(' ').toLowerCase();
  const allText =
    headersText +
    ' ' +
    sampleRows
      .slice(0, 3)
      .map((r) => r.join(' '))
      .join(' ')
      .toLowerCase();

  for (const mapping of bankMappings) {
    if (mapping.keywords.some((kw) => allText.includes(kw))) {
      return mapping;
    }
  }

  return null;
}

export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toLowerCase().trim() || '';

    // Date columns
    if (
      header.includes('date') ||
      header.includes('dt') ||
      header.includes('time')
    ) {
      mapping.date = i;
      continue;
    }

    // Description columns
    if (
      header.includes('description') ||
      header.includes('narrative') ||
      header.includes('particulars') ||
      header.includes('details') ||
      header.includes('memo') ||
      header.includes('remarks') ||
      header.includes('narration') ||
      header.includes('transaction')
    ) {
      mapping.description = i;
      continue;
    }

    // Amount columns
    if (
      (header.includes('amount') ||
        header.includes('rs') ||
        header.includes('inr') ||
        header.includes('value') ||
        header.includes('₹')) &&
      !header.includes('balance') &&
      !header.includes('closing')
    ) {
      mapping.amount = i;
      continue;
    }

    // Type column (CR/DR)
    if (
      header.includes('type') ||
      header.includes('cr') ||
      header.includes('dr') ||
      header.includes('credit') ||
      header.includes('debit') ||
      header.includes('withdrawal') ||
      header.includes('deposit')
    ) {
      mapping.type = i;
      continue;
    }

    // Balance columns
    if (
      header.includes('balance') ||
      header.includes('available') ||
      header.includes('closing') ||
      header.includes('running')
    ) {
      mapping.balance = i;
      continue;
    }

    // Reference columns
    if (
      header.includes('ref') ||
      header.includes('reference') ||
      header.includes('voucher') ||
      header.includes('slip')
    ) {
      mapping.reference = i;
      continue;
    }

    // Cheque number columns
    if (
      header.includes('cheque') ||
      header.includes('chq') ||
      header.includes('check')
    ) {
      mapping.chequeNo = i;
      continue;
    }
  }

  return mapping;
}

export function generateColumnSuggestions(headers: string[]): string[] {
  const suggestions: string[] = [];

  for (const header of headers) {
    const mapped = autoMapColumns([header]);
    if (mapped.date !== undefined) suggestions.push(`${header} → Date`);
    else if (mapped.description !== undefined)
      suggestions.push(`${header} → Description`);
    else if (mapped.amount !== undefined)
      suggestions.push(`${header} → Amount`);
    else if (mapped.balance !== undefined)
      suggestions.push(`${header} → Balance`);
    else if (mapped.type !== undefined) suggestions.push(`${header} → Type`);
    else if (mapped.reference !== undefined)
      suggestions.push(`${header} → Reference`);
    else if (mapped.chequeNo !== undefined)
      suggestions.push(`${header} → Cheque No`);
  }

  return suggestions;
}

export function getAllMappingHeaders(): string[] {
  return [
    'date',
    'description',
    'amount',
    'type',
    'balance',
    'reference',
    'chequeNo',
  ];
}
