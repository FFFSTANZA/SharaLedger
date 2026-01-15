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
        pattern: /interest received|int\.?\s+received|interest credit|int\s+cr|interest paid by bank|\binterest income\b/i,
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
        priority: 10,
      },
      {
        pattern: /\bsales\b|sales revenue|sales income|invoice payment|customer payment/i,
        category: 'income',
        account: 'Sales',
        reason: 'Sales revenue',
        priority: 10,
      },
      {
        pattern: /payment\s+from\s+client|payment\s+from\s+customer|payment\s+received\s+from/i,
        category: 'income',
        account: 'Sales',
        reason: 'Client payment received',
        priority: 10,
      },
      {
        pattern: /service\s+income|service\s+charge|service\s+fee|professional\s+fee|consulting\s+fee/i,
        category: 'income',
        account: 'Service Income',
        reason: 'Service income',
        priority: 10,
      },
      {
        pattern: /rental\s+income|rent\s+received|lease\s+income/i,
        category: 'income',
        account: 'Rental Income',
        reason: 'Rental income',
        priority: 10,
      },
      {
        pattern: /refund|cashback|cash\s+back/i,
        category: 'income',
        account: 'Other Income',
        reason: 'Refund received',
        priority: 8,
      },
      {
        pattern: /upi\/?\s*cr|upi\s+received|transfer\s+in|money\s+received|received\s+from/i,
        category: 'income',
        reason: 'Payment received',
        priority: 5,
      },
      {
        pattern: /neft.*cr|neft\s+in|neft\s+incoming|neft\s+received/i,
        category: 'income',
        reason: 'NEFT received',
        priority: 5,
      },
      {
        pattern: /imps.*cr|imps\s+received|instant\s+payment\s+received/i,
        category: 'income',
        reason: 'IMPS received',
        priority: 5,
      },
      {
        pattern: /rtgs.*cr|rtgs\s+received|rtgs\s+incoming/i,
        category: 'income',
        reason: 'RTGS received',
        priority: 5,
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
        reason: 'Cheque deposit',
        priority: 9,
      },
      {
        pattern: /\bgrant\b|subsidy|government\s+grant/i,
        category: 'income',
        account: 'Other Income',
        reason: 'Grant received',
        priority: 8,
      },

      // Expense patterns - Bank & Financial
      {
        pattern: /atm\s+withdrawal|atm\s+cash|atm\s+w\/d|atm\s+wd|cash\s+withdrawal|cwt/i,
        category: 'expense',
        account: 'Cash Withdrawals',
        reason: 'Cash withdrawal',
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
      
      // Vendor Payments & Purchases
      {
        pattern: /vendor\s+payment|supplier\s+payment|purchase|procurement/i,
        category: 'expense',
        account: 'Purchase',
        reason: 'Vendor payment',
        priority: 10,
      },
      {
        pattern: /equipment\s+purchase|office\s+equipment|asset\s+purchase|machinery|computer|laptop|furniture|fixture/i,
        category: 'expense',
        account: 'Purchase',
        reason: 'Asset/equipment purchase',
        priority: 10,
      },
      {
        pattern: /miscellaneous\s+business\s+expense|misc\s+expense|general\s+expense|other\s+expense/i,
        category: 'expense',
        account: 'General Expense',
        reason: 'Miscellaneous expense',
        priority: 9,
      },
      {
        pattern: /upi\/?\s*dr|upi\s+debit|upi\s+out|upi\s+payment|upi\s+to|pay\s+to/i,
        category: 'expense',
        account: 'Payments',
        reason: 'UPI payment',
        priority: 6,
      },
      {
        pattern: /neft.*dr|neft\s+out|neft\s+debit|neft\s+payment|neft\s+to/i,
        category: 'expense',
        account: 'Payments',
        reason: 'NEFT payment',
        priority: 6,
      },
      {
        pattern: /imps.*debit|imps\s+payment|imps\s+to/i,
        category: 'expense',
        account: 'Payments',
        reason: 'IMPS payment',
        priority: 6,
      },
      {
        pattern: /rtgs.*debit|rtgs\s+payment|rtgs\s+to/i,
        category: 'expense',
        account: 'Payments',
        reason: 'RTGS payment',
        priority: 6,
      },
      {
        pattern: /card\s+purchase|card\s+swipe|pos.*debit|pos\s+purchase|pos\s+txn|card\s+transaction/i,
        category: 'expense',
        account: 'Card Payments',
        reason: 'Card payment',
        priority: 6,
      },
      
      // Loans & EMI
      {
        pattern: /business\s+loan|term\s+loan|working\s+capital/i,
        category: 'expense',
        account: 'Loan Repayment',
        reason: 'Business loan payment',
        priority: 10,
      },
      {
        pattern: /emi.*debit|loan.*emi|emi\s+payment|emi\s+paid|instalment|installment/i,
        category: 'expense',
        account: 'Loan Repayment',
        reason: 'EMI payment',
        priority: 10,
      },
      {
        pattern: /interest.*debit|interest\s+payment|loan\s+interest/i,
        category: 'expense',
        account: 'Interest Expense',
        reason: 'Interest payment',
        priority: 10,
      },
      {
        pattern: /credit\s+card\s+payment|cc\s+payment|card\s+bill|outstanding\s+payment/i,
        category: 'expense',
        account: 'Credit Card Payments',
        reason: 'Credit card payment',
        priority: 10,
      },
      
      // Salaries & Staff
      {
        pattern: /\bsalary\b|salary\s+payment|wages|payroll|staff\s+payment|employee\s+salary/i,
        category: 'expense',
        account: 'Salaries and Wages',
        reason: 'Salary payment',
        priority: 10,
      },
      {
        pattern: /\bpf\b|provident\s+fund|epf|esic|employee\s+benefits/i,
        category: 'expense',
        account: 'Employee Benefits',
        reason: 'Employee benefits',
        priority: 10,
      },
      {
        pattern: /bonus|incentive|allowance/i,
        category: 'expense',
        account: 'Salaries and Wages',
        reason: 'Staff incentive',
        priority: 9,
      },
      
      // Office & Operations
      {
        pattern: /\brent\b|rent\s+payment|office\s+rent|lease\s+payment/i,
        category: 'expense',
        account: 'Rent',
        reason: 'Rent payment',
        priority: 10,
      },
      {
        pattern: /electricity|electric\s+bill|\bebill\b|power\s+bill|discom/i,
        category: 'expense',
        account: 'Utilities',
        reason: 'Electricity bill',
        priority: 10,
      },
      {
        pattern: /water\s+bill|water\s+charge|sewerage/i,
        category: 'expense',
        account: 'Utilities',
        reason: 'Water bill',
        priority: 10,
      },
      {
        pattern: /broadband|internet|wifi|wi-fi|isp|leased\s+line/i,
        category: 'expense',
        account: 'Internet & Communication',
        reason: 'Internet charges',
        priority: 10,
      },
      {
        pattern: /mobile|telephone|phone\s+bill|landline|airtel|jio|vodafone|vi\b|bsnl/i,
        category: 'expense',
        account: 'Telephone',
        reason: 'Telephone charges',
        priority: 10,
      },
      {
        pattern: /stationery|office\s+supplies|printing|photocopy/i,
        category: 'expense',
        account: 'Office Supplies',
        reason: 'Office supplies',
        priority: 9,
      },
      {
        pattern: /maintenance|repair|amc|annual\s+maintenance/i,
        category: 'expense',
        account: 'Maintenance',
        reason: 'Maintenance expense',
        priority: 9,
      },
      {
        pattern: /cleaning|housekeeping|security\s+service/i,
        category: 'expense',
        account: 'Office Expenses',
        reason: 'Office services',
        priority: 8,
      },
      
      // Insurance (Business)
      {
        pattern: /fire\s+insurance|property\s+insurance|office\s+insurance/i,
        category: 'expense',
        account: 'Insurance',
        reason: 'Property insurance',
        priority: 10,
      },
      {
        pattern: /liability\s+insurance|business\s+insurance|commercial\s+insurance/i,
        category: 'expense',
        account: 'Insurance',
        reason: 'Business insurance',
        priority: 10,
      },
      {
        pattern: /vehicle\s+insurance|car\s+insurance|motor\s+insurance|fleet\s+insurance/i,
        category: 'expense',
        account: 'Insurance',
        reason: 'Vehicle insurance',
        priority: 10,
      },
      {
        pattern: /group\s+insurance|staff\s+insurance|employee\s+insurance/i,
        category: 'expense',
        account: 'Employee Benefits',
        reason: 'Employee insurance',
        priority: 10,
      },
      
      // Business Travel & Transport
      {
        pattern: /fuel|petrol|diesel|cng|gas\s+station/i,
        category: 'expense',
        account: 'Fuel',
        reason: 'Fuel expense',
        priority: 9,
      },
      {
        pattern: /travel|trip|business\s+travel|tour/i,
        category: 'expense',
        account: 'Travel',
        reason: 'Travel expense',
        priority: 8,
      },
      {
        pattern: /flight|airline|air\s+ticket|indigo|spicejet|air\s+india/i,
        category: 'expense',
        account: 'Travel',
        reason: 'Flight expense',
        priority: 9,
      },
      {
        pattern: /train|railway|irctc/i,
        category: 'expense',
        account: 'Travel',
        reason: 'Train expense',
        priority: 9,
      },
      {
        pattern: /taxi|cab|uber|ola|rapido/i,
        category: 'expense',
        account: 'Travel',
        reason: 'Taxi expense',
        priority: 8,
      },
      {
        pattern: /hotel|accommodation|lodging/i,
        category: 'expense',
        account: 'Travel',
        reason: 'Hotel expense',
        priority: 9,
      },
      {
        pattern: /parking|toll|fastag/i,
        category: 'expense',
        account: 'Travel',
        reason: 'Parking/toll charges',
        priority: 8,
      },
      
      // Professional Services
      {
        pattern: /legal|lawyer|advocate|court\s+fee/i,
        category: 'expense',
        account: 'Legal & Professional',
        reason: 'Legal fees',
        priority: 10,
      },
      {
        pattern: /audit|auditor|ca\s+fee|chartered\s+accountant/i,
        category: 'expense',
        account: 'Legal & Professional',
        reason: 'Audit fees',
        priority: 10,
      },
      {
        pattern: /consultant|consulting|advisory/i,
        category: 'expense',
        account: 'Legal & Professional',
        reason: 'Consulting fees',
        priority: 9,
      },
      {
        pattern: /registration|license|permit|compliance/i,
        category: 'expense',
        account: 'Legal & Professional',
        reason: 'Registration fees',
        priority: 9,
      },
      
      // Marketing & Advertising
      {
        pattern: /advertisement|advertising|marketing|promotion/i,
        category: 'expense',
        account: 'Marketing',
        reason: 'Marketing expense',
        priority: 10,
      },
      {
        pattern: /google\s+ads|facebook\s+ads|social\s+media|digital\s+marketing/i,
        category: 'expense',
        account: 'Marketing',
        reason: 'Digital marketing',
        priority: 10,
      },
      {
        pattern: /website|domain|hosting|web\s+service/i,
        category: 'expense',
        account: 'IT & Software',
        reason: 'Website expense',
        priority: 9,
      },
      
      // Software & Technology
      {
        pattern: /software|saas|subscription|cloud\s+service/i,
        category: 'expense',
        account: 'IT & Software',
        reason: 'Software subscription',
        priority: 9,
      },
      {
        pattern: /microsoft|office\s+365|google\s+workspace|gsuite/i,
        category: 'expense',
        account: 'IT & Software',
        reason: 'Software license',
        priority: 9,
      },
      {
        pattern: /aws|azure|cloud|server|hosting/i,
        category: 'expense',
        account: 'IT & Software',
        reason: 'Cloud services',
        priority: 9,
      },
      
      // Training & Development
      {
        pattern: /training|workshop|seminar|conference|course/i,
        category: 'expense',
        account: 'Training',
        reason: 'Training expense',
        priority: 8,
      },
      {
        pattern: /certification|membership|professional\s+body/i,
        category: 'expense',
        account: 'Professional Fees',
        reason: 'Professional membership',
        priority: 8,
      },
      
      // Taxes
      {
        pattern: /income\s+tax|advance\s+tax|corporate\s+tax|tax\s+payment/i,
        category: 'expense',
        account: 'Taxes',
        reason: 'Income tax',
        priority: 10,
      },
      {
        pattern: /\btds\b|tax\s+deducted\s+at\s+source/i,
        category: 'expense',
        account: 'Taxes',
        reason: 'TDS',
        priority: 10,
      },
      {
        pattern: /\bgst\b|goods\s+and\s+services\s+tax|igst|cgst|sgst/i,
        category: 'expense',
        account: 'Taxes',
        reason: 'GST payment',
        priority: 10,
      },
      {
        pattern: /property\s+tax|municipal\s+tax|local\s+tax/i,
        category: 'expense',
        account: 'Taxes',
        reason: 'Property tax',
        priority: 10,
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

        // If we have an account, suggest it directly
        if (account) {
          // Just return the account name as text - no FK validation needed
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
    const txType = transaction.type?.toLowerCase();
    if (txType === 'credit') {
      let account = await this.findDefaultAccount('income');
      if (!account) {
        account = 'Other Income';
      }
      return {
        category: 'income',
        account,
        confidence: 0.3,
        reason: 'Credit transaction - default income account',
      };
    } else if (txType === 'debit') {
      let account = await this.findDefaultAccount('expense');
      if (!account) {
        account = 'General Expense';
      }
      return {
        category: 'expense',
        account,
        confidence: 0.3,
        reason: 'Debit transaction - default expense account',
      };
    }

    // Fallback
    let account = await this.findDefaultAccount('expense');
    if (!account) {
      account = 'General Expense';
    }
    return {
      category: 'expense',
      account,
      confidence: 0.1,
      reason: 'Uncategorized transaction - default account',
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

      // Sort parties by length (longer names first) to avoid false positives
      const sortedParties = parties.sort((a, b) => {
        const nameA = (a.name || '').length;
        const nameB = (b.name || '').length;
        return nameB - nameA;
      });

      // Try to find party name in description
      for (const party of sortedParties) {
        const partyName = party.name?.trim();
        if (!partyName) continue;

        const partyNameLower = partyName.toLowerCase();

        // Check for exact word match
        const partyNameRegex = new RegExp(`\\b${partyNameLower}\\b`, 'i');
        if (partyNameRegex.test(description)) {
          this.partiesCache.set(description, party.name);
          return party.name;
        }

        // Check for substring match (less strict)
        if (description.includes(partyNameLower)) {
          this.partiesCache.set(description, party.name);
          return party.name;
        }
      }

      // Try to extract potential party name from common patterns
      // Pattern: "Payment from/to [Party Name]" or "Client [Name]" etc.
      const fromMatch = description.match(/(?:from|to|client|customer|vendor|supplier)\s+([A-Za-z\s]+?)(?:\s+(?:via|by|using|through)|$)/i);
      if (fromMatch && fromMatch[1] && fromMatch[1].trim().length > 2) {
        const potentialParty = fromMatch[1].trim();

        // Check if this potential party name matches any existing party
        const matchingParty = parties.find(p => {
          const name = p.name?.toLowerCase() || '';
          return name.includes(potentialParty.toLowerCase()) ||
                 potentialParty.toLowerCase().includes(name);
        });

        if (matchingParty) {
          this.partiesCache.set(description, matchingParty.name);
          return matchingParty.name;
        }
      }

    } catch (error) {
      // Ignore errors
      console.warn('Error finding party from description:', error);
    }

    this.partiesCache.set(description, undefined);
    return undefined;
  }

  private async findDefaultAccount(category: 'income' | 'expense'): Promise<string | undefined> {
    try {
      const accountType = category === 'income' ? 'Income' : 'Expense';
      const accounts = await this.fyo.db.getAll<{ name: string; rootType: string }>('Account', {
        fields: ['name', 'rootType'],
        filters: { isGroup: false },
      });

      // Look for accounts matching the category type
      const matchingAccounts = accounts.filter(
        (a) => a.rootType === accountType
      );

      if (matchingAccounts.length > 0) {
        return matchingAccounts[0].name;
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  // Account type mappings for different categories
  private accountTypeMapping: Record<string, { rootType: string; accountType: string; parentAccount?: string }> = {
    // Income Accounts
    'Interest Income': { rootType: 'Income', accountType: 'Income Account' },
    'Dividend Income': { rootType: 'Income', accountType: 'Income Account' },
    'Commission Income': { rootType: 'Income', accountType: 'Income Account' },
    'Sales': { rootType: 'Income', accountType: 'Income Account' },
    'Service Income': { rootType: 'Income', accountType: 'Income Account' },
    'Rental Income': { rootType: 'Income', accountType: 'Income Account' },
    'Other Income': { rootType: 'Income', accountType: 'Income Account' },
    'Discounts': { rootType: 'Income', accountType: 'Income Account' },
    'Cash': { rootType: 'Asset', accountType: 'Cash' },
    'Gain/Loss on Asset Disposal': { rootType: 'Income', accountType: 'Income Account' },

    // Expense Accounts - Bank & Financial
    'Cash Withdrawals': { rootType: 'Expense', accountType: 'Expense Account' },
    'Bank Charges': { rootType: 'Expense', accountType: 'Expense Account' },
    'Interest Expense': { rootType: 'Expense', accountType: 'Expense Account' },

    // Expense Accounts - Payments
    'Purchase': { rootType: 'Expense', accountType: 'Expense Account' },
    'Payments': { rootType: 'Expense', accountType: 'Expense Account' },
    'Card Payments': { rootType: 'Expense', accountType: 'Expense Account' },

    // Expense Accounts - Loans & Credit
    'Loan Repayment': { rootType: 'Expense', accountType: 'Expense Account' },
    'Credit Card Payments': { rootType: 'Expense', accountType: 'Expense Account' },

    // Expense Accounts - Salaries & Staff
    'Salaries and Wages': { rootType: 'Expense', accountType: 'Expense Account' },
    'Employee Benefits': { rootType: 'Expense', accountType: 'Expense Account' },

    // Expense Accounts - Office & Operations
    'Rent': { rootType: 'Expense', accountType: 'Expense Account' },
    'Utilities': { rootType: 'Expense', accountType: 'Expense Account' },
    'Internet & Communication': { rootType: 'Expense', accountType: 'Expense Account' },
    'Telephone': { rootType: 'Expense', accountType: 'Expense Account' },
    'Office Supplies': { rootType: 'Expense', accountType: 'Expense Account' },
    'Maintenance': { rootType: 'Expense', accountType: 'Expense Account' },
    'Office Expenses': { rootType: 'Expense', accountType: 'Expense Account' },

    // Expense Accounts - Insurance
    'Insurance': { rootType: 'Expense', accountType: 'Expense Account' },

    // Expense Accounts - Travel & Transport
    'Fuel': { rootType: 'Expense', accountType: 'Expense Account' },
    'Travel': { rootType: 'Expense', accountType: 'Expense Account' },

    // Expense Accounts - Professional Services
    'Legal & Professional': { rootType: 'Expense', accountType: 'Expense Account' },
    'Professional Fees': { rootType: 'Expense', accountType: 'Expense Account' },

    // Expense Accounts - Marketing & IT
    'Marketing': { rootType: 'Expense', accountType: 'Expense Account' },
    'IT & Software': { rootType: 'Expense', accountType: 'Expense Account' },

    // Expense Accounts - Training
    'Training': { rootType: 'Expense', accountType: 'Expense Account' },

    // Expense Accounts - Taxes
    'Taxes': { rootType: 'Expense', accountType: 'Expense Account' },

    // Default Expense
    'General Expense': { rootType: 'Expense', accountType: 'Expense Account' },
  };

  private async ensureAccountExists(accountName: string): Promise<boolean> {
    try {
      // Check if account already exists
      const existing = await this.fyo.db.getDoc('Account', accountName);
      if (existing) return true;

      // Get account configuration
      const config = this.accountTypeMapping[accountName];
      if (!config) {
        console.warn(`No configuration for account: ${accountName}, will try to create with defaults`);
        // Try to create with defaults based on name
        const isExpense = /expense|charge|payment|tax|fee|wages|salary/i.test(accountName);
        const defaultConfig: any = {
          rootType: isExpense ? 'Expense' : 'Income',
          accountType: isExpense ? 'Expense Account' : 'Income Account',
        };
        await this.createAccount(accountName, defaultConfig);
        return true;
      }

      // Create the account (without parent for simplicity)
      await this.createAccount(accountName, config);
      return true;
    } catch (error) {
      console.error(`Failed to ensure account exists: ${accountName}`, error);
      return false;
    }
  }

  private async createAccount(
    accountName: string,
    config: { rootType: string; accountType: string; parentAccount?: string }
  ): Promise<void> {
    try {
      const account = this.fyo.doc.getNewDoc('Account');
      account.name = accountName;
      account.rootType = config.rootType;
      account.accountType = config.accountType;
      account.isGroup = false;
      if (config.parentAccount) {
        account.parentAccount = config.parentAccount;
      }
      await account.sync();
      console.log(`Created account: ${accountName} (${config.rootType} - ${config.accountType})`);
    } catch (error: any) {
      // If the error is that the account already exists, that's OK
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log(`Account ${accountName} already exists (created by another process)`);
        return;
      }
      throw error;
    }
  }

  private async createDefaultAccount(accountName: string, category: 'income' | 'expense'): Promise<void> {
    try {
      const accountType = category === 'income' ? 'Income Account' : 'Expense Account';
      const rootType = category === 'income' ? 'Income' : 'Expense';

      // Check if account already exists
      const existing = await this.fyo.db.getDoc('Account', accountName);
      if (existing) return;

      // Create the account
      const account = this.fyo.doc.getNewDoc('Account');
      account.name = accountName;
      account.rootType = rootType;
      account.accountType = accountType;
      account.isGroup = false;
      await account.sync();

      console.log(`Created default account: ${accountName} (${rootType} - ${accountType})`);
    } catch (error) {
      console.error(`Failed to create default account ${accountName}:`, error);
    }
  }

  async categorizeTransactions(
    transactions: ParsedTransaction[]
  ): Promise<CategorySuggestion[]> {
    return Promise.all(transactions.map((t) => this.suggestCategory(t)));
  }
}

export async function autoCategorizeTransaction(
  transaction: any,
  fyo: Fyo
): Promise<{ account: string | undefined; voucherType: string; party?: string }> {
  const categorizer = new TransactionCategorizer(fyo);
  const suggestion = await categorizer.suggestCategory({
    date: transaction.date || new Date(),
    description: transaction.description || '',
    amount: transaction.amount || 0,
    type: (transaction.type?.toLowerCase() as 'credit' | 'debit') || 'debit',
  });

  return {
    account: suggestion.account,
    party: suggestion.party,
    voucherType:
      suggestion.category === 'income'
        ? 'Receipt'
        : suggestion.category === 'transfer'
        ? 'Transfer'
        : 'Payment',
  };
}

export async function getCategorizedSuggestions(
  transactions: ParsedTransaction[],
  fyo: Fyo
): Promise<CategorySuggestion[]> {
  const categorizer = new TransactionCategorizer(fyo);
  return categorizer.categorizeTransactions(transactions);
}
