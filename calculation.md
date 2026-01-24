# Tax Calculation Logic - Project Versoll

This document details the mathematical and logical implementation of tax calculations within the software, specifically focusing on GST and TDS (Indian Localization).

## 1. GST (Goods and Services Tax)

### Calculation Base
GST is calculated at the item level. For each item in an invoice (Sales or Purchase):
`Item Amount = Rate * Quantity`

### Discount Treatment
The software supports two modes of discount application (configured via `discountAfterTax` field):
1.  **Discount Before Tax (Standard)**:
    `Taxable Value = Item Amount - Discount Amount`
2.  **Discount After Tax**:
    `Taxable Value = Item Amount`

### Formula
`GST Amount (per account) = Taxable Value * (Tax Rate / 100)`

### Summary & Posting
-   GST is summarized by GL account and rate in the `taxes` table.
-   **Sales**: GST is credited to the respective tax liability accounts.
-   **Purchases**: GST is debited to the respective input tax credit (ITC) accounts.

---

## 2. TDS (Tax Deducted at Source) - Indian Localization

The software implements TDS logic primarily for **Purchase Invoices**, ensuring compliance with the Income Tax Act.

### Applicability Conditions
TDS is automatically calculated if:
-   The Party (Supplier) is marked as `tdsApplicable`.
-   A `tdsCategory` (linked to a `TDSSection`) is assigned to the Party.
-   The `TDSSection` is active.

### Exclusion of GST (CBDT Circular 23/2017)
In accordance with Indian regulations, TDS is calculated on the **Net Total** of the invoice, excluding any GST components.
`TDS Base Amount = Sum of (Item Amounts - Item Discounts)`

### Threshold Logic
The software checks for thresholds before applying TDS:
1.  **Single Invoice Threshold**: If `TDSSection.threshold` is set, TDS applies only if the current invoice base amount exceeds it.
2.  **Cumulative Threshold**: If `TDSSection.cumulativeThreshold` is set, the software calculates the total taxable value for the Party in the current Financial Year (April 1st to March 31st). TDS applies if the sum (including current invoice) exceeds this limit.

### Rate Determination
-   **Standard Rate**: Defined in `TDSSection.rate`.
-   **Non-PAN Rate (Sec 206AA)**: If `party.panAvailable` is false, a higher rate (typically 20%) is applied.
-   **Non-Filer Rate (Sec 206AB)**: Higher of 2x the base rate or 5% is applied for specified persons who haven't filed returns (managed via `isNonFiler` flag).

### Calculation Formula
`TDS Amount = TDS Base Amount * (Applicable Rate / 100)`

### Accounting Implications
When TDS is applicable:
1.  **Expense Booking**: The full expense (including TDS) is debited.
2.  **Vendor Payable**: The amount payable to the vendor is reduced by the TDS amount.
    `Outstanding Amount = Grand Total (with GST) - TDS Amount`
3.  **TDS Liability**: The deducted amount is credited to the `TDS Payable` account.

---

## 3. General Calculations

### Net Total
Sum of all item amounts before taxes and discounts.

### Grand Total
`Grand Total = Net Total + Total GST - Total Discount`

### Rounding Logic
The software ensures that the double-entry accounting remains balanced:
1.  Calculates total debits and total credits.
2.  The difference (usually < ₹1.00) is posted to the `Round Off Account` defined in Accounting Settings.
3.  This ensures `Total Debit = Total Credit` for every transaction.

## 4. Multi-Currency
-   All tax calculations are initially performed in the document currency.
-   For ledger posting, amounts are converted to the **Company Base Currency** using the `exchangeRate` at the time of the transaction.
-   Rounding is applied after currency conversion to maintain ledger integrity.
