# Banking Module V2 - User Guide

## Overview

The Banking Module V2 is a complete redesign that provides a Tally/Zoho-style banking experience with proper General Ledger integration, no foreign key constraint errors, and a simple, intuitive workflow.

## Key Features

### ✅ No Foreign Key Constraints
All fields in BankTransaction are Data/Currency/Date types - no Link fields that cause FK errors.

### ✅ Proper GL Integration
Bank transactions create proper Payment or JournalEntry vouchers that handle all GL posting through the existing Fyo framework.

### ✅ Simple Workflow
Only 2 states: **Unreconciled** → **Reconciled**

### ✅ Smart Auto-Categorization
Pattern-based categorization that learns from descriptions and automatically suggests accounts.

### ✅ Batch Operations
Select multiple transactions and post them all at once to the General Ledger.

### ✅ Inline Editing
Edit account and party information directly in the table without modal dialogs.

## User Workflow

### Step 1: Import Bank Statements
1. Go to **Bank Import** page
2. Select your bank account
3. Upload CSV/Excel file
4. Map columns if needed
5. Import transactions

### Step 2: View and Categorize
1. Go to **Bank Reconciliation** page
2. Select bank account from dropdown
3. View all unreconciled transactions
4. Click **Auto-categorize** to automatically categorize based on description patterns
5. Or manually select account and party for each transaction

### Step 3: Post to General Ledger
1. Select transactions you want to post (checkbox on left)
2. Ensure all selected transactions have an account assigned
3. Click **Post to GL** button
4. System will:
   - Create Payment entry if party is specified
   - Create Journal Entry if no party
   - Submit the voucher
   - Mark transaction as Reconciled
   - Link the voucher to the transaction

### Step 4: Review
1. Reconciled transactions show the linked voucher
2. Click voucher name to open and view details
3. All GL entries are properly recorded through the voucher

## Auto-Categorization Patterns

The system recognizes these patterns in transaction descriptions:

### Income (Credits)
- "payment from"
- "received from"
- "transfer from"
- "credit customer"
- "invoice paid"
- "sales"

### Expenses (Debits)
- "payment to"
- "paid to"
- "transfer to"
- "debit supplier"
- "purchase"
- "expense"
- "bill"

### Specific Categories
- **Salary**: salary, payroll, wages
- **Rent**: rent
- **Utilities**: electricity, water, internet, phone, utility
- **Tax**: tax, gst, vat, tds

## Voucher Creation Logic

### With Party (Creates Payment Entry)
```
If transaction has a party:
  Create Payment with:
    - Party: specified party name
    - Amount: transaction amount
    - Type: Receive (credit) or Pay (debit)
    - Accounts: Proper debit/credit based on type
```

### Without Party (Creates Journal Entry)
```
If transaction has no party:
  Create Journal Entry with:
    - Type: Bank Entry
    - Accounts: Bank account ↔ Categorized account
    - Debit/Credit: Based on transaction type
```

## Account Structure

### Required Accounts
- **Bank Accounts**: Must be of type "Bank"
- **Income Accounts**: For credit transactions (Sales, Service Income, etc.)
- **Expense Accounts**: For debit transactions (Rent, Salary, Utilities, etc.)

### Account Lookup
- Exact name match first
- Then partial name match
- Falls back to generic Income/Expense accounts

## Troubleshooting

### "Please categorize all selected transactions"
**Cause**: One or more selected transactions don't have an account assigned.
**Fix**: Review selected transactions and assign an account to each.

### "Account 'XYZ' does not exist"
**Cause**: The account name doesn't match any account in the system.
**Fix**: 
- Create the account first in Chart of Accounts
- Or select a different existing account

### "Party does not exist"
**Cause**: Party name doesn't exist in the system.
**Fix**: The system will auto-create the party as Customer (credit) or Supplier (debit).

### "Bank account does not exist"
**Cause**: The bank account in the transaction doesn't exist.
**Fix**: 
- Ensure you have bank accounts set up
- Re-import transactions with correct bank account

## Tips for Best Results

### 1. Consistent Naming
Use consistent party names in your bank descriptions for better auto-categorization.

### 2. Set Up Common Accounts
Create these accounts before importing:
- Sales
- Service Income
- Rent
- Salary
- Utilities
- Office Expenses
- Bank Charges

### 3. Review Before Posting
Always review auto-categorized transactions before posting to ensure accuracy.

### 4. Use Party Field
Add party names to link transactions with customers/suppliers for better reporting.

### 5. Batch Processing
Process similar transactions together for efficiency.

## Technical Details

### Schema Fields
- **date**: Transaction date
- **description**: Transaction description from bank
- **amount**: Transaction amount (always positive)
- **type**: Credit or Debit
- **bankAccount**: Bank account name (Data field)
- **account**: Categorized account (Data field)
- **party**: Party name (Data field, optional)
- **status**: Unreconciled or Reconciled
- **postedVoucher**: Name of created voucher
- **postedVoucherType**: Payment or JournalEntry
- **notes**: User notes
- **reference**: Bank reference number
- **chequeNo**: Cheque number

### No Foreign Keys
All account and party fields are stored as text (Data type), eliminating FK constraint errors.

### Voucher Linking
Once posted, the transaction stores the voucher name and type, allowing easy navigation.

## Architecture Benefits

1. **Separation of Concerns**: Bank data separate from accounting vouchers
2. **Flexibility**: Easy to categorize and re-categorize before posting
3. **Reliability**: No FK errors, robust error handling
4. **Auditability**: Clear link between bank transactions and GL entries
5. **Extensibility**: Easy to add new features and patterns

## Support

For issues or questions:
1. Check transaction status and error messages
2. Verify accounts exist in Chart of Accounts
3. Review console logs for detailed error information
4. Check that bank accounts are properly configured
