# Banking Module Testing Documentation

## Overview
This document describes the comprehensive testing suite for the bank statement import and reconciliation feature.

## Test File
- **Location**: `/tests/bank_statement_comprehensive.spec.ts`
- **Sample Data**: `/tests/sample_bank_statement.csv`

## Test Coverage

### 1. CSV Parsing Tests
Tests the ability to parse CSV files with various formats:
- Standard CSV with headers
- Quoted fields with commas
- Empty fields
- Various date formats

### 2. Account Setup Tests
Tests the creation of required accounts:
- Bank accounts (Asset type)
- Cash accounts (Cash type)
- Expense accounts (Bank Charges)
- Income accounts (Interest Income)
- Liability accounts (Creditors)

### 3. Auto-Categorization Tests
Tests pattern matching for automatic categorization:
- ATM withdrawals → Cash account
- Bank charges → Bank Charges account
- Interest income → Interest Income account
- UPI transactions (pattern detection)

### 4. Dedupe Logic Tests
Tests duplicate transaction prevention:
- Dedupe key generation (date + description + amount + balance)
- Duplicate detection before import
- Import skipping for duplicates

### 5. Import Functionality Tests
Tests the transaction import process:
- CSV parsing and mapping
- Transaction creation
- Auto-categorization application
- Batch import handling

### 6. Reconciliation Tests
Tests the reconciliation workflow:
- Retrieving unreconciled transactions
- Manual categorization
- Party selection

### 7. GL Posting Tests - Journal Entry
Tests posting transactions without party:
- Journal Entry creation
- Debit/Credit entries
- Account mapping (Bank vs Category)
- Status update (Unreconciled → Reconciled)
- Balancing verification (debits = credits)

### 8. GL Posting Tests - Payment Entry
Tests posting transactions with party:
- Payment entry creation
- Party mapping
- Payment type (Receive/Pay) based on transaction type
- Amount verification
- Account selection

### 9. Error Handling Tests
Tests error scenarios:
- Posting already reconciled transactions
- Posting without category account
- Invalid data handling

### 10. Date Formatting Tests
Tests date format conversion:
- DD/MM/YYYY → YYYY-MM-DD
- YYYY/MM/DD → YYYY-MM-DD
- YYYY-MM-DD (unchanged)
- Single-digit date/month padding

### 11. Summary Tests
Tests complete flow verification:
- Transaction count verification
- Reconciliation status distribution
- Voucher creation verification
- Data integrity checks

## Running Tests

```bash
npm test -- tests/bank_statement_comprehensive.spec.ts
```

## Test Data Structure

### Sample Bank Statement CSV
```csv
Date,Description,Withdrawal,Deposit,Balance,Reference
2024-01-01,Opening Balance,,,50000.00,
2024-01-02,ATM-WDL/CASH/CONNAUGHT PLACE,5000.00,,45000.00,ATM123
2024-01-03,UPI-GROCERY STORE-1234@okaxis,1500.00,,43500.00,UPI456
2024-01-04,BANK CHARGES,100.00,,43400.00,CHG789
2024-01-05,Interest Income,,250.00,43650.00,INT001
```

## Expected Flow

### 1. Import Phase
```
CSV File → Parse → Map Columns → Auto-Categorize → Create BankTransaction records (Unreconciled)
```

### 2. Reconciliation Phase
```
Unreconciled Transaction → Select Category/Party → Post to GL → Create Payment/JournalEntry → Mark as Reconciled
```

### 3. GL Posting Logic

#### Without Party (Journal Entry)
**Deposit:**
- Debit: Bank Account
- Credit: Category Account

**Withdrawal:**
- Debit: Category Account
- Credit: Bank Account

#### With Party (Payment Entry)
**Deposit (Receive):**
- From: Category Account
- To: Bank Account
- Payment Type: Receive

**Withdrawal (Pay):**
- From: Bank Account
- To: Category Account
- Payment Type: Pay

## Key Features Tested

### ✅ Import Features
- CSV file selection via IPC
- CSV parsing (RFC 4180 compliant)
- Column mapping (date, description, withdrawal, deposit, balance, reference)
- Auto-mapping based on header names
- Duplicate detection
- Batch import
- Progress feedback

### ✅ Auto-Categorization Features
- Pattern matching for common transactions
- ATM withdrawal detection
- Bank charges detection
- Interest income/expense detection
- UPI transaction parsing
- Configurable patterns

### ✅ Reconciliation Features
- Unreconciled transaction listing
- Manual category selection
- Optional party selection
- Transaction detail display
- Amount formatting
- Batch posting capability

### ✅ GL Posting Features
- Journal Entry creation (no party)
- Payment Entry creation (with party)
- Automatic account mapping
- Debit/Credit calculation
- Balance verification
- Status updates
- Voucher linking

### ✅ Error Handling
- Already reconciled check
- Missing category check
- Invalid data handling
- User-friendly error messages

## Known Limitations

1. **CSV Format**: Currently supports standard CSV format with headers
2. **Date Formats**: Supports DD/MM/YYYY, YYYY/MM/DD, YYYY-MM-DD
3. **Currency**: Assumes single currency
4. **Dedupe**: Based on date+description+amount+balance (may need enhancement for some banks)

## Future Enhancements

1. **Multi-format Support**: Support for various bank statement formats (PDF, OFX, QIF)
2. **Smart Party Detection**: AI-based party name extraction from descriptions
3. **Recurring Transactions**: Auto-apply rules for recurring transactions
4. **Bank Rules**: User-defined categorization rules
5. **Reconciliation Reports**: Detailed reconciliation reports
6. **Bank Balance Sync**: Verify against actual bank balance
