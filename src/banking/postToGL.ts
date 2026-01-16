import { fyo } from '../initFyo';
import { ModelNameEnum } from 'models/types';
import { Doc } from 'fyo/model/doc';
import { t } from 'fyo';

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

  let postedVoucher;
  let postedVoucherType;

  if (party) {
    // Create Payment
    postedVoucherType = ModelNameEnum.Payment;
    const payment = await fyo.doc.create(ModelNameEnum.Payment, {
      date: date + ' 00:00:00', // Ensure it's a valid datetime
      party,
      paymentType: type === 'Deposit' ? 'Receive' : 'Pay',
      paymentAccount: bankAccount, // This is the Bank/Cash account
      account: account, // categorization account or Party account side
      amount: Math.abs(amount),
      referenceId: reference,
      userRemark: description,
    });
    
    // In Frappe Books, if party is set, 'account' usually should be the party's receivable/payable account.
    // If we have 'account' from categorization, we use it. 
    // But usually Payment doc handles party account automatically if we just set party.
    // Let's re-check how Payment.vue handles it.
    
    await payment.save();
    postedVoucher = payment.name;
  } else {
    // Create Journal Entry
    postedVoucherType = ModelNameEnum.JournalEntry;
    
    const accounts = [];
    if (type === 'Deposit') {
       // Debit Bank, Credit Categorization Account
       accounts.push({
         account: bankAccount,
         debit: Math.abs(amount),
         credit: 0,
       });
       accounts.push({
         account: account,
         debit: 0,
         credit: Math.abs(amount),
       });
    } else {
       // Credit Bank, Debit Categorization Account
       accounts.push({
         account: bankAccount,
         debit: 0,
         credit: Math.abs(amount),
       });
       accounts.push({
         account: account,
         debit: Math.abs(amount),
         credit: 0,
       });
    }

    const je = await fyo.doc.create(ModelNameEnum.JournalEntry, {
      date,
      entryType: 'Bank Entry',
      userRemark: description,
      referenceNumber: reference,
      accounts,
    });
    await je.save();
    postedVoucher = je.name;
  }

  // Update transaction
  await transaction.set('status', 'Reconciled');
  await transaction.set('postedVoucher', postedVoucher);
  await transaction.set('postedVoucherType', postedVoucherType);
  await transaction.save();
}
