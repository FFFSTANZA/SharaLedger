export const HEADER_KEYWORDS: Record<string, string[]> = {
  date: ['date', 'transaction date', 'txndate', 'value date', 'txn date', 'booking date'],
  description: ['description', 'particulars', 'narration', 'transaction details', 'remarks', 'memo'],
  withdrawal: ['withdrawal', 'debit', 'dr', 'payment', 'amount (dr)', 'withdrawal (dr)'],
  deposit: ['deposit', 'credit', 'cr', 'receipt', 'amount (cr)', 'deposit (cr)'],
  balance: ['balance', 'running balance', 'available balance', 'bal'],
  amount: ['amount', 'txn amount', 'transaction amount'],
  indicator: ['dr/cr', 'type', 'cr/dr', 'd/c', 'c/d'],
  referenceNumber: ['chq/ref no', 'ref no', 'reference number', 'cheque number', 'utr', 'instrument id', 'reference'],
};

export const INDIAN_BANK_HEADERS = [
  // ICICI
  ['Transaction Date', 'Value Date', 'Ref No./Cheque No.', 'Description', 'Withdrawal (Dr)', 'Deposit (Cr)', 'Balance'],
  // HDFC
  ['Date', 'Narration', 'Chq/Ref Number', 'Value Dt', 'Withdrawal Amt', 'Deposit Amt', 'Closing Balance'],
  // SBI
  ['Txn Date', 'Value Date', 'Description', 'Ref No./Cheque No.', 'Debit', 'Credit', 'Balance'],
  // Axis
  ['Tran Date', 'CHQNO', 'PARTICULARS', 'DR/CR', 'AMOUNT', 'BALANCE'],
];

export function detectColumnMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const [field, keywords] of Object.entries(HEADER_KEYWORDS)) {
    for (const keyword of keywords) {
      const index = lowerHeaders.findIndex((h) => h === keyword || h.includes(keyword));
      if (index !== -1) {
        mapping[field] = index;
        break;
      }
    }
  }

  return mapping;
}

export function findHeaderRow(rows: string[][]): { index: number; mapping: Record<string, number> } {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const mapping = detectColumnMapping(rows[i]);
    // If we found at least 3 columns (e.g. date, description, amount/withdrawal), it's likely the header row
    if (Object.keys(mapping).length >= 3) {
      return { index: i, mapping };
    }
  }
  return { index: 0, mapping: {} };
}

export function parseMoneyValue(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  let strValue = String(value).replace(/₹|Rs\.?|INR|,/g, '').trim();

  // Handle (100.00) for negative values
  if (strValue.startsWith('(') && strValue.endsWith(')')) {
    strValue = '-' + strValue.substring(1, strValue.length - 1);
  }

  // Handle 100.00- for negative values
  if (strValue.endsWith('-')) {
    strValue = '-' + strValue.substring(0, strValue.length - 1);
  }

  // Handle 100.00 Cr/Dr
  const isDr = strValue.toLowerCase().includes('dr');
  const isCr = strValue.toLowerCase().includes('cr');
  strValue = strValue.replace(/dr|cr/gi, '').trim();

  let num = parseFloat(strValue);
  if (isNaN(num)) return 0;

  if (isDr) return -Math.abs(num);
  // Deposits are positive
  return num;
}
