# Banking in Frappe Books

The banking module in Frappe Books allows you to import bank statements, categorize transactions, and reconcile them with your General Ledger.

## Workflow

The banking workflow is designed to be flexible, allowing you to either match existing transactions or create new ones from your bank statement.

1.  **Import**: Import your bank statement (CSV, XLS, or XLSX).
2.  **Match or Suggest**: 
    - **Match**: If you have already recorded the transaction in Frappe Books (e.g., a Payment), the system will suggest matching it.
    - **Suggest**: If it's a new transaction (e.g., bank charges), the system suggests the appropriate ledger.
3.  **Post or Confirm Match**: 
    - **Post**: Creates a new Journal Entry or Payment in Frappe Books.
    - **Confirm Match**: Links the bank transaction to the existing record.
4.  **Reconcile**: Finalize the process by marking the transaction as reconciled.

## Detailed Steps

### 1. Statement Import
- Go to **Banking** -> **Statement Import**.
- Select your bank account and upload your statement file.
- Transactions will appear in the **Bank Reconciliation** tab with the status `Imported`.

### 2. Auto-Matching
- The system automatically looks for matching Payments or Journal Entries based on amount and account.
- If a match is found, a **Match** button appears.
- Use **Auto-match All** in the header to bulk-confirm matches where only one definite match is found.

### 3. Posting New Transactions
- For transactions without matches, click **Suggest** to let the system categorize them.
- You can **Edit** the suggestion to change the Ledger, Voucher Type, or Party.
- Click **Post** to create the accounting entry in Frappe Books.

### 4. Reconciliation
- Once a transaction is **Posted** (created or matched), click **Reconcile**.
- This marks the transaction as verified against your statement.
- You can **Unmatch** or **Unreconcile** transactions if you need to make changes.

## Statuses and Actions

| Status | Meaning | Actions |
| :--- | :--- | :--- |
| **Imported** | New from statement. | Match, Suggest, Edit |
| **Suggested** | Ledger assigned. | Match, Post, Edit |
| **Posted** | Linked to GL record. | Reconcile, Unmatch |
| **Reconciled** | Verified. | Unreconcile |
