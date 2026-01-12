import { Money } from 'pesa';
import { Fyo } from 'fyo';

export type CategorizationRule = {
  name: string;
  descriptionPatterns: string[];
  partyName?: string;
  account?: string;
  tax?: string;
  paymentMode?: string;
  priority: number;
};

export type CategorizedTransaction = {
  party?: string;
  account?: string;
  tax?: string;
  confidence: number;
  matchedRule: string;
};

export class TransactionCategorizer {
  private fyo: Fyo;
  private rules: CategorizationRule[] = [];

  constructor(fyo: Fyo) {
    this.fyo = fyo;
  }

  async initialize() {
    await this.loadRules();
  }

  async loadRules() {
    this.rules = await this.getDefaultRules();
  }

  categorize(
    description: string,
    amount: Money,
    isDebit: boolean
  ): CategorizedTransaction | null {
    const normalizedDesc = this.normalizeDescription(description);
    const matches = this.findMatches(normalizedDesc, isDebit);

    if (matches.length === 0) {
      return null;
    }

    const bestMatch = matches[0];
    return {
      party: bestMatch.partyName,
      account: bestMatch.account,
      tax: bestMatch.tax,
      confidence: this.calculateConfidence(normalizedDesc, bestMatch),
      matchedRule: bestMatch.name,
    };
  }

  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .trim()
      .replaceAll(/\s+/g, ' ')
      .replaceAll(/[^\w\s]/g, '');
  }

  private findMatches(
    normalizedDesc: string,
    isDebit: boolean
  ): CategorizationRule[] {
    const matches: CategorizationRule[] = [];

    for (const rule of this.rules) {
      if (this.matchesRule(normalizedDesc, rule)) {
        matches.push(rule);
      }
    }

    return matches.sort((a, b) => b.priority - a.priority);
  }

  private matchesRule(description: string, rule: CategorizationRule): boolean {
    for (const pattern of rule.descriptionPatterns) {
      const normalizedPattern = this.normalizeDescription(pattern);
      if (description.includes(normalizedPattern)) {
        return true;
      }
    }
    return false;
  }

  private calculateConfidence(
    description: string,
    rule: CategorizationRule
  ): number {
    const patternCount = rule.descriptionPatterns.length;
    let matchCount = 0;

    for (const pattern of rule.descriptionPatterns) {
      const normalizedPattern = this.normalizeDescription(pattern);
      if (description.includes(normalizedPattern)) {
        matchCount++;
      }
    }

    return (matchCount / patternCount) * 100;
  }

  private async getDefaultRules(): Promise<CategorizationRule[]> {
    const accounts = await this.getIncomeExpenseAccounts();

    return [
      // Salary-related transactions
      {
        name: 'Salary Credit',
        descriptionPatterns: ['salary', 'payroll', 'wages', 'paycheck'],
        account: this.findAccountByKeywords(accounts.income, ['salary', 'wages']),
        priority: 90,
      },
      // Tax payments
      {
        name: 'Tax Payment',
        descriptionPatterns: ['tax', 'income tax', 'gst', 'vat', 'tcs', 'tds'],
        account: this.findAccountByKeywords(accounts.expense, ['tax']),
        priority: 95,
      },
      // Utility payments
      {
        name: 'Utilities',
        descriptionPatterns: [
          'electricity',
          'water',
          'gas',
          'power',
          'utility',
          'internet',
          'broadband',
        ],
        account: this.findAccountByKeywords(accounts.expense, ['utility', 'electricity', 'water', 'internet']),
        priority: 85,
      },
      // Rent
      {
        name: 'Rent Payment',
        descriptionPatterns: ['rent', 'lease'],
        account: this.findAccountByKeywords(accounts.expense, ['rent', 'lease']),
        priority: 90,
      },
      // Insurance
      {
        name: 'Insurance',
        descriptionPatterns: ['insurance', 'policy'],
        account: this.findAccountByKeywords(accounts.expense, ['insurance']),
        priority: 85,
      },
      // Bank charges
      {
        name: 'Bank Charges',
        descriptionPatterns: [
          'bank charge',
          'service charge',
          'maintenance fee',
          'atm fee',
        ],
        account: this.findAccountByKeywords(accounts.expense, ['bank charge', 'bank fee']),
        priority: 95,
      },
      // Loan payments
      {
        name: 'Loan Repayment',
        descriptionPatterns: ['loan repayment', 'emi', 'loan installment'],
        account: this.findAccountByKeywords(accounts.expense, ['loan', 'interest']),
        priority: 90,
      },
      // UPI transactions
      {
        name: 'UPI Transaction',
        descriptionPatterns: ['upi', '@', 'UPI'],
        paymentMode: 'UPI',
        priority: 70,
      },
      // ATM withdrawals
      {
        name: 'ATM Withdrawal',
        descriptionPatterns: ['atm', 'cash withdrawal'],
        paymentMode: 'Cash',
        priority: 90,
      },
      // POS transactions
      {
        name: 'POS Transaction',
        descriptionPatterns: ['pos', 'card payment', 'card purchase'],
        paymentMode: 'Card',
        priority: 80,
      },
      // NEFT/RTGS/IMPS
      {
        name: 'Bank Transfer',
        descriptionPatterns: ['neft', 'rtgs', 'imps', 'transfer'],
        paymentMode: 'Bank Transfer',
        priority: 85,
      },
      // Cheque transactions
      {
        name: 'Cheque Transaction',
        descriptionPatterns: ['cheque', 'chq'],
        paymentMode: 'Cheque',
        priority: 85,
      },
    ];
  }

  private async getIncomeExpenseAccounts(): Promise<{
    income: string[];
    expense: string[];
  }> {
    try {
      const accounts = (await this.fyo.db.getAll('Account', {
        fields: ['name', 'rootType', 'accountType'],
      })) as Array<{ name: string; rootType: string; accountType?: string }>;

      const income = accounts
        .filter((a) => a.rootType === 'Income' || a.accountType === 'Income Account')
        .map((a) => a.name);

      const expense = accounts
        .filter(
          (a) => a.rootType === 'Expense' || a.accountType === 'Expense Account'
        )
        .map((a) => a.name);

      return { income, expense };
    } catch {
      return { income: [], expense: [] };
    }
  }

  private findAccountByKeywords(accounts: string[], keywords: string[]): string {
    for (const keyword of keywords) {
      const match = accounts.find((acc) =>
        acc.toLowerCase().includes(keyword.toLowerCase())
      );
      if (match) {
        return match;
      }
    }
    return '';
  }

  async createCustomRule(rule: Partial<CategorizationRule>): Promise<void> {
    const fullRule: CategorizationRule = {
      name: rule.name ?? 'Custom Rule',
      descriptionPatterns: rule.descriptionPatterns ?? [],
      partyName: rule.partyName,
      account: rule.account,
      tax: rule.tax,
      paymentMode: rule.paymentMode,
      priority: rule.priority ?? 50,
    };

    this.rules.push(fullRule);
  }

  async getPartySuggestions(description: string): Promise<string[]> {
    const parties = await this.fyo.db.getAll('Party', {
      fields: ['name'],
    }) as Array<{ name: string }>;

    const normalizedDesc = this.normalizeDescription(description);
    const suggestions: Array<{ name: string; score: number }> = [];

    for (const party of parties) {
      const normalizedParty = this.normalizeDescription(party.name);
      const score = this.calculateSimilarity(normalizedDesc, normalizedParty);
      if (score > 50) {
        suggestions.push({ name: party.name, score });
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.name);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 100;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return ((longer.length - editDistance) / longer.length) * 100;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}

let categorizerInstance: TransactionCategorizer | null = null;

export async function getCategorizer(fyo: Fyo): Promise<TransactionCategorizer> {
  if (!categorizerInstance) {
    categorizerInstance = new TransactionCategorizer(fyo);
    await categorizerInstance.initialize();
  }
  return categorizerInstance;
}
