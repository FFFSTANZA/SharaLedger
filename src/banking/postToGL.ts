import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';

interface BankTransaction {
  name: string;
  date: string;
  description: string;
  amount: number;
  type: 'Credit' | 'Debit';
  bankAccount: string;
  account?: string;
  party?: string;
  notes?: string;
  reference?: string;
  chequeNo?: string;
}

interface PostResult {
  success: boolean;
  voucherName?: string;
  voucherType?: string;
  error?: string;
}

export async function postBankTransactionToGL(
  fyo: Fyo,
  transaction: BankTransaction
): Promise<PostResult> {
  let createdVoucher: Doc | null = null;
  
  try {
    // Validate required fields
    if (!transaction.account || transaction.account.trim() === '') {
      return {
        success: false,
        error: 'Account is required to post to GL'
      };
    }

    if (!transaction.bankAccount || transaction.bankAccount.trim() === '') {
      return {
        success: false,
        error: 'Bank account is required'
      };
    }

    // Check if already reconciled
    const bankTxn = await fyo.doc.getDoc('BankTransaction', transaction.name);
    if (bankTxn.status === 'Reconciled') {
      return {
        success: false,
        error: 'Transaction is already reconciled'
      };
    }

    // Determine if we should create Payment or Journal Entry
    const shouldCreatePayment = !!transaction.party && transaction.party.trim() !== '';

    let voucher: Doc;
    
    try {
      if (shouldCreatePayment) {
        voucher = await createPaymentEntry(fyo, transaction);
      } else {
        voucher = await createJournalEntry(fyo, transaction);
      }
      createdVoucher = voucher;
    } catch (error: any) {
      throw new Error(`Failed to create voucher: ${error.message}`);
    }

    // Submit the voucher
    try {
      await voucher.submit();
    } catch (error: any) {
      throw new Error(`Failed to submit voucher: ${error.message}`);
    }

    // Update bank transaction with posted voucher info
    try {
      await bankTxn.setAndSync({
        status: 'Reconciled',
        postedVoucher: voucher.name,
        postedVoucherType: voucher.schemaName
      });
    } catch (error: any) {
      // Voucher is already submitted, log error but return success
      console.error('Failed to update bank transaction status:', error);
    }

    return {
      success: true,
      voucherName: voucher.name as string,
      voucherType: voucher.schemaName
    };
  } catch (error: any) {
    // If we created a voucher but failed later, try to delete it
    if (createdVoucher) {
      try {
        await createdVoucher.delete();
      } catch (deleteError) {
        console.error('Failed to cleanup failed voucher:', deleteError);
      }
    }
    
    return {
      success: false,
      error: error.message || 'Failed to post transaction'
    };
  }
}

async function createPaymentEntry(
  fyo: Fyo,
  transaction: BankTransaction
): Promise<Doc> {
  const isCredit = transaction.type === 'Credit';
  
  // Validate party exists
  if (!transaction.party) {
    throw new Error('Party is required for payment entries');
  }

  // Check if party exists, if not create it
  let partyExists = await fyo.db.exists('Party', transaction.party);
  if (!partyExists) {
    // Create party
    const newParty = fyo.doc.getNewDoc('Party');
    await newParty.set({
      name: transaction.party,
      role: isCredit ? 'Customer' : 'Supplier',
    });
    await newParty.sync();
  }
  
  // Create payment entry
  const payment = fyo.doc.getNewDoc(ModelNameEnum.Payment);
  
  // Set basic fields
  await payment.set({
    party: transaction.party,
    date: DateTime.fromISO(transaction.date).toJSDate(),
    paymentType: isCredit ? 'Receive' : 'Pay',
    amount: fyo.pesa(Math.abs(transaction.amount)),
    referenceId: transaction.reference || transaction.chequeNo || undefined,
    paymentMethod: 'Bank',
  });

  // Set accounts based on transaction type
  if (isCredit) {
    // Money coming in: From Party → To Bank
    await payment.set({
      account: transaction.account, // Party receivable account
      paymentAccount: transaction.bankAccount, // Bank account
    });
  } else {
    // Money going out: From Bank → To Party
    await payment.set({
      account: transaction.bankAccount, // Bank account
      paymentAccount: transaction.account, // Party payable account
    });
  }

  await payment.sync();
  return payment;
}

async function createJournalEntry(
  fyo: Fyo,
  transaction: BankTransaction
): Promise<Doc> {
  const isCredit = transaction.type === 'Credit';
  const amount = Math.abs(transaction.amount);
  
  // Validate account exists
  if (!transaction.account) {
    throw new Error('Account is required for journal entries');
  }

  const accountExists = await fyo.db.exists('Account', transaction.account);
  if (!accountExists) {
    throw new Error(`Account "${transaction.account}" does not exist`);
  }

  const bankAccountExists = await fyo.db.exists('Account', transaction.bankAccount);
  if (!bankAccountExists) {
    throw new Error(`Bank account "${transaction.bankAccount}" does not exist`);
  }
  
  // Create journal entry
  const je = fyo.doc.getNewDoc(ModelNameEnum.JournalEntry);
  
  await je.set({
    entryType: 'Bank Entry',
    date: DateTime.fromISO(transaction.date).toJSDate(),
    referenceNumber: transaction.reference || transaction.chequeNo || undefined,
    userRemark: transaction.notes || transaction.description || undefined,
  });

  // Add account entries
  const accounts = [];
  
  if (isCredit) {
    // Money coming in (Debit bank, Credit income/other account)
    accounts.push({
      account: transaction.bankAccount,
      debit: fyo.pesa(amount),
      credit: fyo.pesa(0),
    });
    accounts.push({
      account: transaction.account,
      debit: fyo.pesa(0),
      credit: fyo.pesa(amount),
    });
  } else {
    // Money going out (Credit bank, Debit expense/other account)
    accounts.push({
      account: transaction.bankAccount,
      debit: fyo.pesa(0),
      credit: fyo.pesa(amount),
    });
    accounts.push({
      account: transaction.account,
      debit: fyo.pesa(amount),
      credit: fyo.pesa(0),
    });
  }

  await je.set({ accounts });
  await je.sync();
  
  return je;
}

export async function postMultipleBankTransactions(
  fyo: Fyo,
  transactions: BankTransaction[]
): Promise<Map<string, PostResult>> {
  const results = new Map<string, PostResult>();
  
  for (const transaction of transactions) {
    const result = await postBankTransactionToGL(fyo, transaction);
    results.set(transaction.name, result);
    
    // Small delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}
