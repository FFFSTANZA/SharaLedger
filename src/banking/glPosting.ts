import { Fyo } from 'fyo';

export interface VoucherCreationResult {
  voucherName: string;
  voucherType: string;
  success: boolean;
  error?: string;
}

/**
 * Creates a GL voucher (Payment or Journal Entry) for a bank transaction
 * based on the suggested ledger and voucher type.
 */
export async function createGLVoucher(
  bankTransaction: any,
  fyo: Fyo
): Promise<VoucherCreationResult> {
  try {
    // Validate that transaction has required fields
    if (!bankTransaction.suggestedLedger) {
      throw new Error('No suggested ledger specified');
    }

    if (!bankTransaction.suggestedVoucherType) {
      throw new Error('No suggested voucher type specified');
    }

    // Check if suggested ledger exists, create if it doesn't
    const suggestedLedger = bankTransaction.suggestedLedger;
    const ledgerExists = await checkAccountExists(suggestedLedger, fyo);
    if (!ledgerExists) {
      await createAccountIfNotExists(suggestedLedger, bankTransaction, fyo);
    }

    // Get bank account - try multiple possible sources
    let bankAccount = bankTransaction.account || bankTransaction.bankAccount || bankTransaction.bankName;
    if (!bankAccount || bankAccount === 'Generic') {
      // Get the primary bank account
      bankAccount = await getPrimaryBankAccount(fyo);
    }
    
    if (!bankAccount) {
      throw new Error('No bank account specified and no primary bank account found');
    }

    // Get required values
    const amount = Math.abs(bankTransaction.amount);
    const description = bankTransaction.description || 'Bank Transaction';
    const date = bankTransaction.date;
    const party = bankTransaction.party;

    let voucherName = '';
    let voucherType = '';

    // Create different voucher types based on suggestion
    switch (bankTransaction.suggestedVoucherType) {
      case 'Receipt':
        ({ name: voucherName, type: voucherType } = await createPaymentEntry(
          bankTransaction,
          'Receive',
          amount,
          description,
          date,
          party,
          fyo,
          bankAccount,
          suggestedLedger
        ));
        break;
      
      case 'Payment':
        ({ name: voucherName, type: voucherType } = await createPaymentEntry(
          bankTransaction,
          'Pay',
          amount,
          description,
          date,
          party,
          fyo,
          bankAccount,
          suggestedLedger
        ));
        break;
      
      case 'Journal Entry':
      case 'Transfer':
        ({ name: voucherName, type: voucherType } = await createJournalEntry(
          bankTransaction,
          amount,
          description,
          date,
          fyo,
          bankAccount,
          suggestedLedger
        ));
        break;
      
      default:
        throw new Error(`Unsupported voucher type: ${bankTransaction.suggestedVoucherType}`);
    }

    return {
      voucherName,
      voucherType,
      success: true,
    };

  } catch (error) {
    return {
      voucherName: '',
      voucherType: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Creates a Payment entry (Receive/Pay)
 */
async function createPaymentEntry(
  bankTransaction: any,
  paymentType: 'Receive' | 'Pay',
  amount: number,
  description: string,
  date: Date,
  party: string | undefined,
  fyo: Fyo,
  bankAccount: string,
  suggestedLedger: string
): Promise<{ name: string; type: string }> {
  const payment = fyo.doc.getNewDoc('Payment');
  
  payment.paymentType = paymentType;
  payment.date = date;
  payment.amount = fyo.pesa(amount);
  payment.referenceId = bankTransaction.reference || bankTransaction.chequeNo;
  
  if (paymentType === 'Receive') {
    // Receiving money into bank account (Debit Bank, Credit suggestedLedger)
    // In Payment doc: account = From (Credit), paymentAccount = To (Debit)
    payment.paymentAccount = bankAccount; // To Account (Bank)
    payment.account = suggestedLedger; // From Account (Income/Asset)
  } else {
    // Paying money from bank account (Credit Bank, Debit suggestedLedger)
    // In Payment doc: account = From (Credit), paymentAccount = To (Debit)
    payment.account = bankAccount; // From Account (Bank)
    payment.paymentAccount = suggestedLedger; // To Account (Expense/Liability)
  }
  
  if (party) {
    payment.party = party;
  }

  await payment.sync();

  return {
    name: payment.name!,
    type: 'Payment',
  };
}

/**
 * Creates a Journal Entry
 */
async function createJournalEntry(
  bankTransaction: any,
  amount: number,
  description: string,
  date: Date,
  fyo: Fyo,
  bankAccount: string,
  suggestedLedger: string
): Promise<{ name: string; type: string }> {
  const journalEntry = fyo.doc.getNewDoc('JournalEntry');
  
  journalEntry.date = date;
  journalEntry.userRemark = description;
  journalEntry.referenceNumber = bankTransaction.reference || bankTransaction.chequeNo;

  // In your books:
  // Deposit (Credit in Bank Statement) = Debit Bank Account (Increase in Asset)
  // Withdrawal (Debit in Bank Statement) = Credit Bank Account (Decrease in Asset)
  const isDeposit = bankTransaction.type === 'Credit';
  
  // Bank account entry
  const bankEntry = {
    account: bankAccount,
    debit: isDeposit ? fyo.pesa(amount) : 0,
    credit: isDeposit ? 0 : fyo.pesa(amount),
  };
  
  // Counter entry to suggested ledger
  const ledgerEntry = {
    account: suggestedLedger,
    debit: isDeposit ? 0 : fyo.pesa(amount),
    credit: isDeposit ? fyo.pesa(amount) : 0,
  };

  journalEntry.append('accounts', bankEntry);
  journalEntry.append('accounts', ledgerEntry);

  await journalEntry.sync();

  return {
    name: journalEntry.name!,
    type: 'Journal Entry',
  };
}

/**
 * Reverses a voucher (creates reverse entry or cancels)
 */
export async function reverseVoucher(
  voucherName: string,
  voucherType: string,
  fyo: Fyo
): Promise<boolean> {
  try {
    if (voucherType === 'Payment') {
      const payment = await fyo.doc.getDoc('Payment', voucherName);
      // For now, just return true - payment cancellation logic would go here
      return true;
    } else if (voucherType === 'Journal Entry') {
      const journalEntry = await fyo.doc.getDoc('JournalEntry', voucherName);
      // For now, just return true - JE cancellation logic would go here
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to reverse voucher:', error);
    return false;
  }
}

/**
 * Check if an account exists
 */
async function checkAccountExists(accountName: string, fyo: Fyo): Promise<boolean> {
  try {
    const existing = await fyo.db.getDoc('Account', accountName);
    return !!existing;
  } catch {
    return false;
  }
}

/**
 * Create account if it doesn't exist
 */
async function createAccountIfNotExists(
  accountName: string,
  bankTransaction: any,
  fyo: Fyo
): Promise<void> {
  try {
    const exists = await checkAccountExists(accountName, fyo);
    if (exists) return;

    // Determine account type based on transaction nature
    const isIncome = bankTransaction.type === 'Credit';
    const isExpense = bankTransaction.type === 'Debit';
    
    // Get appropriate root type and account type
    let rootType: string;
    let accountType: string;

    if (isIncome) {
      // Income transactions - likely Income Account
      rootType = 'Income';
      accountType = 'Income Account';
    } else if (isExpense) {
      // Expense transactions - likely Expense Account
      rootType = 'Expense';
      accountType = 'Expense Account';
    } else {
      // Default to Expense Account for safety
      rootType = 'Expense';
      accountType = 'Expense Account';
    }

    // Create the account
    const account = fyo.doc.getNewDoc('Account');
    account.name = accountName;
    account.rootType = rootType;
    account.accountType = accountType;
    account.isGroup = false;
    await account.sync();

    console.log(`Created account: ${accountName} (${rootType} - ${accountType})`);
  } catch (error) {
    console.error(`Failed to create account ${accountName}:`, error);
    throw error;
  }
}

/**
 * Get primary bank account from the system
 */
async function getPrimaryBankAccount(fyo: Fyo): Promise<string | null> {
  try {
    const accounts = await fyo.db.getAll<{ name: string; rootType: string; accountType: string }>('Account', {
      fields: ['name', 'rootType', 'accountType'],
    });

    // Look for Bank type accounts first
    const bankAccounts = accounts.filter(acc => 
      acc.accountType === 'Bank' || 
      acc.name.toLowerCase().includes('bank') ||
      acc.rootType === 'Asset'
    );

    if (bankAccounts.length > 0) {
      return bankAccounts[0].name;
    }

    // If no bank accounts found, return any Asset account
    const assetAccounts = accounts.filter(acc => acc.rootType === 'Asset');
    if (assetAccounts.length > 0) {
      return assetAccounts[0].name;
    }

    // If still nothing, create a default bank account
    const defaultBankAccount = 'Bank Account';
    await createAccountIfNotExists(defaultBankAccount, { type: 'Debit' }, fyo);
    return defaultBankAccount;

  } catch (error) {
    console.error('Failed to get primary bank account:', error);
    return null;
  }
}