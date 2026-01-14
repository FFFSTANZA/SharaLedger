import test from 'tape';
import { parseStatementFile } from './statementParser';

// Test CSV data simulating common Indian bank formats
const testCSV1 = `Date,Description,Amount,Balance
15-01-2024,UPI Payment to Merchant,100.00,15000.00
16-01-2024,Salary Credit,50000.00,50100.00
17-01-2024,ATM Withdrawal,5000.00,45100.00`;

const testCSV2 = `Txn Date,Particulars,Chq No,Amount,Balance
15/01/2024,NEFT-ABC123,NA,-1500.00,25000.00
16/01/2024,CASH DEPOSIT,,5000.00,30000.00`;

const testCSV3 = `Transaction Date,Description of Transaction,Debit Amount,Credit Amount,Balance
2024-01-15,Restaurant Payment,500.00,,10000.00
2024-01-16,Interest Credit,,50.00,10050.00`;

test('Parse Indian bank CSV format (dd-MM-yyyy)', (t) => {
  const data = new TextEncoder().encode(testCSV1);
  const result = parseStatementFile('test.csv', data);

  t.ok(result.transactions.length > 0, 'should parse transactions');
  t.equals(result.transactions.length, 3, 'should parse 3 transactions');
  t.equals(result.transactions[0].date, '15-01-2024', 'should parse date correctly');
  t.equals(result.transactions[0].amount, 100.00, 'should parse amount correctly');
  t.equals(result.transactions[0].type, 'debit', 'should identify transaction type as debit');
  t.end();
});

test('Parse bank CSV with separate debit/credit columns', (t) => {
  const data = new TextEncoder().encode(testCSV3);
  const result = parseStatementFile('test.csv', data);

  t.ok(result.transactions.length > 0, 'should parse transactions');
  t.equals(result.transactions.length, 2, 'should parse 2 transactions');
  t.equals(result.transactions[0].amount, 500.00, 'should parse debit amount');
  t.equals(result.transactions[1].amount, 50.00, 'should parse credit amount');
  t.end();
});

test('Handle zero amount transactions', (t) => {
  const csvWithZero = `Date,Description,Amount,Balance
15-01-2024,Zero Value Entry,0.00,10000.00
16-01-2024,Normal Entry,100.00,10000.00`;

  const data = new TextEncoder().encode(csvWithZero);
  const result = parseStatementFile('test.csv', data);

  t.equals(result.transactions.length, 2, 'should parse both transactions including zero amount');
  t.equals(result.transactions[0].amount, 0.00, 'should parse zero amount correctly');
  t.end();
});

test('Handle Indian number format', (t) => {
  const csvIndianFormat = `Date,Description,Amount
15-01-2024,Large Transaction,1,50,000.00`;

  const data = new TextEncoder().encode(csvIndianFormat);
  const result = parseStatementFile('test.csv', data);

  t.equals(result.transactions.length, 1, 'should parse Indian number format');
  t.equals(result.transactions[0].amount, 150000.00, 'should convert Indian lakhs to correct amount');
  t.end();
});
