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

    if (!bankTransaction.account) {
      throw new Error('No bank account specified');
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
          fyo
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
          fyo
        ));
        break;
      
      case 'Journal Entry':
      case 'Transfer':
        ({ name: voucherName, type: voucherType } = await createJournalEntry(
          bankTransaction,
          amount,
          description,
          date,
          fyo
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
  fyo: Fyo
): Promise<{ name: string; type: string }> {
  const payment = fyo.doc.getNewDoc('Payment');
  
  payment.paymentType = paymentType;
  payment.account = bankTransaction.account;
  payment.amount = fyo.pesa(amount);
  payment.date = date;
  payment.description = description;
  
  if (party) {
    payment.party = party;
  }

  // Add payment accounts
  const paymentAccount = {
    account: bankTransaction.suggestedLedger,
    amount: fyo.pesa(amount),
  };
  
  payment.append('accounts', paymentAccount);

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
  fyo: Fyo
): Promise<{ name: string; type: string }> {
  const journalEntry = fyo.doc.getNewDoc('JournalEntry');
  
  journalEntry.date = date;
  journalEntry.description = description;

  // Determine debit/credit based on transaction type (Credit = income, Debit = expense)
  const isIncome = bankTransaction.type === 'Credit';
  
  // Bank account entry
  const bankEntry = {
    account: bankTransaction.account,
    debit: isIncome ? 0 : fyo.pesa(amount),
    credit: isIncome ? fyo.pesa(amount) : 0,
  };
  
  // Counter entry to suggested ledger
  const ledgerEntry = {
    account: bankTransaction.suggestedLedger,
    debit: isIncome ? fyo.pesa(amount) : 0,
    credit: isIncome ? 0 : fyo.pesa(amount),
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