import { fyo } from '../initFyo';
import { ModelNameEnum } from 'models/types';
import { Doc } from 'fyo/model/doc';
import { t } from 'fyo';
import { DateTime } from 'luxon';
import { Money } from 'pesa';

export async function postBankTransactionToGL(transaction: Doc) {
  if (transaction.status === 'Reconciled') {
    throw new Error(t`Transaction is already reconciled`);
  }

  const {
    date,
    description,
    amount,
    type,
    bankAccount,
    account,
    party,
    reference,
  } = transaction.values;

  if (!account) {
    throw new Error(t`Please select a category account before posting`);
  }

  const amountMoney = amount as Money;
  const absAmount = amountMoney.abs();
  const dateObj = date as Date;
  const isoDate = DateTime.fromJSDate(dateObj).toISODate();

  let postedVoucher;
  let postedVoucherType;

  if (party) {
    // Create Payment
    postedVoucherType = ModelNameEnum.Payment;
    const payment = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
      date: isoDate + ' 00:00:00', // Ensure it's a valid datetime
      party,
      paymentType: type === 'Deposit' ? 'Receive' : 'Pay',
      // For bank transactions:
      // Deposit (Receive): Party pays to bank -> From: account, To: bankAccount
      // Withdrawal (Pay): Bank pays to party -> From: bankAccount, To: account
      account: type === 'Deposit' ? account : bankAccount, // From Account
      paymentAccount: type === 'Deposit' ? bankAccount : account, // To Account
      amount: absAmount,
      referenceId: reference,
      userRemark: description,
    });

    await payment.sync();
    postedVoucher = payment.name;
  } else {
    // Create Journal Entry
    postedVoucherType = ModelNameEnum.JournalEntry;
    
    const accounts = [];
    if (type === 'Deposit') {
       // Debit Bank, Credit Categorization Account
       accounts.push({
         account: bankAccount,
         debit: absAmount,
         credit: fyo.pesa(0),
       });
       accounts.push({
         account: account,
         debit: fyo.pesa(0),
         credit: absAmount,
       });
    } else {
       // Credit Bank, Debit Categorization Account
       accounts.push({
         account: bankAccount,
         debit: fyo.pesa(0),
         credit: absAmount,
       });
       accounts.push({
         account: account,
         debit: absAmount,
         credit: fyo.pesa(0),
       });
    }

    const je = fyo.doc.getNewDoc(ModelNameEnum.JournalEntry, {
      date: isoDate,
      entryType: 'Bank Entry',
      userRemark: description,
      referenceNumber: reference,
      accounts,
    });
    await je.sync();
    postedVoucher = je.name;
  }

  // Update transaction
  await transaction.set('status', 'Reconciled');
  await transaction.set('postedVoucher', postedVoucher);
  await transaction.set('postedVoucherType', postedVoucherType);
  await transaction.sync();
}
