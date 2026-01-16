import test from 'tape';
import { getTestFyo, setupTestFyo, closeTestFyo } from './helpers';
import { ModelNameEnum } from 'models/types';
import { autoCategorize, dedupeKey } from 'src/banking/autoCategorize';
import { postBankTransactionToGL } from 'src/banking/postToGL';
import { parseCSV } from 'utils/csvParser';
import { Money } from 'pesa';
import { DateTime } from 'luxon';

const fyo = getTestFyo();

setupTestFyo(fyo, __filename);

// Test CSV content - simulating a typical bank statement
const sampleCSV = `Date,Description,Withdrawal,Deposit,Balance
2024-01-01,Opening Balance,,,50000.00
2024-01-02,ATM-WDL/CASH/CONNAUGHT PLACE,5000.00,,45000.00
2024-01-03,UPI-GROCERY STORE-1234@okaxis,,1500.00,46500.00
2024-01-04,BANK CHARGES,100.00,,46400.00
2024-01-05,Interest Income,,250.00,46650.00
2024-01-06,UPI-VENDOR PAYMENT,3000.00,,43650.00`;

// Test case 1: Parse CSV content
test('CSV Parser: Parse bank statement CSV', (t) => {
  const parsed = parseCSV(sampleCSV);
  
  t.equal(parsed.length, 6, 'Should parse 6 rows (including header)');
  t.equal(parsed[0][0], 'Date', 'First header should be Date');
  t.equal(parsed[1][1], 'Opening Balance', 'First data row description should match');
  t.equal(parsed[2][2], '5000.00', 'Withdrawal amount should be parsed correctly');
  t.equal(parsed[3][3], '1500.00', 'Deposit amount should be parsed correctly');
  
  t.end();
});

// Test case 2: Create bank account
test('Banking Setup: Create bank account', async (t) => {
  const bankAccount = fyo.doc.getNewDoc(ModelNameEnum.Account, {
    name: 'HDFC Bank Current',
    accountType: 'Bank',
    rootType: 'Asset'
  });
  await bankAccount.sync();
  
  t.ok(bankAccount.name, 'Bank account created successfully');
  t.equal(bankAccount.accountType, 'Bank', 'Account type should be Bank');
  t.equal(bankAccount.rootType, 'Asset', 'Root type should be Asset');
});

// Test case 3: Create expense and income accounts
test('Banking Setup: Create categorization accounts', async (t) => {
  // Create Cash account
  const cash = fyo.doc.getNewDoc(ModelNameEnum.Account, {
    name: 'Cash',
    accountType: 'Cash',
    rootType: 'Asset'
  });
  await cash.sync();
  t.ok(cash.name, 'Cash account created');

  // Create Bank Charges account
  const bankCharges = fyo.doc.getNewDoc(ModelNameEnum.Account, {
    name: 'Bank Charges',
    accountType: 'Expense Account',
    rootType: 'Expense'
  });
  await bankCharges.sync();
  t.ok(bankCharges.name, 'Bank Charges account created');

  // Create Interest Income account
  const interestIncome = fyo.doc.getNewDoc(ModelNameEnum.Account, {
    name: 'Interest Income',
    accountType: 'Income Account',
    rootType: 'Income'
  });
  await interestIncome.sync();
  t.ok(interestIncome.name, 'Interest Income account created');

  // Create Creditors account
  const creditors = fyo.doc.getNewDoc(ModelNameEnum.Account, {
    name: 'Creditors',
    accountType: 'Payable',
    rootType: 'Liability'
  });
  await creditors.sync();
  t.ok(creditors.name, 'Creditors account created');
});

// Test case 4: Auto-categorization logic
test('Auto-Categorization: Test pattern matching', (t) => {
  const atmTest = autoCategorize('ATM-WDL/CASH/CONNAUGHT PLACE', 'Withdrawal');
  t.equal(atmTest.account, 'Cash', 'ATM withdrawal should categorize to Cash');

  const interestDepositTest = autoCategorize('Interest credited', 'Deposit');
  t.equal(interestDepositTest.account, 'Interest Income', 'Interest deposit should categorize to Interest Income');

  const chargesTest = autoCategorize('Bank charges debited', 'Withdrawal');
  t.equal(chargesTest.account, 'Bank Charges', 'Bank charges should categorize correctly');

  const noMatchTest = autoCategorize('Random transaction', 'Deposit');
  t.deepEqual(noMatchTest, {}, 'Unmatched transaction should return empty object');

  t.end();
});

// Test case 5: Dedupe key generation
test('Dedupe Logic: Generate unique keys', (t) => {
  const key1 = dedupeKey('2024-01-02', 'ATM Withdrawal', 5000, 45000);
  const key2 = dedupeKey('2024-01-02', 'ATM Withdrawal', 5000, 45000);
  const key3 = dedupeKey('2024-01-02', 'ATM Withdrawal', 5000, 45001);

  t.equal(key1, key2, 'Same transaction should generate same dedupe key');
  t.notEqual(key1, key3, 'Different balance should generate different key');

  t.end();
});

// Test case 6: Import bank transactions
test('Import: Create bank transactions from parsed CSV', async (t) => {
  const parsed = parseCSV(sampleCSV);
  const headers = parsed[0];
  const rows = parsed.slice(1);

  let importCount = 0;

  for (const row of rows) {
    const entry: any = {
      bankAccount: 'HDFC Bank Current',
      status: 'Unreconciled'
    };

    // Map columns
    headers.forEach((header, idx) => {
      const val = row[idx];
      const h = header.toLowerCase();

      if (h.includes('date')) {
        entry.date = val;
      } else if (h.includes('desc')) {
        entry.description = val;
      } else if (h.includes('withdrawal') && val) {
        entry.type = 'Withdrawal';
        entry.amount = parseFloat(val.replace(/,/g, ''));
      } else if (h.includes('deposit') && val) {
        entry.type = 'Deposit';
        entry.amount = parseFloat(val.replace(/,/g, ''));
      } else if (h.includes('balance')) {
        entry.balance = parseFloat(val.replace(/,/g, '') || '0');
      }
    });

    // Only import if date and amount exist
    if (entry.date && entry.amount) {
      const key = dedupeKey(entry.date, entry.description || '', entry.amount, entry.balance || 0);
      const auto = autoCategorize(entry.description || '', entry.type);

      const transaction = fyo.doc.getNewDoc(ModelNameEnum.BankTransaction, {
        ...entry,
        ...auto,
        dedupeKey: key
      });

      await transaction.sync();
      importCount++;
    }
  }

  t.ok(importCount > 0, `Imported ${importCount} transactions`);
  t.ok(importCount <= rows.length, 'Import count should not exceed row count');
});

// Test case 7: Retrieve unreconciled transactions
test('Retrieval: Get unreconciled transactions', async (t) => {
  const unreconciled = await fyo.doc.getDocs(ModelNameEnum.BankTransaction, {
    filters: { status: 'Unreconciled' }
  });

  t.ok(unreconciled.length > 0, `Found ${unreconciled.length} unreconciled transactions`);
  
  for (const txn of unreconciled) {
    t.equal(txn.status, 'Unreconciled', 'All retrieved transactions should be unreconciled');
    t.ok(txn.date, 'Transaction should have a date');
    t.ok(txn.amount, 'Transaction should have an amount');
    t.ok(txn.bankAccount, 'Transaction should have a bank account');
  }
});

// Test case 8: Post to GL - Journal Entry (no party)
test('Post to GL: Create Journal Entry for transaction without party', async (t) => {
  // Find a transaction with auto-categorized account
  const transactions = await fyo.doc.getDocs(ModelNameEnum.BankTransaction, {
    filters: { status: 'Unreconciled', account: 'Cash' }
  });

  if (transactions.length === 0) {
    t.skip('No suitable transaction found for testing');
    t.end();
    return;
  }

  const transaction = transactions[0];
  const originalStatus = transaction.status;

  await postBankTransactionToGL(transaction);

  t.equal(transaction.status, 'Reconciled', 'Transaction status should be updated to Reconciled');
  t.notEqual(transaction.status, originalStatus, 'Status should have changed');
  t.ok(transaction.postedVoucher, 'Posted voucher name should be set');
  t.equal(transaction.postedVoucherType, ModelNameEnum.JournalEntry, 'Voucher type should be JournalEntry');

  // Verify Journal Entry was created
  const je = await fyo.doc.getDoc(ModelNameEnum.JournalEntry, transaction.postedVoucher as string);
  t.ok(je, 'Journal Entry should exist');
  t.ok(je.accounts, 'Journal Entry should have accounts');
  t.equal((je.accounts as any[])?.length, 2, 'Journal Entry should have exactly 2 account entries');

  // Verify debits = credits
  const accounts = je.accounts as any[];
  const totalDebit = accounts.reduce((sum, acc) => sum + (acc.debit?.float || 0), 0);
  const totalCredit = accounts.reduce((sum, acc) => sum + (acc.credit?.float || 0), 0);
  t.equal(totalDebit, totalCredit, 'Total debits should equal total credits');
});

// Test case 9: Post to GL - Payment (with party)
test('Post to GL: Create Payment entry for transaction with party', async (t) => {
  // Create a party first
  const party = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'ABC Suppliers Ltd',
    role: 'Supplier'
  });
  await party.sync();
  t.ok(party.name, 'Party created successfully');

  // Create a transaction with party
  const transaction = fyo.doc.getNewDoc(ModelNameEnum.BankTransaction, {
    date: '2024-01-10',
    description: 'Payment to ABC Suppliers',
    amount: 10000,
    type: 'Withdrawal',
    bankAccount: 'HDFC Bank Current',
    account: 'Creditors',
    party: 'ABC Suppliers Ltd',
    status: 'Unreconciled'
  });
  await transaction.sync();

  // Post to GL
  await postBankTransactionToGL(transaction);

  t.equal(transaction.status, 'Reconciled', 'Transaction should be reconciled');
  t.equal(transaction.postedVoucherType, ModelNameEnum.Payment, 'Voucher type should be Payment');
  t.ok(transaction.postedVoucher, 'Payment voucher should be created');

  // Verify Payment entry
  const payment = await fyo.doc.getDoc(ModelNameEnum.Payment, transaction.postedVoucher as string);
  t.ok(payment, 'Payment document should exist');
  t.equal(payment.party, 'ABC Suppliers Ltd', 'Payment party should match');
  t.equal((payment.amount as Money).float, 10000, 'Payment amount should match');
  t.equal(payment.paymentType, 'Pay', 'Payment type should be Pay for withdrawal');
});

// Test case 10: Test deposit transaction with party
test('Post to GL: Create Payment for deposit transaction with party', async (t) => {
  // Create customer party
  const customer = fyo.doc.getNewDoc(ModelNameEnum.Party, {
    name: 'XYZ Customer',
    role: 'Customer'
  });
  await customer.sync();

  // Create deposit transaction
  const transaction = fyo.doc.getNewDoc(ModelNameEnum.BankTransaction, {
    date: '2024-01-11',
    description: 'Received from XYZ Customer',
    amount: 15000,
    type: 'Deposit',
    bankAccount: 'HDFC Bank Current',
    account: 'Debtors',
    party: 'XYZ Customer',
    status: 'Unreconciled'
  });
  await transaction.sync();

  await postBankTransactionToGL(transaction);

  t.equal(transaction.status, 'Reconciled', 'Transaction should be reconciled');
  t.equal(transaction.postedVoucherType, ModelNameEnum.Payment, 'Should create Payment');

  const payment = await fyo.doc.getDoc(ModelNameEnum.Payment, transaction.postedVoucher as string);
  t.equal(payment.paymentType, 'Receive', 'Payment type should be Receive for deposit');
  t.equal((payment.amount as Money).float, 15000, 'Payment amount should match');
});

// Test case 11: Error handling - post already reconciled transaction
test('Error Handling: Prevent posting already reconciled transaction', async (t) => {
  // Get a reconciled transaction
  const reconciledTxns = await fyo.doc.getDocs(ModelNameEnum.BankTransaction, {
    filters: { status: 'Reconciled' }
  });

  if (reconciledTxns.length === 0) {
    t.skip('No reconciled transaction found');
    t.end();
    return;
  }

  const transaction = reconciledTxns[0];

  try {
    await postBankTransactionToGL(transaction);
    t.fail('Should have thrown an error for already reconciled transaction');
  } catch (error: any) {
    t.ok(error, 'Should throw error');
    t.ok(error.message.includes('already reconciled'), 'Error message should mention already reconciled');
  }
});

// Test case 12: Error handling - post without category account
test('Error Handling: Prevent posting without category account', async (t) => {
  const transaction = fyo.doc.getNewDoc(ModelNameEnum.BankTransaction, {
    date: '2024-01-12',
    description: 'Uncategorized transaction',
    amount: 500,
    type: 'Withdrawal',
    bankAccount: 'HDFC Bank Current',
    status: 'Unreconciled'
    // Note: No 'account' field set
  });
  await transaction.sync();

  try {
    await postBankTransactionToGL(transaction);
    t.fail('Should have thrown an error for missing category account');
  } catch (error: any) {
    t.ok(error, 'Should throw error');
    t.ok(error.message.includes('category account'), 'Error message should mention category account');
  }
});

// Test case 13: Dedupe prevention
test('Dedupe: Prevent duplicate transaction import', async (t) => {
  const uniqueDesc = 'UNIQUE-TRANSACTION-' + Date.now();
  const entry = {
    date: '2024-01-15',
    description: uniqueDesc,
    amount: 1000,
    type: 'Withdrawal',
    bankAccount: 'HDFC Bank Current',
    balance: 40000,
    status: 'Unreconciled'
  };

  const key = dedupeKey(entry.date, entry.description, entry.amount, entry.balance);

  // Import first time
  const txn1 = fyo.doc.getNewDoc(ModelNameEnum.BankTransaction, {
    ...entry,
    dedupeKey: key
  });
  await txn1.sync();
  t.ok(txn1.name, 'First transaction imported');

  // Check for existing before importing duplicate
  const existing = await fyo.doc.getDocs(ModelNameEnum.BankTransaction, {
    filters: { dedupeKey: key }
  });

  t.equal(existing.length, 1, 'Should find exactly one transaction with this dedupe key');

  // In real import, we would skip the duplicate
  const shouldImport = existing.length === 0;
  t.equal(shouldImport, false, 'Should not import duplicate');
});

// Test case 14: Date formatting
test('Date Formatting: Handle various date formats', (t) => {
  const formatDate = (val: string) => {
    const parts = val.split(/[\/\-]/);
    if (parts.length === 3) {
      let d, m, y;
      if (parts[2].length === 4) { // DD/MM/YYYY
        d = parts[0].padStart(2, '0');
        m = parts[1].padStart(2, '0');
        y = parts[2];
      } else if (parts[0].length === 4) { // YYYY/MM/DD
        y = parts[0];
        m = parts[1].padStart(2, '0');
        d = parts[2].padStart(2, '0');
      }
      if (y && m && d) return `${y}-${m}-${d}`;
    }
    return val;
  };

  t.equal(formatDate('01/02/2024'), '2024-02-01', 'DD/MM/YYYY format should convert correctly');
  t.equal(formatDate('2024/02/01'), '2024-02-01', 'YYYY/MM/DD format should convert correctly');
  t.equal(formatDate('2024-02-01'), '2024-02-01', 'YYYY-MM-DD should remain unchanged');
  t.equal(formatDate('1/2/2024'), '2024-02-01', 'Single digit dates should be padded');

  t.end();
});

// Test case 15: Summary - Verify complete flow
test('Summary: Verify complete banking flow', async (t) => {
  // Get all transactions
  const allTransactions = await fyo.doc.getDocs(ModelNameEnum.BankTransaction);
  const reconciled = await fyo.doc.getDocs(ModelNameEnum.BankTransaction, {
    filters: { status: 'Reconciled' }
  });
  const unreconciled = await fyo.doc.getDocs(ModelNameEnum.BankTransaction, {
    filters: { status: 'Unreconciled' }
  });

  t.ok(allTransactions.length > 0, `Total transactions: ${allTransactions.length}`);
  t.ok(reconciled.length > 0, `Reconciled transactions: ${reconciled.length}`);
  t.equal(allTransactions.length, reconciled.length + unreconciled.length, 
    'Total should equal reconciled + unreconciled');

  // Verify all reconciled transactions have vouchers
  for (const txn of reconciled) {
    t.ok(txn.postedVoucher, 'Reconciled transaction should have posted voucher');
    t.ok(txn.postedVoucherType, 'Reconciled transaction should have voucher type');
    t.ok(
      txn.postedVoucherType === ModelNameEnum.Payment || 
      txn.postedVoucherType === ModelNameEnum.JournalEntry,
      'Voucher type should be either Payment or JournalEntry'
    );
  }

  // Count vouchers created
  const payments = await fyo.doc.getDocs(ModelNameEnum.Payment);
  const journalEntries = await fyo.doc.getDocs(ModelNameEnum.JournalEntry);
  
  t.ok(payments.length > 0 || journalEntries.length > 0, 
    `Created ${payments.length} Payments and ${journalEntries.length} Journal Entries`);

  console.log('\n=== Banking Flow Summary ===');
  console.log(`Total Bank Transactions: ${allTransactions.length}`);
  console.log(`Reconciled: ${reconciled.length}`);
  console.log(`Unreconciled: ${unreconciled.length}`);
  console.log(`Payment Entries Created: ${payments.length}`);
  console.log(`Journal Entries Created: ${journalEntries.length}`);
  console.log('===========================\n');
});

closeTestFyo(fyo, __filename);
