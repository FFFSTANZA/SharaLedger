# Banking System - Complete Guide

## Overview

The Banking System in Versoll Books provides comprehensive import and reconciliation capabilities for bank statements. It allows you to import CSV bank statements, categorize transactions, and reconcile them with your accounting records.

## Key Features

- **CSV Import**: Import bank statements from various formats
- **Smart Categorization**: Automatic transaction categorization with confidence scores
- **Duplicate Prevention**: Advanced hashing prevents duplicate imports
- **Multiple Reconciliation Options**: Match, create new entries, or ignore
- **Reference Tracking**: Store transaction references and balances
- **Keyboard Navigation**: Efficient keyboard shortcuts for reconciliation

---

## Import Process

### 1. CSV File Format

The system supports various bank statement CSV formats with automatic column detection:

**Required Columns:**
- **Date**: Transaction date (supports multiple formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, etc.)
- **Description**: Transaction description/narration

**Optional Columns:**
- **Amount**: Single amount column (with debit/credit indicator)
- **Debit/Credit**: Separate debit and credit columns
- **Balance**: Running balance
- **Reference**: Transaction reference number

### 2. Import Steps

1. **Select Bank Account**: Choose the target bank account from your Chart of Accounts
2. **Choose CSV File**: Select your bank statement file
3. **Preview Data**: Review parsed transactions with categorization suggestions
4. **Import**: Save transactions as unreconciled entries

### 3. Smart Features

**Enhanced Column Detection:**
- Supports multiple date formats
- Handles various amount formats (with/without currency symbols)
- Detects reference numbers and balance columns

**Duplicate Prevention:**
- Uses deterministic hashing: `date + amount + description + bankAccount + reference`
- Prevents re-importing same transactions
- Shows duplicate indicators in preview

**Smart Categorization:**
- Pattern matching on transaction descriptions
- Confidence scores (High: 80%+, Medium: 60%+, Low: <60%)
- Suggests document type and account categories

---

## Reconciliation Process

### 1. Transaction States

- **Unreconciled**: Newly imported transactions
- **Matched**: Successfully reconciled with accounting entries
- **Ignored**: Transactions marked to skip

### 2. Reconciliation Methods

#### Method 1: Match Existing
Link bank transaction to existing Payment, Receipt, or Journal Entry.

**Use When:**
- Transaction already recorded in accounting system
- Need to match historical entries
- Vendor/customer payments already processed

#### Method 2: Create New
Generate new accounting entries based on bank transaction.

**Use When:**
- Recording new transactions from bank
- First time recording certain payments/receipts
- Bank statements show transactions not yet in books

#### Method 3: Ignore
Mark transaction as ignored (not applicable).

**Use When:**
- Bank charges/fees (if handled separately)
- Transfer between own accounts
- Test transactions
- Errors in bank statement

---

## Document Types Explained

### Payment Entry
**Purpose**: Records money going out of the business
**When to Use**: 
- Vendor payments
- Expense payments
- Salaries
- Tax payments
- Utility bills

**Accounting Flow**:
```
Bank Account (Credit) → Vendor/Expense Account (Debit)
```

**Required Fields**:
- Party (vendor or employee)
- Party Account (what they're owed)
- Amount
- Date

### Receipt Entry
**Purpose**: Records money coming into the business
**When to Use**:
- Customer payments
- Sales receipts
- Refunds received
- Investment income
- Loan proceeds

**Accounting Flow**:
```
Customer/Income Account (Debit) → Bank Account (Credit)
```

**Required Fields**:
- Party (customer)
- Party Account (what they paid)
- Amount
- Date

### Journal Entry
**Purpose**: General accounting adjustments and transfers
**When to Use**:
- Bank charges and fees
- Interest adjustments
- Balance corrections
- Transfer between accounts
- Depreciation entries

**Accounting Flow**:
```
Two or more accounts with equal debits and credits
```

**Required Fields**:
- Ledger Account(s)
- Debit/Credit amounts
- Entry type (Bank Entry recommended)

---

## Smart Categorization Patterns

The system automatically suggests document types based on transaction descriptions:

### High Confidence (90%+)
- **Bank Transfers**: transfer, wire, NEFT, IMPS, RTGS
- **Cash Withdrawals**: ATM, withdrawal
- **Interest Income**: interest, dividend
- **Salary Payments**: salary, wages, payroll
- **Tax Payments**: tax, GST, TDS

### Medium Confidence (80%+)
- **Utilities**: electricity, water, gas, internet, phone
- **Rent Payments**: rent, lease
- **Cheque Payments**: cheque, chq, chk
- **Insurance**: insurance, premium
- **Customer Receipts**: customer, client, sales

### Low Confidence (70%+)
- **Vendor Payments**: vendor, supplier, purchase
- **Refunds**: refund, return
- **Bank Charges**: commission, charges, fee

---

## Workflow Examples

### Example 1: Customer Payment Received
**Bank Statement**: "Online transfer from ABC Corp - Invoice #INV-001"
1. Import transaction (categorized as Receipt Entry - Customer Receipt)
2. Select "Create New"
3. System suggests: Receipt Entry for ABC Corp
4. Create receipt entry linking to invoice
5. Transaction marked as Matched

### Example 2: Vendor Payment
**Bank Statement**: "UPI payment to XYZ Suppliers - PO #12345"
1. Import transaction (categorized as Payment Entry - Vendor Payment)
2. Select "Create New"
3. System suggests: Payment Entry for XYZ Suppliers
4. Create payment entry
5. Transaction marked as Matched

### Example 3: Bank Charges
**Bank Statement**: "Service charges for account maintenance"
1. Import transaction (categorized as Journal Entry - Bank Charges)
2. Select "Create New"
3. Choose "Journal Entry"
4. Create journal: Bank Charges (Debit) → Bank Account (Credit)
5. Transaction marked as Matched

---

## Keyboard Shortcuts

### Navigation
- **↓ or j**: Next transaction
- **↑ or k**: Previous transaction
- **Esc**: Clear selection

### Quick Actions
- **1**: Match with existing
- **2**: Create new entry
- **3**: Ignore transaction

---

## Troubleshooting

### Import Issues

**"Could not detect transaction date column"**
- Ensure date column contains recognizable date formats
- Check for consistent date formatting
- Verify column headers contain date-related terms

**"Could not detect amount column"**
- Ensure amount column exists (single amount or separate debit/credit)
- Check for currency symbols or formatting
- Verify column headers contain amount-related terms

**"Duplicate rows detected"**
- Normal behavior - same transaction imported before
- System automatically skips duplicates on save
- Check if transaction was already processed

### Reconciliation Issues

**"Party and party account are required"**
- Select a valid customer/vendor
- Ensure party has a default account set
- Check party account configuration in Chart of Accounts

**"Invalid transaction date"**
- Ensure transaction date is valid
- Check date format in source data
- Verify date range is reasonable

### Common Solutions

1. **Review categorization**: Check confidence scores and adjust if needed
2. **Verify accounts**: Ensure bank and party accounts exist in Chart of Accounts
3. **Check permissions**: Verify user has access to required document types
4. **Validate data**: Ensure import data is clean and consistent

---

## Best Practices

### Import Process
1. **Clean data**: Remove unnecessary columns, ensure consistent formatting
2. **Verify bank account**: Select correct bank account before import
3. **Review preview**: Check categorization suggestions before saving
4. **Regular imports**: Import statements regularly to stay current

### Reconciliation Process
1. **Process daily**: Reconcile transactions promptly
2. **Use matching**: Match existing entries when possible
3. **Categorize consistently**: Maintain consistent categorization rules
4. **Document exceptions**: Use ignore feature for truly exceptional transactions

### Data Management
1. **Backup regularly**: Export data before major reconciliation
2. **Review reports**: Use reconciliation reports to track progress
3. **Monitor duplicates**: Check for unusual duplicate patterns
4. **Validate balances**: Ensure imported transactions match bank statements

---

## Advanced Features

### Custom Categorization
- Modify categorization rules in `src/banking/bankStatement.ts`
- Add patterns for your specific bank transactions
- Adjust confidence scores based on your needs

### Enhanced Import
- Support for additional CSV formats
- Custom column mapping
- Advanced duplicate detection

### Reporting
- Reconciliation status reports
- Categorization accuracy reports
- Outstanding transaction summaries

---

## Integration with Accounting System

The Banking System integrates seamlessly with:
- **Chart of Accounts**: Uses existing account structure
- **Party Management**: Links to customers and vendors
- **Document Flow**: Creates Payment, Receipt, and Journal Entries
- **Financial Reports**: Affects General Ledger, Trial Balance, etc.

This ensures bank reconciliation maintains accurate accounting records and proper audit trails.
