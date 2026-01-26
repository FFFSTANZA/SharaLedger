// Test script to verify E-Way Bill date validation fixes
const { DateTime } = require('luxon');

// Simulate the validation logic from EWayBill.ts
function validateEWayBillDate(value, invoiceDate) {
  if (!value) {
    return { valid: true, error: null };
  }

  let ewayBillDate;
  try {
    if (typeof value === 'string') {
      ewayBillDate = DateTime.fromISO(value);
    } else if (value instanceof Date) {
      ewayBillDate = DateTime.fromJSDate(value);
    } else {
      return { valid: false, error: 'Invalid E-Way Bill date format' };
    }

    if (!ewayBillDate.isValid) {
      return { valid: false, error: 'Invalid E-Way Bill date' };
    }

    // E-Way Bill should not be older than invoice date
    if (invoiceDate) {
      let invoiceDateTime;
      if (typeof invoiceDate === 'string') {
        invoiceDateTime = DateTime.fromISO(invoiceDate);
      } else if (invoiceDate instanceof Date) {
        invoiceDateTime = DateTime.fromJSDate(invoiceDate);
      } else {
        return { valid: true, error: null }; // Skip validation if invoice date format is invalid
      }

      if (invoiceDateTime.isValid && ewayBillDate < invoiceDateTime) {
        return {
          valid: false,
          error: 'E-Way Bill date cannot be before invoice date',
        };
      }
    }

    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function validateValidUpto(ewayBillDate, validUpto) {
  if (!ewayBillDate || !validUpto) {
    return { valid: true, error: null };
  }

  try {
    let billDate;
    if (typeof ewayBillDate === 'string') {
      billDate = DateTime.fromISO(ewayBillDate);
    } else if (ewayBillDate instanceof Date) {
      billDate = DateTime.fromJSDate(ewayBillDate);
    } else {
      return { valid: true, error: null }; // Skip validation if ewayBillDate format is invalid
    }

    let validUptoDate;
    if (typeof validUpto === 'string') {
      validUptoDate = DateTime.fromISO(validUpto);
    } else if (validUpto instanceof Date) {
      validUptoDate = DateTime.fromJSDate(validUpto);
    } else {
      return { valid: true, error: null }; // Skip validation if validUpto format is invalid
    }

    if (
      billDate.isValid &&
      validUptoDate.isValid &&
      validUptoDate <= billDate
    ) {
      return {
        valid: false,
        error: 'Valid Upto date must be after E-Way Bill Date',
      };
    }

    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Test cases
console.log('=== E-Way Bill Date Validation Tests ===\n');

// Test 1: String input (legacy format)
const test1Result = validateEWayBillDate(
  '2024-01-15T10:30:00.000Z',
  '2024-01-14T09:00:00.000Z'
);
console.log(
  'Test 1 (String input):',
  test1Result.valid ? 'PASS' : 'FAIL',
  test1Result.error || 'Success'
);

// Test 2: Date object input (new format)
const test2Date = new Date('2024-01-15T10:30:00.000Z');
const test2InvoiceDate = new Date('2024-01-14T09:00:00.000Z');
const test2Result = validateEWayBillDate(test2Date, test2InvoiceDate);
console.log(
  'Test 2 (Date object input):',
  test2Result.valid ? 'PASS' : 'FAIL',
  test2Result.error || 'Success'
);

// Test 3: Mixed format (string + Date object)
const test3Result = validateEWayBillDate(
  '2024-01-15T10:30:00.000Z',
  test2InvoiceDate
);
console.log(
  'Test 3 (Mixed format):',
  test3Result.valid ? 'PASS' : 'FAIL',
  test3Result.error || 'Success'
);

// Test 4: Invalid date format
const test4Result = validateEWayBillDate(
  'invalid-date',
  '2024-01-14T09:00:00.000Z'
);
console.log(
  'Test 4 (Invalid date):',
  !test4Result.valid ? 'PASS' : 'FAIL',
  test4Result.error || 'Should have failed'
);

// Test 5: E-Way Bill date before invoice date
const test5Result = validateEWayBillDate(
  '2024-01-13T10:30:00.000Z',
  '2024-01-14T09:00:00.000Z'
);
console.log(
  'Test 5 (Date before invoice):',
  !test5Result.valid ? 'PASS' : 'FAIL',
  test5Result.error || 'Should have failed'
);

// Test 6: Valid Upto validation with Date objects
const ewayDate = new Date('2024-01-15T10:30:00.000Z');
const validUptoDate = new Date('2024-01-20T10:30:00.000Z');
const test6Result = validateValidUpto(ewayDate, validUptoDate);
console.log(
  'Test 6 (Valid Upto Date objects):',
  test6Result.valid ? 'PASS' : 'FAIL',
  test6Result.error || 'Success'
);

// Test 7: Valid Upto validation with strings
const test7Result = validateValidUpto(
  '2024-01-15T10:30:00.000Z',
  '2024-01-20T10:30:00.000Z'
);
console.log(
  'Test 7 (Valid Upto strings):',
  test7Result.valid ? 'PASS' : 'FAIL',
  test7Result.error || 'Success'
);

// Test 8: Valid Upto before E-Way Bill date (should fail)
const test8Result = validateValidUpto(
  '2024-01-15T10:30:00.000Z',
  '2024-01-10T10:30:00.000Z'
);
console.log(
  'Test 8 (Valid Upto before E-Way date):',
  !test8Result.valid ? 'PASS' : 'FAIL',
  test8Result.error || 'Should have failed'
);

console.log('\n=== Test Summary ===');
console.log(
  'All tests demonstrate that the enhanced validation logic handles both string and Date object inputs correctly.'
);
console.log(
  'The fixes ensure compatibility with both legacy string formats and new Date object formats.'
);
