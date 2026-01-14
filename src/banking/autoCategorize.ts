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
        pattern: /\bsalary\b|monthly salary|net salary|salary payment|sal credit|salary credited/i,
        category: 'income',
        account: 'Salaries and Wages',
        reason: 'Salary payment',
        priority: 10,
      },
      {
        pattern: /\bpension\b|pension payment|retirement benefit/i,
        category: 'income',
        account: 'Pension Income',
        reason: 'Pension payment',
        priority: 10,
      },
      {
        pattern: /interest received|int\.?\s+received|interest credit|int\s+cr|interest paid by bank/i,
        category: 'income',
        account: 'Interest Income',
        reason: 'Interest income',
        priority: 10,
      },
      {
        pattern: /\bdividend\b|dividend received|dividend income/i,
        category: 'income',
        account: 'Dividend Income',
        reason: 'Dividend received',
        priority: 10,
      },
      {
        pattern: /commission received|commission income|agent commission/i,
        category: 'income',
        account: 'Commission Income',
        reason: 'Commission earned',
        priority: 9,
      },
      {
        pattern: /refund|return|reimbursement|cashback|cash back/i,
        category: 'income',
        reason: 'Refund or reimbursement',
        priority: 8,
      },
      {
        pattern: /freelance|consulting|professional fee|service income/i,
        category: 'income',
        account: 'Professional Fees',
        reason: 'Professional income',
        priority: 8,
      },
      {
        pattern: /upi\/?\s*cr|upi\s+received|transfer\s+in|money\s+received|received\s+from/i,
        category: 'income',
        reason: 'UPI transfer received',
        priority: 7,
      },
      {
        pattern: /neft.*cr|neft\s+in|neft\s+incoming|neft\s+received/i,
        category: 'income',
        reason: 'NEFT transfer received',
        priority: 7,
      },
      {
        pattern: /imps.*cr|imps\s+received|instant\s+payment\s+received/i,
        category: 'income',
        reason: 'IMPS transfer received',
        priority: 7,
      },
      {
        pattern: /rtgs.*cr|rtgs\s+received|rtgs\s+incoming/i,
        category: 'income',
        reason: 'RTGS transfer received',
        priority: 7,
      },
      {
        pattern: /cash\s+deposit|cash\s+deposited\s+at|cash\s+dep|cdn/i,
        category: 'income',
        account: 'Cash',
        reason: 'Cash deposit',
        priority: 9,
      },
      {
        pattern: /cheque\s+deposit|cheque\s+clearing|clearing\s+credit|chq\s+dep|clg/i,
        category: 'income',
        reason: 'Cheque deposit cleared',
        priority: 9,
      },
      {
        pattern: /\bgrant\b|donation\s+received|gift\s+received/i,
        category: 'income',
        reason: 'Grant or donation received',
        priority: 7,
      },

      // Expense patterns - Bank & Financial
      {
        pattern: /atm\s+withdrawal|atm\s+cash|atm\s+w\/d|atm\s+wd|cash\s+withdrawal|cwt/i,
        category: 'expense',
        account: 'Cash Withdrawals',
        reason: 'ATM withdrawal',
        priority: 10,
      },
      {
        pattern: /bank\s+charges|service\s+charge|maintenance\s+charge|annual\s+fee|sms\s+charges|minimum\s+balance|non\-maintenance/i,
        category: 'expense',
        account: 'Bank Charges',
        reason: 'Bank charges',
        priority: 10,
      },
      {
        pattern: /cheque\s+bounce|cheque\s+returned|insufficient\s+funds|chq\s+return/i,
        category: 'expense',
        account: 'Bank Charges',
        reason: 'Cheque bounce charges',
        priority: 10,
      },
      {
        pattern: /debit\s+card\s+fee|credit\s+card\s+fee|card\s+annual\s+fee/i,
        category: 'expense',
        account: 'Bank Charges',
        reason: 'Card fees',
        priority: 10,
      },
      
      // Payments & Transfers
      {
        pattern: /upi\/?\s*dr|upi\s+debit|upi\s+out|upi\s+payment|upi\s+to|pay\s+to/i,
        category: 'expense',
        account: 'Payments',
        reason: 'UPI payment',
        priority: 9,
      },
      {
        pattern: /neft.*dr|neft\s+out|neft\s+debit|neft\s+payment|neft\s+to/i,
        category: 'expense',
        account: 'Payments',
        reason: 'NEFT payment',
        priority: 9,
      },
      {
        pattern: /imps.*debit|imps\s+payment|imps\s+to/i,
        category: 'expense',
        account: 'Payments',
        reason: 'IMPS payment',
        priority: 9,
      },
      {
        pattern: /rtgs.*debit|rtgs\s+payment|rtgs\s+to/i,
        category: 'expense',
        account: 'Payments',
        reason: 'RTGS payment',
        priority: 9,
      },
      {
        pattern: /card\s+purchase|card\s+swipe|pos.*debit|pos\s+purchase|pos\s+txn|card\s+transaction/i,
        category: 'expense',
        account: 'Card Payments',
        reason: 'Card payment at merchant',
        priority: 8,
      },
      
      // Loans & EMI
      {
        pattern: /emi.*debit|loan.*emi|emi\s+payment|emi\s+paid|instalment|installment/i,
        category: 'expense',
        account: 'Loan Repayment',
        reason: 'EMI payment',
        priority: 10,
      },
      {
        pattern: /home\s+loan|housing\s+loan|mortgage/i,
        category: 'expense',
        account: 'Loan Repayment',
        reason: 'Home loan payment',
        priority: 10,
      },
      {
        pattern: /car\s+loan|vehicle\s+loan|auto\s+loan/i,
        category: 'expense',
        account: 'Loan Repayment',
        reason: 'Car loan payment',
        priority: 10,
      },
      {
        pattern: /personal\s+loan|pl\s+emi/i,
        category: 'expense',
        account: 'Loan Repayment',
        reason: 'Personal loan payment',
        priority: 10,
      },
      {
        pattern: /credit\s+card\s+payment|cc\s+payment|card\s+bill|outstanding\s+payment/i,
        category: 'expense',
        account: 'Credit Card Payments',
        reason: 'Credit card bill payment',
        priority: 10,
      },
      
      // Insurance
      {
        pattern: /insurance\s+premium|insurance\s+payment|life\s+insurance|lic\s+premium/i,
        category: 'expense',
        account: 'Insurance',
        reason: 'Insurance premium payment',
        priority: 10,
      },
      {
        pattern: /health\s+insurance|medical\s+insurance|mediclaim/i,
        category: 'expense',
        account: 'Insurance',
        reason: 'Health insurance premium',
        priority: 10,
      },
      {
        pattern: /vehicle\s+insurance|car\s+insurance|motor\s+insurance/i,
        category: 'expense',
        account: 'Insurance',
        reason: 'Vehicle insurance premium',
        priority: 10,
      },
      
      // Investments
      {
        pattern: /mutual\s+fund|\bmf\b|\bsip\b|systematic\s+investment/i,
        category: 'expense',
        account: 'Investments',
        reason: 'Mutual fund or SIP investment',
        priority: 9,
      },
      {
        pattern: /stock\s+purchase|equity\s+purchase|share\s+purchase|trading/i,
        category: 'expense',
        account: 'Investments',
        reason: 'Stock market investment',
        priority: 9,
      },
      {
        pattern: /\bfd\b|fixed\s+deposit|recurring\s+deposit|\brd\b/i,
        category: 'expense',
        account: 'Investments',
        reason: 'Fixed/Recurring deposit',
        priority: 9,
      },
      
      // Utilities & Bills
      {
        pattern: /electricity|electric\s+bill|\bebill\b|power\s+bill|discom/i,
        category: 'expense',
        account: 'Utilities',
        reason: 'Electricity bill payment',
        priority: 9,
      },
      {
        pattern: /water\s+bill|water\s+charge|sewerage/i,
        category: 'expense',
        account: 'Utilities',
        reason: 'Water bill payment',
        priority: 9,
      },
      {
        pattern: /\bgas\b|lpg|cooking\s+gas|piped\s+gas/i,
        category: 'expense',
        account: 'Utilities',
        reason: 'Gas bill payment',
        priority: 9,
      },
      {
        pattern: /broadband|internet|wifi|wi-fi|isp/i,
        category: 'expense',
        account: 'Telephone',
        reason: 'Internet bill payment',
        priority: 8,
      },
      {
        pattern: /mobile|recharge|telephone|phone\s+bill|airtel|jio|vodafone|vi\b|bsnl/i,
        category: 'expense',
        account: 'Telephone',
        reason: 'Mobile/telephone recharge',
        priority: 8,
      },
      {
        pattern: /dth|cable|tv\s+recharge|dish/i,
        category: 'expense',
        account: 'Utilities',
        reason: 'DTH/Cable recharge',
        priority: 7,
      },
      
      // Housing
      {
        pattern: /\brent\b|rent\s+payment|house\s+rent|flat\s+rent|apartment\s+rent/i,
        category: 'expense',
        account: 'Rent',
        reason: 'Rent payment',
        priority: 10,
      },
      {
        pattern: /maintenance|society\s+dues|hoa\s+fee|condo\s+fee/i,
        category: 'expense',
        account: 'Rent',
        reason: 'Society maintenance',
        priority: 9,
      },
      
      // Shopping & Retail
      {
        pattern: /amazon|amzn|amazon\.in/i,
        category: 'expense',
        account: 'Shopping',
        reason: 'Amazon purchase',
        priority: 7,
      },
      {
        pattern: /flipkart|fkrt/i,
        category: 'expense',
        account: 'Shopping',
        reason: 'Flipkart purchase',
        priority: 7,
      },
      {
        pattern: /myntra|ajio|meesho/i,
        category: 'expense',
        account: 'Shopping',
        reason: 'Fashion shopping',
        priority: 7,
      },
      {
        pattern: /reliance|dmart|big\s+bazaar|more\s+supermarket|grocery/i,
        category: 'expense',
        account: 'Shopping',
        reason: 'Grocery shopping',
        priority: 7,
      },
      {
        pattern: /shopping|retail|mall|store/i,
        category: 'expense',
        account: 'Shopping',
        reason: 'Shopping expense',
        priority: 5,
      },
      
      // Food & Dining
      {
        pattern: /zomato|swiggy|uber\s+eats|dunzo/i,
        category: 'expense',
        account: 'Food and Entertainment',
        reason: 'Food delivery',
        priority: 8,
      },
      {
        pattern: /restaurant|hotel|cafe|coffee|starbucks|ccd|mcdonald|mcdonalds|kfc|dominos|pizza|burger/i,
        category: 'expense',
        account: 'Food and Entertainment',
        reason: 'Food or dining expense',
        priority: 7,
      },
      {
        pattern: /food|dining|meal/i,
        category: 'expense',
        account: 'Food and Entertainment',
        reason: 'Food expense',
        priority: 5,
      },
      
      // Transport & Travel
      {
        pattern: /fuel|petrol|diesel|gas\s+station|hp\s+petrol|indian\s+oil|bharat\s+petroleum/i,
        category: 'expense',
        account: 'Fuel',
        reason: 'Fuel expense',
        priority: 9,
      },
      {
        pattern: /uber|ola|rapido|taxi|cab/i,
        category: 'expense',
        account: 'Travel',
        reason: 'Taxi/cab fare',
        priority: 8,
      },
      {
        pattern: /flight|airline|air\s+ticket|indigo|spicejet|air\s+india/i,
        category: 'expense',
        account: 'Travel',
        reason: 'Flight booking',
        priority: 8,
      },
      {
        pattern: /train|railway|irctc|tatkal/i,
        category: 'expense',
        account: 'Travel',
        reason: 'Train booking',
        priority: 8,
      },
      {
        pattern: /bus|redbus|abhibus/i,
        category: 'expense',
        account: 'Travel',
        reason: 'Bus booking',
        priority: 8,
      },
      {
        pattern: /parking|toll|fastag/i,
        category: 'expense',
        account: 'Travel',
        reason: 'Parking or toll charges',
        priority: 7,
      },
      
      // Entertainment & Subscriptions
      {
        pattern: /netflix|amazon\s+prime|hotstar|disney|zee5|sonyliv|voot/i,
        category: 'expense',
        account: 'Subscriptions',
        reason: 'Streaming subscription',
        priority: 8,
      },
      {
        pattern: /spotify|apple\s+music|youtube\s+music|gaana|jiosaavn/i,
        category: 'expense',
        account: 'Subscriptions',
        reason: 'Music subscription',
        priority: 8,
      },
      {
        pattern: /subscription|membership|annual\s+fee/i,
        category: 'expense',
        account: 'Subscriptions',
        reason: 'Subscription payment',
        priority: 6,
      },
      {
        pattern: /movie|cinema|pvr|inox|ticket|bookmyshow/i,
        category: 'expense',
        account: 'Food and Entertainment',
        reason: 'Entertainment expense',
        priority: 7,
      },
      {
        pattern: /gym|fitness|sports|yoga/i,
        category: 'expense',
        account: 'Subscriptions',
        reason: 'Fitness subscription',
        priority: 7,
      },
      
      // Healthcare
      {
        pattern: /medical|health|hospital|clinic|doctor|physician/i,
        category: 'expense',
        account: 'Medical Expenses',
        reason: 'Medical expense',
        priority: 9,
      },
      {
        pattern: /pharmacy|pharma|medicine|drug\s+store|chemist|apollo|medplus/i,
        category: 'expense',
        account: 'Medical Expenses',
        reason: 'Pharmacy purchase',
        priority: 9,
      },
      {
        pattern: /lab\s+test|diagnostic|pathology|scan|x-ray/i,
        category: 'expense',
        account: 'Medical Expenses',
        reason: 'Medical test expense',
        priority: 9,
      },
      
      // Education
      {
        pattern: /school\s+fee|tuition|college\s+fee|university|education/i,
        category: 'expense',
        account: 'Education',
        reason: 'Education expense',
        priority: 9,
      },
      {
        pattern: /book|stationery|course|training|workshop|seminar/i,
        category: 'expense',
        account: 'Education',
        reason: 'Educational material',
        priority: 6,
      },
      
      // Taxes
      {
        pattern: /income\s+tax|advance\s+tax|self\s+assessment\s+tax/i,
        category: 'expense',
        account: 'Taxes',
        reason: 'Income tax payment',
        priority: 10,
      },
      {
        pattern: /\btds\b|tax\s+deducted\s+at\s+source/i,
        category: 'expense',
        account: 'Taxes',
        reason: 'TDS deduction',
        priority: 10,
      },
      {
        pattern: /\bgst\b|goods\s+and\s+services\s+tax/i,
        category: 'expense',
        account: 'Taxes',
        reason: 'GST payment',
        priority: 10,
      },
      {
        pattern: /property\s+tax|municipal\s+tax/i,
        category: 'expense',
        account: 'Taxes',
        reason: 'Property tax',
        priority: 10,
      },
      
      // Donations & Charity
      {
        pattern: /donation|charity|ngo|temple|church|mosque|gurudwara/i,
        category: 'expense',
        account: 'Donations',
        reason: 'Donation or charity',
        priority: 8,
      },
      
      // Generic Transfer
      {
        pattern: /transfer|fund\s+transfer|money\s+transfer/i,
        category: 'transfer',
        reason: 'Fund transfer',
        priority: 3,
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
