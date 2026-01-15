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
  try {
    // Validate required fields
    if (!transaction.account) {
      return {
        success: false,
        error: 'Account is required to post to GL'
      };
    }

    if (!transaction.bankAccount) {
      return {
        success: false,
        error: 'Bank account is required'
      };
    }

    // Determine if we should create Payment or Journal Entry
    const shouldCreatePayment = !!transaction.party;

    let voucher: Doc;
    
    if (shouldCreatePayment) {
      voucher = await createPaymentEntry(fyo, transaction);
    } else {
      voucher = await createJournalEntry(fyo, transaction);
    }

    // Submit the voucher
    await voucher.submit();

    // Update bank transaction with posted voucher info
    const bankTxn = await fyo.doc.getDoc('BankTransaction', transaction.name);
    await bankTxn.setAndSync({
      status: 'Reconciled',
      postedVoucher: voucher.name,
      postedVoucherType: voucher.schemaName
    });

    return {
      success: true,
      voucherName: voucher.name as string,
      voucherType: voucher.schemaName
    };
  } catch (error: any) {
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
  
  // Create payment entry
  const payment = fyo.doc.getNewDoc(ModelNameEnum.Payment);
  
  // Set basic fields
  await payment.set({
    party: transaction.party,
    date: DateTime.fromISO(transaction.date).toJSDate(),
    paymentType: isCredit ? 'Receive' : 'Pay',
    amount: fyo.pesa(transaction.amount),
    referenceId: transaction.reference || transaction.chequeNo,
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
  
  // Create journal entry
  const je = fyo.doc.getNewDoc(ModelNameEnum.JournalEntry);
  
  await je.set({
    entryType: 'Bank Entry',
    date: DateTime.fromISO(transaction.date).toJSDate(),
    referenceNumber: transaction.reference || transaction.chequeNo,
    userRemark: transaction.notes || transaction.description,
  });

  // Add account entries
  const accounts = [];
  
  if (isCredit) {
    // Money coming in (Credit to bank)
    accounts.push({
      account: transaction.bankAccount,
      debit: fyo.pesa(transaction.amount),
      credit: fyo.pesa(0),
    });
    accounts.push({
      account: transaction.account,
      debit: fyo.pesa(0),
      credit: fyo.pesa(transaction.amount),
    });
  } else {
    // Money going out (Debit from bank)
    accounts.push({
      account: transaction.bankAccount,
      debit: fyo.pesa(0),
      credit: fyo.pesa(transaction.amount),
    });
    accounts.push({
      account: transaction.account,
      debit: fyo.pesa(transaction.amount),
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
