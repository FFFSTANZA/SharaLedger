import { Fyo } from 'fyo';
import {
  AccountRootType,
  COAChildAccount,
  COARootAccount,
  COATree,
} from 'models/baseModels/Account/types';
import { getCOAList } from 'models/baseModels/SetupWizard/SetupWizard';

const accountFields = ['accountType', 'accountNumber', 'rootType', 'isGroup'];

export class CreateCOA {
  fyo: Fyo;
  chartOfAccounts: string;

  constructor(chartOfAccounts: string, fyo: Fyo) {
    this.chartOfAccounts = chartOfAccounts;
    this.fyo = fyo;
  }

  async run() {
    const chart = await getCOA(this.chartOfAccounts);
    await this.createCOAAccounts(chart, null, '', true);
  }

  async createCOAAccounts(
    children: COATree | COARootAccount | COAChildAccount,
    parentAccount: string | null,
    rootType: AccountRootType | '',
    rootAccount: boolean
  ) {
    for (const rootName in children) {
      if (accountFields.includes(rootName)) {
        continue;
      }

      const child = children[rootName];

      if (rootAccount) {
        rootType = (child as COARootAccount).rootType;
      }

      const accountType = (child as COAChildAccount).accountType ?? '';
      const accountNumber = (child as COAChildAccount).accountNumber;
      const accountName = getAccountName(rootName, accountNumber);

      const isGroup = identifyIsGroup(
        child as COAChildAccount | COARootAccount
      );

      const doc = this.fyo.doc.getNewDoc('Account', {
        name: accountName,
        parentAccount,
        isGroup,
        rootType,
        accountType,
      });

      await doc.sync();
      await this.createCOAAccounts(
        child as COAChildAccount,
        accountName,
        rootType,
        false
      );
    }
  }
}

function identifyIsGroup(child: COARootAccount | COAChildAccount): boolean {
  if (child.isGroup !== undefined) {
    return child.isGroup as boolean;
  }

  const keys = Object.keys(child);
  const children = keys.filter((key) => !accountFields.includes(key));

  if (children.length) {
    return true;
  }

  return false;
}

async function getCOA(chartOfAccounts: string): Promise<COATree> {
  const coaList = getCOAList();
  const coa = coaList.find(({ name }) => name === chartOfAccounts);

  const conCode = coa?.countryCode;
  if (!conCode) {
    return getIndianCOA();
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const countryCoa = (await import(`../../fixtures/verified/${conCode}.json`))
      .default as { tree: COATree };
    return countryCoa.tree;
  } catch (e) {
    return getIndianCOA();
  }
}

function getIndianCOA(): COATree {
  // India-specific Chart of Accounts with GST tax accounts
  return {
    'Application of Funds (Assets)': {
      'Current Assets': {
        'Accounts Receivable': {
          'Sundry Debtors': {
            isGroup: false,
            accountType: 'Receivable',
          },
        },
        'Bank Accounts': {
          accountType: 'Bank',
          isGroup: true,
        },
        'Cash In Hand': {
          Cash: {
            accountType: 'Cash',
          },
          accountType: 'Cash',
        },
        'Loans and Advances (Assets)': {
          isGroup: true,
        },
        'Securities and Deposits': {
          'Earnest Money': {},
        },
        'Stock Assets': {
          'Stock-in-hand': {
            accountType: 'Stock',
          },
          accountType: 'Stock',
        },
        'Tax Assets': {
          isGroup: true,
        },
      },
      'Fixed Assets': {
        'Capital Equipment': {
          accountType: 'Fixed Asset',
        },
        'Electronic Equipment': {
          accountType: 'Fixed Asset',
        },
        'Furniture and Fixtures': {
          accountType: 'Fixed Asset',
        },
        'Office Equipment': {
          accountType: 'Fixed Asset',
        },
        'Plant and Machinery': {
          accountType: 'Fixed Asset',
        },
        Buildings: {
          accountType: 'Fixed Asset',
        },
        'Accumulated Depreciations': {
          accountType: 'Accumulated Depreciation',
        },
      },
      Investments: {
        isGroup: true,
      },
      'Temporary Accounts': {
        'Temporary Opening': {
          accountType: 'Temporary',
        },
      },
      rootType: 'Asset',
    },
    Expenses: {
      'Direct Expenses': {
        'Stock Expenses': {
          'Cost of Goods Sold': {
            accountType: 'Cost of Goods Sold',
          },
          'Expenses Included In Valuation': {
            accountType: 'Expenses Included In Valuation',
          },
          'Stock Adjustment': {
            accountType: 'Stock Adjustment',
          },
        },
      },
      'Indirect Expenses': {
        'Administrative Expenses': {},
        'Commission on Sales': {},
        Depreciation: {
          accountType: 'Depreciation',
        },
        'Entertainment Expenses': {},
        'Freight and Forwarding Charges': {
          accountType: 'Chargeable',
        },
        'Legal Expenses': {},
        'Marketing Expenses': {},
        'Miscellaneous Expenses': {},
        'Office Maintenance Expenses': {},
        'Office Rent': {},
        'Postal Expenses': {},
        'Printing and Stationery': {},
        'Rounded Off': {
          accountType: 'Round Off',
        },
        Salary: {},
        'Sales Expenses': {},
        'Telephone Expenses': {},
        'Travel Expenses': {},
        'Utility Expenses': {},
        'Write Off': {},
        'Exchange Gain/Loss': {},
        'Gain/Loss on Asset Disposal': {},
      },
      rootType: 'Expense',
    },
    Income: {
      'Direct Income': {
        Sales: {
          accountType: 'Income Account',
        },
        Service: {
          accountType: 'Income Account',
        },
        accountType: 'Income Account',
      },
      'Indirect Income': {
        accountType: 'Income Account',
        isGroup: true,
      },
      rootType: 'Income',
    },
    'Source of Funds (Liabilities)': {
      'Capital Account': {
        'Reserves and Surplus': {},
        'Shareholders Funds': {},
      },
      'Current Liabilities': {
        'Accounts Payable': {
          'Sundry Creditors': {
            accountType: 'Payable',
          },
          'Payroll Payable': {},
        },
        'Stock Liabilities': {
          'Stock Received But Not Billed': {
            accountType: 'Stock Received But Not Billed',
          },
        },
        'Duties and Taxes': {
          TDS: {
            accountType: 'Tax',
          },
          IGST: {
            accountType: 'Tax',
          },
          CGST: {
            accountType: 'Tax',
          },
          SGST: {
            accountType: 'Tax',
          },
          Exempt: {
            accountType: 'Tax',
          },
        },
        'Loans (Liabilities)': {
          'Secured Loans': {},
          'Unsecured Loans': {},
          'Bank Overdraft Account': {},
        },
      },
      rootType: 'Liability',
    },
  };
}

function getAccountName(accountName: string, accountNumber?: string) {
  if (accountNumber) {
    return `${accountName} - ${accountNumber}`;
  }

  return accountName;
}
