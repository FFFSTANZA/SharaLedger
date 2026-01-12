# Indian Bank Statement Format Reference

Quick reference guide for common column names used by major Indian banks.

## HDFC Bank

**Typical Columns:**
- Date: "Date" or "Transaction Date" or "Value Date"
- Description: "Narration" or "Description"
- Debit: "Withdrawal Amt." or "Debit"
- Credit: "Deposit Amt." or "Credit"
- Balance: "Balance"
- Reference: "Chq./Ref.No." or "Reference No"

**Date Format:** dd/MM/yy (e.g., 15/01/24)

**Amount Format:** 1,234.56 (with commas)

---

## ICICI Bank

**Typical Columns:**
- Date: "Transaction Date" or "Value Date"
- Description: "Transaction Remarks" or "Description"
- Debit: "Withdrawal" or "Debit Amount"
- Credit: "Deposit" or "Credit Amount"
- Balance: "Balance"
- Reference: "Reference No." or "Cheque No."

**Date Format:** dd-MM-yyyy (e.g., 15-01-2024)

**Amount Format:** 1,234.56 (with commas, sometimes with ₹ symbol)

---

## State Bank of India (SBI)

**Typical Columns:**
- Date: "Txn Date" or "Value Dt"
- Description: "Description" or "Remarks"
- Debit: "Debit" or "Withdrawal"
- Credit: "Credit" or "Deposit"
- Balance: "Balance" or "Running Balance"
- Reference: "Ref No./Cheque No." or "UTR No."

**Date Format:** dd MMM yyyy (e.g., 15 Jan 2024) or dd-MMM-yy (e.g., 15-Jan-24)

**Amount Format:** 1234.56 (sometimes without commas) or 1,234.56

---

## Axis Bank

**Typical Columns:**
- Date: "Transaction Date" or "Date"
- Description: "Particulars" or "Transaction Details"
- Debit: "Dr" or "Debit"
- Credit: "Cr" or "Credit"
- Balance: "Balance"
- Reference: "Chq / Ref no." or "Reference"

**Date Format:** dd/MM/yyyy (e.g., 15/01/2024)

**Amount Format:** 1,234.56 (with commas)

---

## Kotak Mahindra Bank

**Typical Columns:**
- Date: "Transaction Date" or "Date"
- Description: "Transaction Details" or "Narration"
- Debit: "Debit" or "Dr Amount"
- Credit: "Credit" or "Cr Amount"
- Balance: "Closing Balance" or "Balance"
- Reference: "Instrument No." or "Transaction ID"

**Date Format:** dd/MM/yyyy (e.g., 15/01/2024)

**Amount Format:** 1,234.56 (with commas, sometimes with Rs.)

---

## Punjab National Bank (PNB)

**Typical Columns:**
- Date: "Date" or "Post Date"
- Description: "Description" or "Narration"
- Debit: "Debit" or "Payment"
- Credit: "Credit" or "Receipt"
- Balance: "Balance"
- Reference: "Cheque Number" or "Ref No"

**Date Format:** dd-MM-yyyy (e.g., 15-01-2024) or dd/MM/yyyy

**Amount Format:** 1,234.56 (with commas)

---

## Bank of Baroda

**Typical Columns:**
- Date: "Tran Date" or "Transaction Date"
- Description: "Particulars" or "Details"
- Debit: "Debit" or "Dr"
- Credit: "Credit" or "Cr"
- Balance: "Balance"
- Reference: "Ref Number" or "Chq Number"

**Date Format:** dd-MMM-yyyy (e.g., 15-Jan-2024)

**Amount Format:** 1,234.56 (with commas)

---

## Canara Bank

**Typical Columns:**
- Date: "Date" or "Txn Posted Date"
- Description: "Description" or "Transaction Particulars"
- Debit: "Withdrawal" or "Debit"
- Credit: "Deposit" or "Credit"
- Balance: "Balance"
- Reference: "Ref No/Cheque No" or "Transaction ID"

**Date Format:** dd/MM/yyyy (e.g., 15/01/2024)

**Amount Format:** 1234.56 (may or may not have commas)

---

## Union Bank of India

**Typical Columns:**
- Date: "Transaction Date" or "Date"
- Description: "Transaction Particulars" or "Narration"
- Debit: "Withdrawal" or "Debit Amount"
- Credit: "Deposit" or "Credit Amount"
- Balance: "Available Balance" or "Balance"
- Reference: "Reference No." or "Cheque No."

**Date Format:** dd-MM-yyyy (e.g., 15-01-2024)

**Amount Format:** 1,234.56 (with commas)

---

## IndusInd Bank

**Typical Columns:**
- Date: "Transaction Date" or "Date"
- Description: "Narration" or "Transaction Details"
- Debit: "Debit" or "Dr Amt"
- Credit: "Credit" or "Cr Amt"
- Balance: "Balance"
- Reference: "Ref No" or "Transaction Ref"

**Date Format:** dd/MM/yyyy (e.g., 15/01/2024)

**Amount Format:** 1,234.56 (with commas)

---

## Yes Bank

**Typical Columns:**
- Date: "Date" or "Transaction Date"
- Description: "Description" or "Particulars"
- Debit: "Debit" or "Withdrawals"
- Credit: "Credit" or "Deposits"
- Balance: "Balance" or "Ledger Balance"
- Reference: "Transaction No" or "Reference"

**Date Format:** dd-MMM-yyyy (e.g., 15-Jan-2024)

**Amount Format:** 1,234.56 (with commas)

---

## Common Patterns

### Date Column Names
Most common: `Date`, `Transaction Date`, `Txn Date`, `Value Date`, `Posting Date`

### Description Column Names
Most common: `Description`, `Narration`, `Particulars`, `Transaction Details`, `Remarks`

### Debit Column Names
Most common: `Debit`, `Withdrawal`, `Dr`, `Dr Amount`, `Payment`

### Credit Column Names
Most common: `Credit`, `Deposit`, `Cr`, `Cr Amount`, `Receipt`

### Balance Column Names
Most common: `Balance`, `Running Balance`, `Closing Balance`, `Available Balance`

### Reference Column Names
Most common: `Reference`, `Ref No`, `Cheque No`, `Transaction ID`, `UTR`

---

## Special Cases

### Single Amount Column
Some banks use a single "Amount" column with:
- Positive values for credits
- Negative values for debits
- Or separate "Dr/Cr" indicator column

**System handles this by:** Checking for negative signs, parentheses, or Dr/Cr suffixes.

### Merged Headers
Some banks merge cells or have multi-line headers.

**System handles this by:** Checking multiple rows and selecting the one with highest keyword match.

### Currency Symbols
Some banks prefix amounts with ₹, Rs, Rs., or INR.

**System handles this by:** Automatically removing all currency symbols during parsing.

### Comma Separators
Indian numbering system: 1,00,000 (1 lakh) vs international: 100,000

**System handles this by:** Removing all commas before parsing as numbers.

---

## Tips for Manual Mapping

If auto-detection confidence is low (<100%):

1. **Date:** Look for columns with date-like headers
2. **Description:** Usually the widest text column
3. **Debit/Credit:** Look for "Dr" or "Cr" indicators
4. **Balance:** Often the rightmost numeric column
5. **Reference:** Look for "Ref", "Chq", or "UTR" keywords

Once you map correctly, the system saves the profile for future imports from the same bank!

---

## Testing Your Statement

Not sure if your bank statement will work?

1. Open the file in Excel/Calc
2. Check if it has columns for: Date, Description, and either Debit/Credit or Amount
3. If yes, it should work!
4. If unsure, try importing - the system will show confidence score
5. You can manually adjust mappings before importing

---

## Troubleshooting

### "No header found"
- **Cause:** Too many empty rows or non-standard format
- **Solution:** Open file, delete empty rows at top, ensure header row is within first 20 rows

### "Date parsing failed"
- **Cause:** Unusual date format
- **Solution:** Check date format, may need to reformat dates in Excel before importing

### "Amount parsing failed"
- **Cause:** Non-numeric characters in amount field
- **Solution:** Clean up amount columns in Excel (remove text, keep only numbers)

### "Low confidence"
- **Cause:** Column names don't match expected keywords
- **Solution:** Manually map columns, system will remember for next time

---

## Format Recommendations for Banks

If you're a bank looking to standardize your statement format, we recommend:

**Preferred Column Names:**
- Date: "Transaction Date"
- Description: "Description" or "Narration"
- Debit: "Debit Amount" or "Debit"
- Credit: "Credit Amount" or "Credit"
- Balance: "Balance"
- Reference: "Reference Number"

**Preferred Date Format:** dd/MM/yyyy (15/01/2024)

**Preferred Amount Format:** 1234.56 (with or without commas, no currency symbols)

**File Format:** CSV or XLSX

**Structure:**
- First row: Column headers
- Following rows: Transaction data
- No merged cells
- No empty rows in data
