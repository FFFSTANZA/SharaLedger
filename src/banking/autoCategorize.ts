import { Fyo } from 'fyo';

interface BankTransaction {
  name: string;
  description: string;
  amount: number;
  type: 'Credit' | 'Debit';
  account?: string;
  party?: string;
}

interface CategorySuggestion {
  account: string;
  party?: string;
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
  ],
  expense: [
    /payment to/i,
    /paid to/i,
    /transfer to/i,
    /debit.*supplier/i,
    /purchase/i,
    /expense/i,
    /bill/i,
  ],
  salary: [
    /salary/i,
    /payroll/i,
    /wages/i,
  ],
  rent: [
    /rent/i,
  ],
  utilities: [
    /electricity/i,
    /water/i,
    /internet/i,
    /phone/i,
    /utility/i,
  ],
  tax: [
    /tax/i,
    /gst/i,
    /vat/i,
    /tds/i,
  ],
};

export async function autoCategorizeTransaction(
  fyo: Fyo,
  transaction: BankTransaction
): Promise<CategorySuggestion | null> {
  const description = transaction.description.toLowerCase();
  const isCredit = transaction.type === 'Credit';

  // First, try to extract party name from description
  const party = extractPartyFromDescription(description);

  // Then, try pattern matching
  let accountName: string | null = null;
  
  // Check specific expense categories first
  if (PATTERNS.salary.some(pattern => pattern.test(description))) {
    accountName = 'Salary';
  } else if (PATTERNS.rent.some(pattern => pattern.test(description))) {
    accountName = 'Rent';
  } else if (PATTERNS.utilities.some(pattern => pattern.test(description))) {
    accountName = 'Utilities';
  } else if (PATTERNS.tax.some(pattern => pattern.test(description))) {
    accountName = 'Tax';
  } else if (isCredit && PATTERNS.income.some(pattern => pattern.test(description))) {
    accountName = 'Sales';
  } else if (!isCredit && PATTERNS.expense.some(pattern => pattern.test(description))) {
    accountName = 'Expenses';
  } else {
    // Default based on transaction type
    accountName = isCredit ? 'Sales' : 'Expenses';
  }

  // Try to find the account in the system
  const account = await findAccountByName(fyo, accountName);
  
  if (!account) {
    // Fallback to generic income/expense
    const fallbackName = isCredit ? 'Income' : 'Expense';
    const fallbackAccount = await findAccountByName(fyo, fallbackName);
    
    if (!fallbackAccount) {
      return null;
    }
    
    return {
      account: fallbackAccount,
      party: party || undefined,
      confidence: 0.3,
    };
  }

  return {
    account,
    party: party || undefined,
    confidence: party ? 0.8 : 0.6,
  };
}

function extractPartyFromDescription(description: string): string | null {
  // Try to extract party name from common patterns
  const patterns = [
    /(?:payment|received|transfer|from|to)\s+([A-Z][A-Za-z\s]+?)(?:\s|$|,)/,
    /([A-Z][A-Za-z\s]+?)(?:\s+payment|\s+invoice)/,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      const party = match[1].trim();
      // Only return if it looks like a valid name (2+ words or uppercase)
      if (party.includes(' ') || party === party.toUpperCase()) {
        return party;
      }
    }
  }

  return null;
}

async function findAccountByName(fyo: Fyo, name: string): Promise<string | null> {
  try {
    // Try exact match first
    const exactMatch = await fyo.db.getAllRaw('Account', {
      filters: { name },
      fields: ['name'],
    });

    if (exactMatch.length > 0) {
      return exactMatch[0].name as string;
    }

    // Try partial match
    const partialMatch = await fyo.db.getAllRaw('Account', {
      filters: {},
      fields: ['name'],
    });

    const found = partialMatch.find((acc: any) => 
      acc.name.toLowerCase().includes(name.toLowerCase())
    );

    return found ? (found.name as string) : null;
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
    if (transaction.account) {
      // Skip already categorized
      continue;
    }

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
  await doc.setAndSync({
    account: suggestion.account,
    party: suggestion.party || '',
  });
}
