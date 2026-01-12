# Testing Checklist - Bank Import Enhancement

## Pre-Testing Setup

- [ ] Run `npm install --legacy-peer-deps`
- [ ] Run `npm run dev`
- [ ] Ensure application opens without errors
- [ ] Verify no console errors in Vite dev server

---

## UI Testing

### Import Wizard Dropdown
- [ ] Navigate to Setup → Import Wizard
- [ ] Check Import Type dropdown displays properly
- [ ] Verify all schema names are fully visible (not truncated)
- [ ] Try selecting "Bank Transaction" - should work smoothly
- [ ] Check Bank Account dropdown appears after selecting Bank Transaction
- [ ] Verify Bank Account dropdown displays account names fully

**Expected:** No text truncation, no UI overflow, dropdowns expand as needed

---

## Sidebar Testing

### Banking Section Removal
- [ ] Check left sidebar navigation
- [ ] Verify "Banking" section is NOT present
- [ ] Verify "Setup" section contains "Import Wizard"
- [ ] Verify application still works without Banking section

**Expected:** No Banking section, Import Wizard accessible via Setup

---

## Auto-Detection Testing

Prepare test files from different banks. For each file:

### HDFC Bank Statement
- [ ] Upload statement CSV/XLSX
- [ ] Check if Date column auto-detected (usually "Date" or "Transaction Date")
- [ ] Check if Narration column auto-detected
- [ ] Check if Withdrawal/Deposit columns auto-detected
- [ ] Check confidence score (should be high, 80%+)
- [ ] Verify date format detected (usually dd/MM/yy)

### ICICI Bank Statement
- [ ] Upload statement CSV/XLSX
- [ ] Check auto-detection of columns
- [ ] Verify "Transaction Remarks" detected as description
- [ ] Verify date format (usually dd-MM-yyyy)
- [ ] Check confidence score

### SBI Statement
- [ ] Upload statement CSV/XLSX
- [ ] Check "Txn Date" or "Value Dt" detected as date
- [ ] Verify "Description" detected
- [ ] Check date format (usually dd MMM yyyy or dd-MMM-yy)
- [ ] Check confidence score

### Axis Bank Statement
- [ ] Upload statement CSV/XLSX
- [ ] Check "Particulars" detected as description
- [ ] Check "Dr" and "Cr" columns detected
- [ ] Verify date format (usually dd/MM/yyyy)
- [ ] Check confidence score

### Additional Banks (if available)
- [ ] Kotak Mahindra Bank
- [ ] PNB
- [ ] Bank of Baroda
- [ ] Canara Bank
- [ ] Union Bank
- [ ] IndusInd Bank
- [ ] Yes Bank

**Expected:** High confidence (80%+) for all major banks, correct column mapping

---

## Date Format Testing

Test with statements containing different date formats:

- [ ] dd/MM/yyyy (15/01/2024) - Most common
- [ ] dd-MM-yyyy (15-01-2024)
- [ ] dd/MM/yy (15/01/24)
- [ ] dd-MM-yy (15-01-24)
- [ ] dd MMM yyyy (15 Jan 2024)
- [ ] dd-MMM-yyyy (15-Jan-2024)
- [ ] dd.MM.yyyy (15.01.2024)
- [ ] yyyy-MM-dd (2024-01-15)

**Expected:** All formats correctly parsed and displayed

---

## Amount Format Testing

Test with statements containing different amount formats:

### Currency Symbols
- [ ] ₹ 1,234.56 → Should parse as 1234.56
- [ ] Rs. 10000 → Should parse as 10000
- [ ] Rs 5000 → Should parse as 5000
- [ ] INR 2500 → Should parse as 2500
- [ ] $ 100.50 → Should parse as 100.50

### Comma Separators
- [ ] 1,234.56 → 1234.56
- [ ] 1,00,000.00 → 100000.00 (Indian lakh format)
- [ ] 10,00,000 → 1000000 (Indian crore format)
- [ ] 1234.56 (no commas) → 1234.56

### Negative Notations
- [ ] (1000) → -1000 (parentheses)
- [ ] 1000- → -1000 (trailing minus)
- [ ] -1000 → -1000 (leading minus)
- [ ] 1000 Dr → -1000 (Dr suffix)
- [ ] 1000 Cr → 1000 (Cr suffix)

**Expected:** All formats correctly parsed, proper debit/credit handling

---

## Header Detection Testing

Test with various file structures:

### Empty Rows at Top
- [ ] File with 1 empty row before header
- [ ] File with 3 empty rows before header
- [ ] File with 5 empty rows before header
- [ ] File with bank logo/metadata rows before header

**Expected:** System correctly identifies actual header row, skips empty/metadata rows

### Different Header Styles
- [ ] All caps headers (DATE, DESCRIPTION, DEBIT)
- [ ] Mixed case headers (Date, Description, Debit)
- [ ] Headers with special characters (Date*, Description#, Debit(₹))
- [ ] Headers with spaces (Txn Date, Transaction Details)

**Expected:** All variations correctly normalized and detected

---

## Column Keyword Testing

Test with unusual column names:

### Date Variations
- [ ] "Dt" → Detected as date
- [ ] "Txn Dt" → Detected as date
- [ ] "Value Dt" → Detected as date
- [ ] "Booking Date" → Detected as date
- [ ] "Post Date" → Detected as date

### Description Variations
- [ ] "Narr" → Detected as description
- [ ] "Particulars" → Detected as description
- [ ] "Transaction Details" → Detected as description
- [ ] "Chq Details" → Detected as description
- [ ] "Mode" → Detected as description

### Amount Variations
- [ ] "Withdrawal Amt" → Detected as debit
- [ ] "Deposit Amt" → Detected as credit
- [ ] "Amount Dr" → Detected as debit
- [ ] "Amount Cr" → Detected as credit
- [ ] "Payment" → Detected as debit
- [ ] "Receipt" → Detected as credit

### Balance Variations
- [ ] "Bal" → Detected as balance
- [ ] "Available Balance" → Detected as balance
- [ ] "Ledger Balance" → Detected as balance
- [ ] "Closing Bal" → Detected as balance

### Reference Variations
- [ ] "Txn ID" → Detected as reference
- [ ] "Transaction No" → Detected as reference
- [ ] "Chq No" → Detected as reference
- [ ] "Cheque No" → Detected as reference
- [ ] "UTR" → Detected as reference
- [ ] "RRN" → Detected as reference

**Expected:** All variations correctly detected and mapped

---

## Import Process Testing

### Full Import Flow
- [ ] Select Bank Transaction import type
- [ ] Select bank account
- [ ] Upload statement file
- [ ] Verify auto-detection and mappings
- [ ] Adjust mappings if needed
- [ ] Click "Import Data"
- [ ] Verify import completes successfully
- [ ] Check success count matches expected
- [ ] Verify duplicate detection works
- [ ] Check error handling for invalid data

### Profile Saving
- [ ] Import statement from a bank for first time
- [ ] Note the column mappings
- [ ] Import another statement from SAME bank
- [ ] Verify mappings are automatically applied (profile matched)
- [ ] Check confidence is 100% on second import

**Expected:** Profile auto-saves and applies on subsequent imports

---

## Edge Cases Testing

### Empty/Invalid Files
- [ ] Upload empty CSV → Should show error
- [ ] Upload file with only headers → Should show error
- [ ] Upload file with no valid data → Should show error
- [ ] Upload non-CSV/XLSX file → Should show error

### Malformed Data
- [ ] Row with invalid date → Should show error in cell
- [ ] Row with non-numeric amount → Should show error in cell
- [ ] Row with missing required fields → Should show error
- [ ] Mixed valid and invalid rows → Should import valid, report invalid

### Large Files
- [ ] File with 1000+ rows → Should import successfully
- [ ] File with 5000+ rows → Should import successfully
- [ ] Check progress bar during import
- [ ] Verify no performance issues

**Expected:** Graceful error handling, clear error messages, no crashes

---

## Duplicate Detection Testing

- [ ] Import statement with transactions
- [ ] Note the transaction count
- [ ] Import SAME statement again
- [ ] Verify duplicates are detected and skipped
- [ ] Check duplicate count in completion dialog
- [ ] Verify only new transactions are imported

**Expected:** 100% duplicate detection accuracy

---

## Confidence Score Testing

### High Confidence (80-100%)
- [ ] Standard bank statement → Should show high confidence
- [ ] Clear column headers → Should show high confidence
- [ ] All expected columns present → Should show 100% confidence

### Medium Confidence (50-80%)
- [ ] Some columns with unusual names → May show medium confidence
- [ ] Missing optional columns (balance, reference) → May reduce confidence

### Low Confidence (<50%)
- [ ] Very unusual column names → Will show low confidence
- [ ] Missing required columns → Will show low confidence
- [ ] Prompt user to manually map columns

**Expected:** Appropriate confidence levels, user can always manually adjust

---

## Documentation Testing

- [ ] Read BANK_IMPORT_IMPROVEMENTS.md - is it clear?
- [ ] Read INDIAN_BANK_FORMATS.md - is it helpful?
- [ ] Read CHANGES_SUMMARY.md - does it explain changes?
- [ ] Check if examples match actual behavior

---

## Regression Testing

Ensure existing functionality still works:

- [ ] Import other entity types (Party, Item, Invoice) still works
- [ ] Non-bank imports work normally
- [ ] Template download works
- [ ] Manual row addition works
- [ ] Column picker works
- [ ] Clear/Cancel actions work
- [ ] Navigation works properly
- [ ] Dark mode works (if applicable)

**Expected:** No regression in existing functionality

---

## Performance Testing

- [ ] Import 100 rows - time it
- [ ] Import 500 rows - time it
- [ ] Import 1000 rows - time it
- [ ] Check memory usage during import
- [ ] Verify no memory leaks after import
- [ ] Check application responsiveness during import

**Expected:** Acceptable performance, no crashes or hangs

---

## Cross-Platform Testing (if applicable)

- [ ] Test on Windows
- [ ] Test on macOS
- [ ] Test on Linux

**Expected:** Consistent behavior across platforms

---

## Final Checks

- [ ] No console errors during any operation
- [ ] No UI glitches or broken layouts
- [ ] All features work as documented
- [ ] Error messages are clear and helpful
- [ ] Success messages are accurate
- [ ] Application stable, no crashes

---

## Sign-Off

**Tester Name:** _______________  
**Date:** _______________  
**Build Version:** _______________  

**Test Result:** ☐ PASS | ☐ FAIL | ☐ PASS WITH ISSUES

**Issues Found:** _______________________________________________

**Recommendations:** _______________________________________________

---

## Notes

- Keep sample bank statements for each bank type for regression testing
- Document any new edge cases discovered during testing
- Update documentation if any discrepancies found
- Report any performance issues or optimization opportunities
