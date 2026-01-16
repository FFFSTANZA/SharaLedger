import { Fyo } from 'fyo';
import { DateTime } from 'luxon';

interface BankTransaction {
  name: string;
  date: string;
  description: string;
  amount: number;
  type: 'Credit' | 'Debit';
  bankAccount: string;
  account?: string;
  party?: string;
}

export interface CategorySuggestion {
  account?: string;
  party?: string;
  matchingVoucher?: string;
  matchingVoucherType?: string;
  confidence: number;
}

// Common patterns for auto-categorization
const PATTERNS = {
  income: [
    /payment from/i,
    /received from/i,
    /transfer from/i,
    /credit.*customer/i,
    /invoice.*paid/i,
    /sales/i,
    /neft.*in/i,
    /rtgs.*in/i,
    /upi.*in/i,
  ],
  expense: [
    /payment to/i,
    /paid to/i,
    /transfer to/i,
    /debit.*supplier/i,
    /purchase/i,
    /expense/i,
    /bill/i,
    /neft.*out/i,
    /rtgs.*out/i,
    /upi.*out/i,
    /charges/i,
    /fee/i,
  ],
  salary: [/salary/i, /payroll/i, /wages/i],
  rent: [/rent/i],
  utilities: [/electricity/i, /water/i, /internet/i, /phone/i, /utility/i],
  tax: [/tax/i, /gst/i, /vat/i, /tds/i, /income tax/i],
  bank: [/interest/i, /dividend/i, /bank charges/i, /service charge/i],
};

export async function autoCategorizeTransaction(
  fyo: Fyo,
  transaction: BankTransaction
): Promise<CategorySuggestion | null> {
  const description = transaction.description.toLowerCase();
  const isCredit = transaction.type === 'Credit';
  const amount = Math.abs(transaction.amount);

  // 1. Try to find a matching voucher first (High confidence)
  const match = await findMatchingVoucher(fyo, transaction);
  if (match) {
    return {
      matchingVoucher: match.name,
      matchingVoucherType: match.type,
      confidence: 0.95,
    };
  }

  // 2. Try to extract party name from description
  const party = await extractPartyFromDescription(fyo, description);

  // 3. Try pattern matching for accounts
  let accountName: string | null = null;

  if (PATTERNS.salary.some((pattern) => pattern.test(description))) {
    accountName = 'Salary';
  } else if (PATTERNS.rent.some((pattern) => pattern.test(description))) {
    accountName = 'Rent';
  } else if (PATTERNS.utilities.some((pattern) => pattern.test(description))) {
    accountName = 'Utilities';
  } else if (PATTERNS.tax.some((pattern) => pattern.test(description))) {
    accountName = 'Tax';
  } else if (PATTERNS.bank.some((pattern) => pattern.test(description))) {
    accountName = isCredit ? 'Bank Interest' : 'Bank Charges';
  } else if (isCredit && PATTERNS.income.some((pattern) => pattern.test(description))) {
    accountName = 'Sales';
  } else if (!isCredit && PATTERNS.expense.some((pattern) => pattern.test(description))) {
    accountName = 'Expenses';
  }

  // If we found a party, it's likely a receivable/payable account
  if (party && !accountName) {
    accountName = isCredit ? 'Sales' : 'Expenses';
  }

  if (!accountName) {
    // Default based on transaction type
    accountName = isCredit ? 'Income' : 'Expense';
  }

  // Try to find the account in the system
  const account = await findAccountByName(fyo, accountName);

  if (!account) {
    // Fallback to generic income/expense if possible
    const fallbackName = isCredit ? 'Income' : 'Expense';
    const fallbackAccount = await findAccountByName(fyo, fallbackName);

    return {
      account: fallbackAccount || undefined,
      party: party || undefined,
      confidence: party ? 0.7 : 0.3,
    };
  }

  return {
    account,
    party: party || undefined,
    confidence: party ? 0.85 : 0.6,
  };
}

async function findMatchingVoucher(
  fyo: Fyo,
  transaction: BankTransaction
): Promise<{ name: string; type: string } | null> {
  const amount = Math.abs(transaction.amount);
  const date = DateTime.fromISO(transaction.date);
  const isCredit = transaction.type === 'Credit';

  // Search in Payments
  // Receive (Credit) or Pay (Debit)
  const paymentType = isCredit ? 'Receive' : 'Pay';
  
  // Look for payments with same amount and bank account
  // within 7 days before or after the transaction date
  const startDate = date.minus({ days: 10 }).toISODate();
  const endDate = date.plus({ days: 10 }).toISODate();

  try {
    const payments = await fyo.db.getAllRaw('Payment', {
      filters: {
        paymentType,
        amount: fyo.pesa(amount),
        // We can't easily filter by date range in getAllRaw without complex syntax
        // so we'll filter in JS for now or use a more advanced query if possible
      },
      fields: ['name', 'date', 'account', 'paymentAccount'],
    });

    const matchingPayment = payments.find((p: any) => {
      const pDate = DateTime.fromJSDate(new Date(p.date));
      const dayDiff = Math.abs(pDate.diff(date, 'days').days);
      
      // Check if one of the accounts is the bank account
      const hasBank = p.account === transaction.bankAccount || p.paymentAccount === transaction.bankAccount;
      
      return dayDiff <= 7 && hasBank;
    });

    if (matchingPayment) {
      return { name: matchingPayment.name as string, type: 'Payment' };
    }

    // Search in Journal Entries as well
    // This is more complex because JE has multiple rows
    // For now, let's stick to Payments as it's the most common for bank reconciliation
    
  } catch (error) {
    console.error('Error finding matching voucher:', error);
  }

  return null;
}

async function extractPartyFromDescription(fyo: Fyo, description: string): Promise<string | null> {
  // 1. Try to see if any existing party name is in the description
  try {
    const parties = await fyo.db.getAllRaw('Party', { fields: ['name'] });
    for (const p of parties) {
      const partyName = (p.name as string).toLowerCase();
      if (partyName.length > 3 && description.includes(partyName)) {
        return p.name as string;
      }
    }
  } catch (error) {
    console.error('Error fetching parties for extraction:', error);
  }

  // 2. Try regex patterns
  const patterns = [
    /(?:payment|received|transfer|from|to)\s+([A-Z][A-Za-z0-9\s\.\&]+?)(?:\s|$|,)/i,
    /([A-Z][A-Za-z0-9\s\.\&]+?)(?:\s+payment|\s+invoice)/i,
    /NEFT\s+\d+\s+([A-Z][A-Za-z0-9\s\.\&]+?)(?:\s|$)/i,
    /UPI\/(?:[A-Z0-9]+)\/([A-Z][A-Za-z0-9\s\.\&]+?)\//i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      const party = match[1].trim();
      if (party.length > 2) {
        // Check if this extracted name exists as a party
        const exists = await fyo.db.exists('Party', party);
        if (exists) return party;
        
        // If it's all uppercase and multiple words, it's likely a party name
        if (party === party.toUpperCase() && party.includes(' ')) {
          return party;
        }
      }
    }
  }

  return null;
}

async function findAccountByName(fyo: Fyo, name: string): Promise<string | null> {
  try {
    // Try exact match first
    const exactMatch = await fyo.db.getAllRaw('Account', {
      filters: { name, isGroup: false },
      fields: ['name'],
    });

    if (exactMatch.length > 0) {
      return exactMatch[0].name as string;
    }

    // Try case-insensitive exact match
    const accounts = await fyo.db.getAllRaw('Account', {
      filters: { isGroup: false },
      fields: ['name'],
    });

    const caseMatch = accounts.find(
      (acc: any) => acc.name.toLowerCase() === name.toLowerCase()
    );
    if (caseMatch) return caseMatch.name as string;

    // Try partial match
    const partialMatch = accounts.find((acc: any) =>
      acc.name.toLowerCase().includes(name.toLowerCase())
    );

    return partialMatch ? (partialMatch.name as string) : null;
  } catch (error) {
    console.error('Error finding account:', error);
    return null;
  }
}

export async function autoCategorizeMultiple(
  fyo: Fyo,
  transactions: BankTransaction[]
): Promise<Map<string, CategorySuggestion>> {
  const results = new Map<string, CategorySuggestion>();

  for (const transaction of transactions) {
    // Only suggest if not already reconciled
    const suggestion = await autoCategorizeTransaction(fyo, transaction);
    if (suggestion) {
      results.set(transaction.name, suggestion);
    }
  }

  return results;
}

export async function applyCategorization(
  fyo: Fyo,
  transactionName: string,
  suggestion: CategorySuggestion
): Promise<void> {
  const doc = await fyo.doc.getDoc('BankTransaction', transactionName);
  const updateData: any = {};
  
  if (suggestion.matchingVoucher) {
    updateData.matchingVoucher = suggestion.matchingVoucher;
    updateData.matchingVoucherType = suggestion.matchingVoucherType;
    // If there is a matching voucher, we can also set the account and party from it
    try {
        const voucher = await fyo.doc.getDoc(suggestion.matchingVoucherType!, suggestion.matchingVoucher);
        if (voucher.schemaName === 'Payment') {
            updateData.party = voucher.party;
            updateData.account = voucher.paymentType === 'Receive' ? voucher.account : voucher.paymentAccount;
        }
    } catch (e) {
        console.error('Failed to get voucher details for categorization', e);
    }
  } else {
    if (suggestion.account) updateData.account = suggestion.account;
    if (suggestion.party) updateData.party = suggestion.party;
  }
  
  if (Object.keys(updateData).length > 0) {
    await doc.setAndSync(updateData);
  }
}
