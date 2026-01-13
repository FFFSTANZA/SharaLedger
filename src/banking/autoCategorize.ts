import { Fyo } from 'fyo';
import { ModelNameEnum } from 'models/types';

export interface CategorizationRule {
  keywords: string[];
  account: string;
  category: string;
}

export const DEFAULT_RULES: CategorizationRule[] = [
  { keywords: ['salary', 'wages'], account: 'Salary', category: 'Income' },
  { keywords: ['rent'], account: 'Rent Expense', category: 'Expense' },
  { keywords: ['electricity', 'water', 'utility'], account: 'Utilities', category: 'Expense' },
  { keywords: ['interest'], account: 'Interest Income', category: 'Income' },
  { keywords: ['bank charges', 'service charge'], account: 'Bank Charges', category: 'Expense' },
  { keywords: ['upi', 'paytm', 'gpay', 'phonepe'], account: 'General Expense', category: 'Expense' },
];

export class TransactionCategorizer {
  fyo: Fyo;

  constructor(fyo: Fyo) {
    this.fyo = fyo;
  }

  async suggestAccount(description: string): Promise<string | null> {
    const desc = description.toLowerCase();

    for (const rule of DEFAULT_RULES) {
      if (rule.keywords.some((kw) => desc.includes(kw.toLowerCase()))) {
        // Find matching account in the system
        const accounts = await this.fyo.db.getAll(ModelNameEnum.Account, {
          name: { like: `%${rule.account}%` },
        });

        if (accounts.length > 0) {
          return accounts[0].name as string;
        }
      }
    }

    return null;
  }
}
