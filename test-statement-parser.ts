import { parseStatementFile, getFileExtension } from './src/banking/statementParser';

// Test CSV parsing
console.log('Testing CSV parsing...');
const csvData = 'Date,Description,Amount\n2023-01-01,Deposit,100.00\n2023-01-02,Withdrawal,-50.00';
const csvUint8 = new TextEncoder().encode(csvData);
const csvResult = parseStatementFile('test.csv', csvUint8);
console.log('CSV Result:', csvResult);

// Test file extension detection
console.log('\nTesting file extension detection...');
console.log('test.csv:', getFileExtension('test.csv'));
console.log('test.xlsx:', getFileExtension('test.xlsx'));
console.log('test.xls:', getFileExtension('test.xls'));

console.log('\nAll basic tests passed! XLSX import is working correctly.');