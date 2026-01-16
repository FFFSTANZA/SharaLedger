import test from 'tape';
import { getTestFyo, setupTestFyo, closeTestFyo } from './helpers';
import { ModelNameEnum } from 'models/types';
import { autoCategorize, dedupeKey } from 'src/banking/autoCategorize';
import { postBankTransactionToGL } from 'src/banking/postToGL';
import { Money } from 'pesa';

const fyo = getTestFyo();

setupTestFyo(fyo, __filename);

test('Banking Flow: Import and Categorize', async (t) => {
    // 1. Create a bank account first
    const bankAccount = fyo.doc.getNewDoc(ModelNameEnum.Account, {
        name: 'HDFC Bank',
        accountType: 'Bank',
        rootType: 'Asset'
    });
    await bankAccount.save();

    // 2. Mock a CSV import row
    const row = {
        date: '2023-10-01',
        description: 'ATM-WDL/CASH/1234',
        amount: 5000,
        type: 'Withdrawal',
        bankAccount: 'HDFC Bank',
        balance: 25000,
        reference: 'ATM123'
    };

    const key = dedupeKey(row.date, row.description, row.amount, row.balance);
    const auto = autoCategorize(row.description, row.type as 'Withdrawal');

    t.equal(auto.account, 'Cash', 'Auto-categorization for ATM-WDL should be Cash');

    const transaction = fyo.doc.getNewDoc(ModelNameEnum.BankTransaction, {
        ...row,
        ...auto,
        dedupeKey: key
    });

    await transaction.save();
    t.ok(transaction.name, 'Bank transaction created');
    t.equal(transaction.account, 'Cash', 'Transaction should have auto-categorized account');
});

test('Banking Flow: Post to GL (Journal Entry)', async (t) => {
    // Get the unreconciled transaction
    const docs = await fyo.doc.getDocs(ModelNameEnum.BankTransaction, {
        filters: { status: 'Unreconciled' }
    });
    
    t.equal(docs.length, 1, 'Should have 1 unreconciled transaction');
    const transaction = docs[0];

    // Post to GL
    await postBankTransactionToGL(transaction);

    t.equal(transaction.status, 'Reconciled', 'Transaction should be marked as Reconciled');
    t.ok(transaction.postedVoucher, 'Should have a linked voucher');
    t.equal(transaction.postedVoucherType, ModelNameEnum.JournalEntry, 'Voucher should be a Journal Entry');

    // Verify Journal Entry exists
    const je = await fyo.doc.getDoc(ModelNameEnum.JournalEntry, transaction.postedVoucher as string);
    t.ok(je, 'Journal Entry should exist');
    t.equal(je.accounts?.length, 2, 'Journal Entry should have 2 account rows');
});

test('Banking Flow: Post to GL (Payment with Party)', async (t) => {
    // 1. Create a party
    const party = fyo.doc.getNewDoc(ModelNameEnum.Party, {
        name: 'Test Supplier',
        type: 'Supplier'
    });
    await party.save();

    // 2. Create another bank transaction
    const transaction = fyo.doc.getNewDoc(ModelNameEnum.BankTransaction, {
        date: '2023-10-02',
        description: 'Payment to Test Supplier',
        amount: 2000,
        type: 'Withdrawal',
        bankAccount: 'HDFC Bank',
        account: 'Creditors',
        party: 'Test Supplier',
        status: 'Unreconciled'
    });
    await transaction.save();

    // 3. Post to GL
    await postBankTransactionToGL(transaction);

    t.equal(transaction.status, 'Reconciled', 'Transaction should be reconciled');
    t.equal(transaction.postedVoucherType, ModelNameEnum.Payment, 'Voucher should be a Payment');

    // 4. Verify Payment exists
    const payment = await fyo.doc.getDoc(ModelNameEnum.Payment, transaction.postedVoucher as string);
    t.ok(payment, 'Payment should exist');
    t.equal(payment.party, 'Test Supplier', 'Payment party should match');
    t.equal((payment.amount as Money).float, 2000, 'Payment amount should match');
});

closeTestFyo(fyo, __filename);
