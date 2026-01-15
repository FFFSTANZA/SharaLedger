# Banking in Frappe Books

The banking module in Frappe Books allows you to import bank statements, categorize transactions, and reconcile them with your General Ledger.

## Workflow

The banking workflow consists of four main steps:

1.  **Import**: Import your bank statement (CSV, XLS, or XLSX).
2.  **Suggest**: The system analyzes transaction descriptions and suggests appropriate ledgers and voucher types.
3.  **Post**: Confirm the suggestions and post them to the General Ledger. This creates Journal Entries or Payments.
4.  **Reconcile**: Mark posted transactions as reconciled once they match your bank records.

## Detailed Steps

### 1. Statement Import
- Go to **Banking** -> **Statement Import**.
- Select your bank account and upload your statement file.
- Map the columns if necessary and click **Import**.
- Transactions will appear in the **Bank Reconciliation** tab with the status `Imported`.

### 2. Suggesting Ledgers
- In the **Bank Reconciliation** tab, you will see your imported transactions.
- For transactions with status `Imported`, click the **Suggest** button.
- The system will use auto-categorization to find the best matching ledger (e.g., Sales, Rent, Bank Charges).
- The transaction status will change to `Suggested`.

### 3. Editing Suggestions
- If the system's suggestion is incorrect, click the **Edit** icon on the transaction row.
- You can manually select the correct **Ledger**, **Voucher Type** (Payment, Receipt, or Journal Entry), and **Party**.
- Click **Save** to update the suggestion.

### 4. Posting to General Ledger
- Once a transaction has a correct suggestion, click the **Post** button.
- You can also select multiple transactions and use the **Post Selected** button at the top.
- Posting will create the actual accounting entries (Payments or Journal Entries) in Frappe Books.
- The transaction status will change to `Posted`.

### 5. Reconciliation
- After posting, transactions are ready to be reconciled.
- Click the **Reconcile** button on a `Posted` transaction.
- This marks the transaction as `Reconciled`, indicating it has been verified against your bank statement.

## Summary of Statuses

| Status | Meaning | Action Available |
| :--- | :--- | :--- |
| **Imported** | Raw transaction from bank statement. | Suggest |
| **Suggested** | System or user has assigned a ledger. | Edit / Post |
| **Posted** | Accounting entry created in GL. | Reconcile |
| **Reconciled** | Verified and finished. | None |
