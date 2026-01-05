# TDS (Tax Deducted at Source) Implementation - India

## Overview

This document describes the implementation of TDS (Tax Deducted at Source) functionality for Indian compliance in Frappe Books. The implementation follows a **safe, additive-only approach** that does not modify the core accounting engine or historical data.

## Implementation Status: ✅ COMPLETE

### What is TDS?

TDS is a mechanism in India where tax is deducted at the source of income. When making certain payments (like contractor fees, professional services, rent, etc.), the payer must deduct tax at a prescribed rate and deposit it with the government on behalf of the recipient.

## Features Implemented

### 1. Master Data

#### TDS Section Master (`TDSSection`)

Defines various TDS sections under the Income Tax Act.

**Fields:**

- **Section Name** (e.g., 194C, 194J): The section code
- **Description**: What this section covers
- **TDS Rate (%)**: Standard rate (e.g., 1% for 194C)
- **Rate without PAN (%)**: Higher rate when PAN is not available (typically 20%)
- **Threshold Amount**: TDS applies only above this amount per transaction
- **Cumulative Threshold**: Annual threshold (if applicable)
- **Effective Date**: When this rate became effective
- **Active**: Enable/disable this section

**Pre-configured Sections:**

- **194C**: Payment to contractors (1% with PAN, 20% without)
- **194J**: Professional/technical services (10% with PAN, 20% without)
- **194H**: Commission or brokerage (5% with PAN, 20% without)
- **194I**: Rent - Plant & Machinery (2% with PAN, 20% without)
- **194I-Land**: Rent - Land or Building (10% with PAN, 20% without)
- **194A**: Interest payments (10% with PAN, 20% without)

#### TDS Category Master (`TDSCategory`)

Maps business scenarios to TDS sections for easy selection.

**Fields:**

- **Category Name** (e.g., "Contractor Payment", "Professional Services")
- **TDS Section**: Link to TDS Section
- **Notes**: Additional information

**Pre-configured Categories:**

- Contractor Payment → 194C
- Professional Services → 194J
- Commission → 194H
- Rent - Machinery → 194I
- Rent - Property → 194I-Land
- Interest Payment → 194A

### 2. Supplier/Party Setup

**New Fields Added to Party Master:**

- **TDS Applicable** (Checkbox): Enable TDS for this party
- **TDS Category** (Link): Select applicable TDS category
- **PAN Available** (Checkbox): Whether party has provided PAN (affects rate)

**Location**: Party form → Billing section

**Field Behavior:**

- TDS Category and PAN Available fields are hidden unless "TDS Applicable" is checked
- Works for parties with role "Supplier" or "Both"

### 3. Purchase Invoice - Automatic TDS Calculation

When a Purchase Invoice is submitted:

1. **Check if TDS applies:**

   - Is the party marked as "TDS Applicable"?
   - Is a TDS Category assigned?
   - Is the TDS Section active?
   - Does the amount exceed the threshold?

2. **Calculate TDS:**

   ```
   TDS Amount = Gross Amount × TDS Rate
   Net Payable = Gross Amount - TDS Amount
   ```

3. **Create Ledger Entries (Safe, Non-Destructive):**
   ```
   Debit:  Expense Account          ₹100,000 (Full amount)
   Credit: TDS Payable (Liability)  ₹2,000   (TDS deducted)
   Credit: Vendor Payable           ₹98,000  (Net amount)
   ```

**Key Points:**

- Expense is recorded at **full amount** (before TDS)
- Vendor receives **net amount** (after TDS)
- TDS is tracked as a **liability** to be paid to the government
- All existing invoices remain unchanged

### 4. Reports for Compliance

#### TDS Payable Report

**Purpose**: Detailed transaction-wise TDS report

**Filters:**

- From Date / To Date
- Party
- TDS Section

**Columns:**

- Date
- Invoice Number
- Party Name
- TDS Section
- Gross Amount
- TDS Rate (%)
- TDS Amount
- Net Payable

**Use Case**: Monthly TDS reconciliation, audit trail

#### TDS Summary (Vendor-wise)

**Purpose**: Aggregated vendor-wise TDS summary

**Filters:**

- From Date / To Date
- TDS Section

**Columns:**

- Party Name
- TDS Section
- Invoice Count
- Total Gross Amount
- Total TDS Amount
- Total Net Payable

**Use Case**: Quarterly TDS return filing (Form 26Q/27Q preparation)

### 5. Chart of Accounts Integration

**New Account Added:**

- **TDS Payable** (under "Duties and Taxes" → Current Liabilities)
- Account Type: Tax
- Used to track TDS liability

**Configuration:**
Settings → Accounting Settings → TDS Payable Account (Link to "TDS Payable" account)

## How to Use

### Initial Setup (One-time)

1. **Verify TDS Payable Account**

   - Go to Chart of Accounts
   - Ensure "TDS Payable" account exists under "Duties and Taxes"
   - If not, create it manually

2. **Configure Accounting Settings**

   - Go to Settings → Accounting Settings
   - Set "TDS Payable Account" to "TDS Payable"

3. **Review Pre-configured TDS Sections**

   - Navigate to Masters → TDS Section
   - Review the 6 pre-configured sections
   - Add more sections if needed (e.g., 194Q, 194O)

4. **Review TDS Categories**
   - Navigate to Masters → TDS Category
   - Review categories or create custom ones

### Supplier Configuration

For each supplier subject to TDS:

1. Open the Party (Supplier) form
2. In the **Billing** section:
   - Check **TDS Applicable**: Yes
   - Select **TDS Category**: e.g., "Professional Services"
   - Check **PAN Available**: Yes (if PAN is on record) or No (will use 20% rate)
3. Save

### Creating Purchase Invoices

1. Create Purchase Invoice as usual
2. Select a party with TDS enabled
3. Enter items and amounts
4. Submit the invoice

**What Happens:**

- System automatically calculates TDS based on the party's TDS category
- If threshold is met, TDS is deducted
- Ledger entries are created automatically:
  - Full expense amount debited
  - TDS amount credited to "TDS Payable"
  - Net amount credited to vendor

### Viewing TDS Reports

#### TDS Payable (Detail Report)

1. Go to Reports → TDS Payable
2. Set date range (e.g., current month)
3. Optionally filter by Party or TDS Section
4. Click "Show Report"
5. Export to CSV/Excel for filing

#### TDS Summary (Vendor-wise)

1. Go to Reports → TDS Summary (Vendor-wise)
2. Set date range (e.g., current quarter)
3. Optionally filter by TDS Section
4. Click "Show Report"
5. Use for preparing Form 26Q

### Paying TDS to Government

TDS collected needs to be paid to the government periodically:

1. Create a **Payment** entry
2. Select Account: "TDS Payable"
3. Enter amount from TDS Payable report
4. Select payment method (e.g., online banking)
5. Submit

This will:

- Clear the TDS Payable liability
- Record the payment to the government

## Technical Architecture

### Safe Implementation Principles

✅ **Non-Destructive:**

- No changes to historical data
- No modifications to core PurchaseInvoice in base models
- Regional override pattern used

✅ **Additive Only:**

- New schemas added (TDSSection, TDSCategory)
- New fields added to existing schemas (Party)
- New reports added

✅ **Backward Compatible:**

- Existing invoices without TDS continue to work
- TDS is opt-in per supplier
- No breaking changes

### File Structure

```
schemas/regional/in/
  ├── TDSSection.json          # TDS Section schema
  ├── TDSCategory.json         # TDS Category schema
  ├── Party.json               # Extended with TDS fields
  └── AccountingSettings.json  # Extended with tdsPayableAccount

models/regionalModels/in/
  ├── TDSSection.ts            # TDS Section model
  ├── TDSCategory.ts           # TDS Category model
  ├── Party.ts                 # Extended with TDS logic
  └── PurchaseInvoice.ts       # Overrides getPosting() for TDS

reports/TDS/
  ├── TDSPayable.ts            # Detailed TDS report
  └── TDSSummary.ts            # Vendor-wise summary

src/regional/in/in.ts          # Setup: creates default sections & categories

fixtures/verified/in.json      # COA: includes "TDS Payable" account
```

### Ledger Logic

**Without TDS (Original):**

```
Debit:  Expense    ₹100,000
Credit: Payable    ₹100,000
```

**With TDS (New - Safe):**

```
Debit:  Expense          ₹100,000  (Full amount - unchanged)
Credit: TDS Payable      ₹2,000    (New liability account)
Credit: Vendor Payable   ₹98,000   (Reduced by TDS)
```

**Key Point:** Expense account receives the full amount. The split happens on the credit side (liability), so it doesn't affect expense reporting.

## Limitations & Future Enhancements

### Current Limitations

1. **Single TDS Section per Invoice**: Currently, all items in an invoice use the same TDS section. Mixed-section invoices require manual handling.

2. **No Automatic Threshold Tracking**: The cumulative threshold check is manual. Annual tracking needs to be done externally.

3. **No Form Generation**: TDS reports provide data, but forms 26Q/27Q need to be prepared externally using the report data.

4. **No TDS Certificates**: TDS certificates (Form 16A) are not auto-generated.

### Future Enhancements

- **Form 26Q/27Q Auto-generation**: Direct export in government portal format
- **Cumulative Threshold Tracking**: Automatic yearly tracking per vendor
- **TDS Certificate Generation**: Auto-generate Form 16A
- **TDS Rate Updates**: Alert when TDS rates change (requires government API)
- **Advanced Validation**: GSTIN-based validation for certain thresholds
- **TCS Support**: Tax Collected at Source for sales transactions

## Testing & Validation

### Test Scenarios

1. **Basic TDS Deduction**

   - Create supplier with TDS (194C, 1%)
   - Create purchase invoice for ₹50,000
   - Verify TDS = ₹500, Net Payable = ₹49,500

2. **No PAN Scenario**

   - Create supplier with PAN Available = No
   - Create invoice for ₹50,000
   - Verify TDS = ₹10,000 (20%), Net Payable = ₹40,000

3. **Threshold Not Met**

   - Create supplier with 194C (threshold ₹30,000)
   - Create invoice for ₹25,000
   - Verify NO TDS deducted

4. **Multiple Invoices**

   - Create 3 invoices for same supplier
   - Run TDS Summary report
   - Verify correct aggregation

5. **Report Export**
   - Generate TDS Payable report
   - Export to CSV
   - Verify format and data

## Compliance Checklist

- [x] TDS calculation as per Income Tax Act rates
- [x] Higher rate (20%) for non-PAN holders
- [x] Threshold validation
- [x] Separate TDS Payable liability account
- [x] Full expense amount recorded (not reduced)
- [x] Vendor gets net payable
- [x] Section-wise and vendor-wise reports
- [x] Date range filtering for monthly/quarterly returns
- [x] Export functionality for filing

## Support & Documentation

For questions or issues:

1. Check this documentation
2. Review pre-configured TDS sections and rates
3. Consult with a tax professional for compliance queries
4. Refer to Income Tax Act sections for legal requirements

## Changelog

### Version 1.0 (Current)

- ✅ TDS Section Master with 6 common sections
- ✅ TDS Category Master with 6 categories
- ✅ Party-level TDS configuration
- ✅ Automatic TDS calculation on Purchase Invoices
- ✅ Safe ledger posting (non-destructive)
- ✅ TDS Payable detailed report
- ✅ TDS Summary vendor-wise report
- ✅ Chart of Accounts integration
- ✅ Pre-filled defaults on setup

---

**Implementation Date**: January 2025  
**Status**: Production Ready  
**Risk Level**: ✅ Low (Additive only, no core changes)
