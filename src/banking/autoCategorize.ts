import { Fyo } from 'fyo';
import { ParsedTransaction } from './statementParser';

export interface CategorySuggestion {
  category: 'income' | 'expense' | 'transfer';
  account?: string;
  party?: string;
  confidence: number;
  reason: string;
}

interface CategoryRule {
  pattern: RegExp;
  category: 'income' | 'expense' | 'transfer';
  account?: string;
  reason: string;
  priority?: number;
}

export class TransactionCategorizer {
  private fyo: Fyo;
  private rules: CategoryRule[];
  private accountsCache: Map<string, string[]>;
  private partiesCache: Map<string, string>;

  constructor(fyo: Fyo) {
    this.fyo = fyo;
    this.accountsCache = new Map();
    this.partiesCache = new Map();
    this.rules = this.initializeRules();
  }

  private initializeRules(): CategoryRule[] {
    return [
      // Income patterns
      {
        pattern: /salary| salary|monthly salary|net salary|slary/i,
        category: 'income',
        account: 'Salaries and Wages',
        reason: 'Salary payment',
        priority: 10,
      },
      {
        pattern: /interest received|int\.? received|interest credit/i,
        category: 'income',
        account: 'Interest Income',
        reason: 'Interest income',
        priority: 10,
      },
      {
        pattern: /dividend/i,
        category: 'income',
        account: 'Dividend Income',
        reason: 'Dividend received',
        priority: 10,
      },
      {
        pattern: /refund|return|reimbursement/i,
        category: 'income',
        reason: 'Refund or reimbursement',
        priority: 8,
      },
      {
        pattern: /upi\/\s*cr|u pi received|transfer in/i,
        category: 'income',
        reason: 'UPI transfer received',
        priority: 7,
      },
      {
        pattern: /neft.*cr|neft in|neft incoming/i,
        category: 'income',
        reason: 'NEFT transfer received',
        priority: 7,
      },
      {
        pattern: /imps|instant payment/i,
        category: 'income',
        reason: 'IMPS transfer received',
        priority: 7,
      },
      {
        pattern: /rtgs/i,
        category: 'income',
        reason: 'RTGS transfer received',
        priority: 7,
      },
      {
        pattern: /cash deposit|cash deposit at|cash deposit in/i,
        category: 'income',
        account: 'Cash',
        reason: 'Cash deposit',
        priority: 6,
      },
      {
        pattern: /cheque deposit|cheque clearing|clearing credit/i,
        category: 'income',
        reason: 'Cheque deposit cleared',
        priority: 6,
      },
      {
        pattern: /emi.*credit|loan.*credit/i,
        category: 'income',
        reason: 'EMI or loan credit',
        priority: 5,
      },

      // Expense patterns
      {
        pattern: /atm withdrawal|atm cash|atm debit/i,
        category: 'expense',
        account: 'Cash Withdrawals',
        reason: 'ATM withdrawal',
        priority: 10,
      },
      {
        pattern: /upi\/\s*dr|upi debit|upi out|u pi payment/i,
        category: 'expense',
        account: 'Payments',
        reason: 'UPI payment',
        priority: 9,
      },
      {
        pattern: /neft.*dr|neft out|neft debit|neft payment/i,
        category: 'expense',
        account: 'Payments',
        reason: 'NEFT payment',
        priority: 9,
      },
      {
        pattern: /imps.*debit|imps payment/i,
        category: 'expense',
        account: 'Payments',
        reason: 'IMPS payment',
        priority: 9,
      },
      {
        pattern: /rtgs.*debit|rtgs payment/i,
        category: 'expense',
        account: 'Payments',
        reason: 'RTGS payment',
        priority: 9,
      },
      {
        pattern: /card purchase|card swipe|pos.*debit|pos purchase/i,
        category: 'expense',
        account: 'Card Payments',
        reason: 'Card payment at merchant',
        priority: 8,
      },
      {
        pattern: /emi.*debit|loan.*emi|emi payment/i,
        category: 'expense',
        account: 'Loan Repayment',
        reason: 'EMI payment',
        priority: 10,
      },
      {
        pattern: /insurance premium|insurance payment/i,
        category: 'expense',
        account: 'Insurance',
        reason: 'Insurance premium payment',
        priority: 9,
      },
      {
        pattern: /mutual fund| sip /i,
        category: 'expense',
        account: 'Investments',
        reason: 'Mutual fund or SIP investment',
        priority: 8,
      },
      {
        pattern: /bill payment|electricity|water|gas|power/i,
        category: 'expense',
        account: 'Utilities',
        reason: 'Utility bill payment',
        priority: 8,
      },
      {
        pattern: /mobile|recharge|telephone/i,
        category: 'expense',
        account: 'Telephone',
        reason: 'Mobile/telephone recharge',
        priority: 7,
      },
      {
        pattern: /rent|rent payment/i,
        category: 'expense',
        account: 'Rent',
        reason: 'Rent payment',
        priority: 9,
      },
      {
        pattern: /medical|health|hospital|pharma/i,
        category: 'expense',
        account: 'Medical Expenses',
        reason: 'Medical expense',
        priority: 8,
      },
      {
        pattern: /tax|tax deduction|tds|gst/i,
        category: 'expense',
        account: 'Taxes',
        reason: 'Tax payment or deduction',
        priority: 10,
      },
      {
        pattern: /bank charges|service charge|maintenance charge/i,
        category: 'expense',
        account: 'Bank Charges',
        reason: 'Bank charges',
        priority: 10,
      },
      {
        pattern: /subscription|netflix|amazon prime|hotstar|spotify/i,
        category: 'expense',
        account: 'Subscriptions',
        reason: 'Subscription payment',
        priority: 6,
      },
      {
        pattern: /shopping|amazon|flipkart|myntra/i,
        category: 'expense',
        account: 'Shopping',
        reason: 'Online shopping',
        priority: 5,
      },
      {
        pattern: /fuel|petrol|diesel|gas station/i,
        category: 'expense',
        account: 'Fuel',
        reason: 'Fuel expense',
        priority: 7,
      },
      {
        pattern: /food|restaurant|hotel|zomato|swiggy/i,
        category: 'expense',
        account: 'Food and Entertainment',
        reason: 'Food or dining expense',
        priority: 5,
      },
      {
        pattern: /transfer|fund transfer/i,
        category: 'transfer',
        reason: 'Fund transfer',
        priority: 5,
      },
      {
        pattern: /cheque bounce|cheque returned|insufficient funds/i,
        category: 'expense',
        account: 'Bank Charges',
        reason: 'Cheque bounce charges',
        priority: 10,
      },
    ];
  }

  async suggestCategory(
    transaction: ParsedTransaction
  ): Promise<CategorySuggestion> {
    const description = transaction.description.toLowerCase();

    // Sort rules by priority
    const sortedRules = [...this.rules].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );

    for (const rule of sortedRules) {
      if (rule.pattern.test(description)) {
        let account = rule.account;

        // If no specific account, try to find matching account in chart of accounts
        if (!account && rule.category !== 'transfer') {
          account = await this.findMatchingAccount(rule.category, description);
        }

        const party = await this.findPartyFromDescription(description);

        return {
          category: rule.category,
          account,
          party,
          confidence: (rule.priority || 5) / 10,
          reason: rule.reason,
        };
      }
    }

    // Default categorization based on transaction type
    if (transaction.type === 'credit') {
      return {
        category: 'income',
        confidence: 0.3,
        reason: 'Credit transaction',
      };
    } else if (transaction.type === 'debit') {
      return {
        category: 'expense',
        confidence: 0.3,
        reason: 'Debit transaction',
      };
    }

    return {
      category: 'expense',
      confidence: 0.1,
      reason: 'Uncategorized transaction',
    };
  }

  private async findMatchingAccount(
    category: 'income' | 'expense',
    description: string
  ): Promise<string | undefined> {
    const cacheKey = `${category}-${description.slice(0, 20)}`;
    if (this.accountsCache.has(cacheKey)) {
      return this.accountsCache.get(cacheKey);
    }

    try {
      const accountType = category === 'income' ? 'Income' : 'Expense';
      const accounts = await this.fyo.db.getAll<{ name: string }>('Account', {
        filters: { isGroup: false },
        fields: ['name'],
      });

      // Find accounts matching the category
      const matchingAccounts = accounts.filter(
        (a) =>
          a.name.toLowerCase().includes(accountType.toLowerCase()) ||
          a.name.toLowerCase().includes(description.slice(0, 10).toLowerCase())
      );

      const result =
        matchingAccounts.length > 0 ? matchingAccounts[0].name : undefined;
      this.accountsCache.set(cacheKey, result);
      return result;
    } catch {
      return undefined;
    }
  }

  private async findPartyFromDescription(
    description: string
  ): Promise<string | undefined> {
    if (this.partiesCache.has(description)) {
      return this.partiesCache.get(description);
    }

    try {
      const parties = await this.fyo.db.getAll<{ name: string }>('Party', {
        fields: ['name'],
      });

      // Try to find party name in description
      for (const party of parties) {
        const partyName = party.name?.toLowerCase() ?? '';
        if (description.includes(partyName)) {
          this.partiesCache.set(description, party.name);
          return party.name;
        }
      }
    } catch {
      // Ignore errors
    }

    return undefined;
  }

  async categorizeTransactions(
    transactions: ParsedTransaction[]
  ): Promise<CategorySuggestion[]> {
    return Promise.all(transactions.map((t) => this.suggestCategory(t)));
  }
}

export async function getCategorizedSuggestions(
  transactions: ParsedTransaction[],
  fyo: Fyo
): Promise<CategorySuggestion[]> {
  const categorizer = new TransactionCategorizer(fyo);
  return categorizer.categorizeTransactions(transactions);
}
