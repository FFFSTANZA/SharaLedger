import test from 'tape';
import { parseCSV, parseCSVAdvanced, analyzeCSVStructure, sanitizeField, detectDataType, type CSVParseResult } from '../../utils/csvParser';

test('CSV Parser Advanced: Parse standard CSV', (t) => {
  const csv = `Date,Description,Amount,Balance
2024-01-01,Opening Balance,1000.00,1000.00
2024-01-02,ATM Withdrawal,50.00,950.00
2024-01-03,Salary Deposit,2500.00,3450.00`;

  const result = parseCSVAdvanced(csv);
  
  t.equal(result.headers.length, 4, 'Should have 4 columns');
  t.equal(result.rows.length, 3, 'Should have 3 data rows');
  t.equal(result.headers[0], 'Date', 'First header should be Date');
  t.equal(result.rows[0][0], '2024-01-01', 'First row date should match');
  t.equal(result.delimiter, ',', 'Should detect comma delimiter');
  t.equal(result.errors.length, 0, 'Should have no errors');
  
  t.end();
});

test('CSV Parser Advanced: Parse semicolon-delimited CSV', (t) => {
  const csv = `"Date";"Description";"Amount";"Balance"
"2024-01-01";"Opening Balance";"1000.00";"1000.00"
"2024-01-02";"ATM Withdrawal";"50.00";"950.00"`;

  const result = parseCSVAdvanced(csv);
  
  t.equal(result.headers.length, 4, 'Should have 4 columns');
  t.equal(result.rows.length, 2, 'Should have 2 data rows');
  t.equal(result.delimiter, ';', 'Should detect semicolon delimiter');
  t.equal(result.headers[1], 'Description', 'Second header should be Description');
  
  t.end();
});

test('CSV Parser Advanced: Handle empty rows', (t) => {
  const csv = `Date,Description,Amount

2024-01-01,Opening Balance,1000.00

2024-01-02,ATM Withdrawal,50.00

`;

  const result = parseCSVAdvanced(csv, { skipEmptyLines: true });
  
  t.equal(result.headers.length, 3, 'Should have 3 columns');
  t.equal(result.rows.length, 2, 'Should have 2 data rows (empty rows skipped)');
  t.equal(result.emptyRows, 3, 'Should detect 3 empty rows');
  
  t.end();
});

test('CSV Parser Advanced: Handle quoted fields with commas', (t) => {
  const csv = `Date,Description,Amount
2024-01-01,"Opening Balance, Initial",1000.00
2024-01-02,"ATM Withdrawal, City Branch",50.00
2024-01-03,"Salary Deposit, Company Account",2500.00`;

  const result = parseCSVAdvanced(csv);
  
  t.equal(result.rows.length, 3, 'Should have 3 data rows');
  t.equal(result.rows[0][1], 'Opening Balance, Initial', 'Should handle quoted commas in description');
  t.equal(result.rows[1][1], 'ATM Withdrawal, City Branch', 'Should handle quoted commas in second row');
  
  t.end();
});

test('CSV Parser Advanced: Handle escaped quotes', (t) => {
  const csv = `Date,Description,Amount
2024-01-01,"Opening Balance ""Initial""",1000.00
2024-01-02,"ATM Withdrawal at ""Main Branch""",50.00`;

  const result = parseCSVAdvanced(csv);
  
  t.equal(result.rows.length, 2, 'Should have 2 data rows');
  t.equal(result.rows[0][1], 'Opening Balance "Initial"', 'Should unescape quotes');
  t.equal(result.rows[1][1], 'ATM Withdrawal at "Main Branch"', 'Should unescape quotes in second row');
  
  t.end();
});

test('CSV Parser Advanced: Handle mixed data types', (t) => {
  const csv = `Date,Description,Amount,Reference
01/01/2024,Opening Balance,1000.00,OB001
02/01/2024,ATM Withdrawal,50.00,ATM001
03/01/2024,Salary Deposit,"2,500.00",SAL001`;

  const result = parseCSVAdvanced(csv);
  
  t.equal(result.rows.length, 3, 'Should have 3 data rows');
  t.equal(result.rows[2][2], '2500.00', 'Should handle quoted numbers with commas');
  
  t.end();
});

test('CSV Parser: Backward compatibility', (t) => {
  const csv = `Date,Description,Amount
2024-01-01,Opening Balance,1000.00
2024-01-02,ATM Withdrawal,50.00`;

  const result = parseCSV(csv);
  
  t.equal(result.length, 3, 'Should return 3 rows (header + 2 data)');
  t.equal(result[0][0], 'Date', 'First row should be header');
  t.equal(result[1][1], 'Opening Balance', 'Second row should be data');
  t.equal(result[2][2], '50.00', 'Third row amount should match');
  
  t.end();
});

test('Utility Functions: sanitizeField', (t) => {
  t.equal(sanitizeField('  "Hello World"  '), 'Hello World', 'Should remove quotes and trim');
  t.equal(sanitizeField("'Single Quotes'"), 'Single Quotes', 'Should remove single quotes');
  t.equal(sanitizeField('  Multiple   Spaces  '), 'Multiple Spaces', 'Should normalize spaces');
  t.equal(sanitizeField(''), '', 'Should handle empty string');
  t.equal(sanitizeField(null as any), '', 'Should handle null');
  
  t.end();
});

test('Utility Functions: detectDataType', (t) => {
  t.equal(detectDataType('123.45'), 'number', 'Should detect number');
  t.equal(detectDataType('-123.45'), 'number', 'Should detect negative number');
  t.equal(detectDataType('01/02/2024'), 'date', 'Should detect DD/MM/YYYY date');
  t.equal(detectDataType('2024-02-01'), 'date', 'Should detect YYYY-MM-DD date');
  t.equal(detectDataType('Hello World'), 'text', 'Should detect text');
  t.equal(detectDataType(''), 'text', 'Should treat empty as text');
  
  t.end();
});

test('CSV Analysis: analyzeCSVStructure', (t) => {
  const csv = `Date,Description,Amount
2024-01-01,Opening Balance,1000.00
2024-01-02,ATM Withdrawal,50.00`;

  const analysis = analyzeCSVStructure(csv);
  
  t.equal(analysis.delimiter, ',', 'Should detect comma delimiter');
  t.equal(analysis.hasHeaders, true, 'Should assume headers');
  t.equal(analysis.rowCount, 2, 'Should count 2 data rows');
  t.equal(analysis.columnCount, 3, 'Should count 3 columns');
  t.equal(analysis.sampleData.length, 2, 'Should provide 2 sample rows');
  
  t.end();
});

test('CSV Parser Advanced: Error handling', (t) => {
  try {
    parseCSV('');
    t.fail('Should throw error for empty content');
  } catch (error: any) {
    t.ok(error.message.includes('No data found'), 'Should provide meaningful error message');
  }
  
  t.end();
});

test('CSV Parser Advanced: Large file handling', (t) => {
  // Create a large CSV with 1000 rows
  let csv = 'Date,Description,Amount\n';
  for (let i = 1; i <= 1000; i++) {
    csv += `2024-01-01,Transaction ${i},${i}.00\n`;
  }

  const result = parseCSVAdvanced(csv, { maxRows: 500 });
  
  t.equal(result.rows.length, 500, 'Should limit to maxRows');
  t.ok(result.warnings.length >= 0, 'Should return warnings array');
  
  t.end();
});

test('CSV Parser Advanced: Different delimiters', (t) => {
  const tabCsv = `Date\tDescription\tAmount
2024-01-01\tOpening Balance\t1000.00
2024-01-02\tATM Withdrawal\t50.00`;

  const pipeCsv = `Date|Description|Amount
2024-01-01|Opening Balance|1000.00
2024-01-02|ATM Withdrawal|50.00`;

  const tabResult = parseCSVAdvanced(tabCsv);
  const pipeResult = parseCSVAdvanced(pipeCsv);
  
  t.equal(tabResult.delimiter, '\t', 'Should detect tab delimiter');
  t.equal(pipeResult.delimiter, '|', 'Should detect pipe delimiter');
  t.equal(tabResult.rows.length, 2, 'Should parse tab-delimited correctly');
  t.equal(pipeResult.rows.length, 2, 'Should parse pipe-delimited correctly');
  
  t.end();
});

test('Bank Statement Import: Real-world CSV formats', (t) => {
  // Test case 1: Standard bank format
  const bankCSV1 = `Date,Transaction Date,Description,Reference,Debit,Credit,Balance
01/01/2024,01/01/2024,OPENING BALANCE,,,1000.00,1000.00
02/01/2024,02/01/2024,ATM WITHDRAWAL,ATM001,500.00,,500.00
03/01/2024,03/01/2024,SALARY CREDIT,SAL001,,2000.00,2500.00`;

  const result1 = parseCSVAdvanced(bankCSV1);
  t.equal(result1.rows.length, 3, 'Should parse bank format 1');
  t.equal(result1.headers.length, 7, 'Should have all columns');

  // Test case 2: Simplified format with amounts
  const bankCSV2 = `Date,Description,Amount,Balance
2024-01-01,Opening Balance,1000.00,1000.00
2024-01-02,ATM Withdrawal,-500.00,500.00
2024-01-03,Salary Credit,+2000.00,2500.00`;

  const result2 = parseCSVAdvanced(bankCSV2);
  t.equal(result2.rows.length, 3, 'Should parse bank format 2');
  
  t.end();
});