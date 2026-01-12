# Banking Setup Implementation

## Overview
This implementation adds a comprehensive Banking section under Setup for handling bank statement imports with automatic format detection, data normalization, auto-categorization, and duplicate detection.

## What Was Implemented

### 1. Banking Setup Page
**Location:** `/banking-setup` (src/pages/BankingSetup.vue)

Features:
- **Import Section:** Central starting point for importing bank statements with clear call-to-action
- **Quick Links:** Fast access to:
  - Bank Transactions list
  - Import Batches history
  - Import Profiles management
- **Feature Highlights:** Explains the system's capabilities:
  - Automatic Format Detection
  - Data Normalization
  - Auto-Categorization
  - Duplicate Detection

### 2. Routing Integration
**File:** src/router.ts
- Added route for `/banking-setup` pointing to BankingSetup.vue component

### 3. Sidebar Navigation
**File:** src/utils/sidebarConfig.ts
- Added "Banking" menu item under Setup section
- Positioned between "Chart of Accounts" and "Tax Templates"

### 4. Auto-Categorization System
**File:** src/banking/autoCategorize.ts

#### TransactionCategorizer Class
Provides intelligent transaction categorization based on description patterns:

**Default Categorization Rules:**
- **Salary Credit:** Matches patterns like "salary", "payroll", "wages", "paycheck"
- **Tax Payment:** Matches "tax", "income tax", "gst", "vat", "tcs", "tds"
- **Utilities:** Matches "electricity", "water", "gas", "power", "internet", "broadband"
- **Rent:** Matches "rent", "lease"
- **Insurance:** Matches "insurance", "policy"
- **Bank Charges:** Matches "bank charge", "service charge", "maintenance fee", "atm fee"
- **Loan Repayment:** Matches "loan repayment", "emi", "loan installment"
- **Payment Modes:**
  - UPI: Matches "@", "UPI"
  - Cash: ATM withdrawals
  - Card: POS transactions
  - Bank Transfer: NEFT, RTGS, IMPS
  - Cheque: "cheque", "chq"

**Key Features:**
- **Confidence Scoring:** Calculates match confidence based on pattern overlap
- **Priority System:** Rules have priorities to handle conflicts
- **Account Mapping:** Auto-suggests income/expense accounts from Chart of Accounts
- **Party Suggestions:** Uses Levenshtein distance to find similar existing parties
- **Extensible:** Custom rules can be added via `createCustomRule()` method

### 5. Importer Integration
**File:** src/banking/BankStatementImporter.ts

**Enhancements:**
- Added `categorizeTransactions()` method
- Returns map of transaction index to categorization suggestions
- Imports `getCategorizer` from autoCategorize module

## Existing Infrastructure (Already Available)

### Statement Parsing
**File:** src/banking/statementParser.ts
- **Formats Supported:** CSV, XLSX, XLS
- **Function:** `parseStatementFile(fileName, data: Uint8Array)`
- **Function:** `getFileExtension(filename)`

### Format Detection & Mapping
**File:** src/banking/bankStatementMapping.ts
- **Auto-Header Detection:** Finds header row by scoring column keywords
- **Auto-Column Mapping:** Maps columns to BankTransaction fields based on keywords
- **Keywords:** Extensive list for date, description, debit, credit, balance, reference
- **Confidence Score:** Provides mapping confidence for validation

### BankStatementImporter Class
**File:** src/banking/BankStatementImporter.ts
- **Format Detection:** Detects file type and parses accordingly
- **Header Detection:** Auto-detects header row position
- **Column Mapping:** Auto-maps columns or uses saved profiles
- **Date Parsing:** Supports 20+ date formats (dd/MM/yyyy, dd-MM-yyyy, dd MMM yyyy, etc.)
- **Money Parsing:** Handles:
  - Currency symbols (₹, Rs, INR, $, £, €, ¥)
  - Cr/Dr suffixes
  - Parentheses for negative amounts
  - Trailing minus signs
  - Comma separators

### Duplicate Detection
**File:** src/pages/ImportWizard.vue (lines 973-1006)
- **dedupeKey:** Generated for each transaction based on:
  - Date (ISO format: YYYY-MM-DD)
  - Debit amount
  - Credit amount
  - Normalized description
  - Bank reference (if available)
- **Detection Logic:**
  1. Generate dedupeKey for each imported transaction
  2. Query existing transactions for matching dedupeKeys
  3. Skip transactions with duplicate keys
  4. Also check for duplicates within the same import batch
- **Results:** Counts duplicates skipped and displays in import summary

### Data Models

#### BankTransaction
**File:** models/baseModels/BankTransaction/BankTransaction.ts
**Fields:**
- `date`: Transaction date
- `description`: Transaction description
- `debit`: Debit amount
- `credit`: Credit amount
- `balance`: Running balance (optional)
- `bankReference`: Bank transaction reference number
- `modeOfPayment`: Auto-inferred (UPI, NEFT, RTGS, IMPS, ATM, POS, Card, Cheque)
- `bankAccount`: Linked bank account
- `importBatch`: Reference to BankImportBatch
- `status`: Unmatched/Matched/Posted
- `dedupeKey`: Computed key for duplicate detection (hidden)

**Validation:**
- Either debit or credit must be set (not both, not neither)

#### BankImportBatch
**File:** models/baseModels/BankImportBatch/BankImportBatch.ts
**Fields:**
- `importedAt`: Timestamp
- `fileName`: Imported file name
- `bankAccount`: Target bank account
- `transactionsImported`: Count of successfully imported transactions
- `duplicatesSkipped`: Count of duplicate transactions skipped
- `errors`: Count of errors

**Cascade Delete:** Deleting a batch also deletes all related transactions

#### BankImportProfile
**File:** models/baseModels/BankImportProfile/BankImportProfile.ts
**Fields:**
- `bankName`: Bank name (inferred from filename)
- `accountType`: Savings/Current/Other
- `dateFormat`: Detected date format
- `debitCreditLogic`: SeparateColumns/SignedAmount/IndicatorColumn
- `ignoreHeaderRowsCount`: Number of header rows to skip
- `columnMapping`: JSON mapping of columns to fields
- `headerSignature`: Normalized header signature for matching

**Auto-Save:** Profiles are auto-created on successful imports if no matching profile exists

## How It Works

### Import Flow
1. User navigates to Banking Setup → Clicks "Start Import"
2. User selects "BankTransaction" as import type
3. User selects bank account
4. User selects bank statement file (CSV/XLSX/XLS)
5. **Statement Parsing:** File is parsed into row matrix
6. **Header Detection:** System finds header row and detects column mapping
7. **Profile Matching:** Checks for existing profiles with matching header signature
8. **Data Normalization:**
   - Dates parsed to standard format
   - Amounts normalized (currency symbols, separators, signs)
   - Descriptions normalized (whitespace)
   - Payment mode inferred from description
9. **Duplicate Detection (during import):**
   - dedupeKey generated for each transaction
   - Existing transactions queried for matches
   - Duplicates skipped
10. **Batch Creation:** BankImportBatch created to track import
11. **Transactions Created:** Only non-duplicate transactions saved
12. **Profile Saved:** New profile created if header signature not seen before
13. **Summary Display:** Shows imported, duplicates skipped, errors

### Auto-Categorization Flow
1. TransactionCategorizer is initialized
2. Default rules loaded from patterns
3. For each imported transaction:
   - Description is normalized (lowercase, special chars removed)
   - Patterns are matched against description
   - Best matching rule selected by priority
   - Confidence score calculated
   - Account suggestion from Chart of Accounts
   - Party suggestions from existing parties
4. Results returned as suggestions map

## Format Independence
The system is designed to work with **any** bank format (not just Indian banks):

- **Keyword-Based Detection:** Uses generic keywords (date, description, debit, credit, balance)
- **Flexible Date Parsing:** Supports 20+ international date formats
- **Money Normalization:** Handles various currency symbols and formatting
- **Pattern Matching:** Categorization based on generic transaction patterns
- **Header Signature Matching:** Uses normalized column names for profile matching

## Usage

### Import a Bank Statement
1. Go to Setup → Banking
2. Click "Start Import"
3. In Import Wizard:
   - Select "Bank Transaction" as import type
   - Select the bank account
   - Click "Select File" and choose CSV/XLSX/XLS file
   - Review detected column mapping
   - Review transactions
   - Click "Import Data"
4. View import summary (imported, duplicates, errors)

### View Imported Transactions
1. Go to Setup → Banking
2. Click "Bank Transactions" card
3. Or go directly to Setup → Banking → Import Wizard → View Transactions

### View Import History
1. Go to Setup → Banking
2. Click "Import Batches" card
3. View all import batches with counts and timestamps

### Manage Import Profiles
1. Go to Setup → Banking
2. Click "Import Profiles" card
3. View all saved profiles (auto-created from imports)

## Technical Details

### Date Formats Supported
- ISO: yyyy-MM-dd
- European: dd/MM/yyyy, dd-MM-yyyy, dd.MM.yyyy
- US: MM/dd/yyyy
- Abbreviated: dd MMM yyyy, d-MMM-yyyy
- Short: dd/MM/yy, dd-MM-yy, d-M-yy

### Money Formats Supported
- Currency symbols: ₹, Rs, Rs., INR, $, £, €, ¥
- Parentheses for negative: (123.45)
- Trailing minus: 123.45-
- Suffix indicators: Cr (credit), Dr (debit)
- Comma separators: 1,23,456.78

### Payment Modes Detected
- UPI, IMPS, NEFT, RTGS
- ATM, POS, Card
- Cheque

## Future Enhancements

Potential improvements:
1. **Machine Learning Categorization:** Learn from user corrections
2. **Party Auto-Creation:** Suggest creating new parties based on patterns
3. **Advanced Duplicate Rules:** Configurable duplicate detection logic
4. **Import Scheduling:** Scheduled automatic imports
5. **PDF Support:** Parse PDF bank statements
6. **API Integration:** Direct bank API connections
7. **Matching Interface:** UI to match transactions to invoices/payments
8. **Reconciliation Workflow:** Full reconciliation process

## Testing
Test files:
- Test with various CSV formats (different delimiters, headers)
- Test with XLSX/XLS files from different banks
- Test with different date formats
- Test with different currency formats
- Test duplicate detection (import same file twice)
- Test categorization accuracy with real transactions

## Files Created/Modified

### Created
- src/pages/BankingSetup.vue
- src/banking/autoCategorize.ts

### Modified
- src/router.ts (added route)
- src/utils/sidebarConfig.ts (added menu item)
- src/banking/BankStatementImporter.ts (added categorization integration)

### Existing (Used As-Is)
- src/banking/statementParser.ts
- src/banking/bankStatementMapping.ts
- src/pages/ImportWizard.vue
- models/baseModels/BankTransaction/BankTransaction.ts
- models/baseModels/BankImportBatch/BankImportBatch.ts
- models/baseModels/BankImportProfile/BankImportProfile.ts
- schemas/app/BankTransaction.json
- schemas/app/BankImportBatch.json
- schemas/app/BankImportProfile.json
