# Comprehensive Tax and Accounting Calculation Guide - Project Versoll

## Table of Contents

1. [Introduction](#introduction)
2. [Goods and Services Tax (GST)](#goods-and-services-tax-gst)
   - [Concepts and Components](#gst-concepts)
   - [Calculation Methodology](#gst-calculation-methodology)
   - [Regional Tax Application (Intra vs Inter-state)](#gst-regional)
   - [Reverse Charge Mechanism (RCM)](#gst-rcm)
3. [Tax Deducted at Source (TDS)](#tax-deducted-at-source-tds)
   - [Overview and Base Amount](#tds-overview)
   - [Threshold Management](#tds-thresholds)
   - [Rate Determination Logic](#tds-rates)
   - [TDS vs TCS (Mutual Exclusivity)](#tds-vs-tcs)
4. [General Accounting Calculations](#general-calculations)
   - [Totals and Discounting](#totals-discounting)
   - [Rounding and Double-Entry Balancing](#rounding-balancing)
   - [Multi-Currency Handling](#multi-currency)
5. [Scenario Examples](#scenario-examples)

---

<a name="introduction"></a>

## 1. Introduction

This document provides a deep dive into the mathematical and logical implementation of tax and accounting calculations within Project Versoll. It serves as a technical reference for ensuring compliance with Indian statutory requirements.

---

<a name="goods-and-services-tax-gst"></a>

## 2. Goods and Services Tax (GST)

<a name="gst-concepts"></a>

### GST Concepts and Components

GST in India is a destination-based tax. The system handles three main components:

- **CGST (Central GST)**: Applied on intra-state supply.
- **SGST/UTGST (State/Union Territory GST)**: Applied on intra-state supply.
- **IGST (Integrated GST)**: Applied on inter-state supply and imports.

<a name="gst-calculation-methodology"></a>

### Calculation Methodology

GST is calculated at the **Line Item level** to allow for mixed-rate invoices.

#### Base Calculation:

1. **Gross Line Amount**: `Rate × Quantity`
2. **Line Discount**: If applicable, calculated before tax.
3. **Taxable Value**:
   - If Discount Before Tax: `Gross Line Amount - Line Discount`
   - If Discount After Tax: `Gross Line Amount`
4. **Line GST**: `Taxable Value × (GST Rate / 100)`

#### Summary:

The system aggregates these line-level calculations into a **Tax Summary** grouped by Tax Account and Rate.

<a name="gst-regional"></a>

### Regional Tax Application (Intra vs Inter-state)

The system automatically determines whether to apply CGST+SGST or IGST based on:

- **Place of Supply (POS)**: Determined by the Party's state and the Company's registered state.
- **Intra-state**: Party State == Company State → Apply CGST (50% of rate) and SGST (50% of rate).
- **Inter-state**: Party State != Company State → Apply IGST (100% of rate).

<a name="gst-rcm"></a>

### Reverse Charge Mechanism (RCM)

In certain scenarios (e.g., purchase from unregistered dealers for specific goods/services), the liability to pay tax shifts from the supplier to the recipient.

- **Calculation**: Same as standard GST.
- **Accounting**: Instead of adding to the vendor payable, it creates a self-liability and a corresponding input tax credit (ITC) entry.

---

<a name="tax-deducted-at-source-tds"></a>

## 3. Tax Deducted at Source (TDS)

<a name="tds-overview"></a>

### Overview and Base Amount

TDS is a mechanism where the deductor (purchaser) withholds a portion of the payment as tax.

**Base Amount Rule (CBDT Circular 23/2017):**
TDS is calculated on the **Net Payable Amount excluding GST**.
`TDS Base = Line Total - Line Discounts`

<a name="tds-thresholds"></a>

### Threshold Management

The system supports complex threshold logic to ensure compliance without over-deduction.

1. **Single Bill Threshold**: TDS applies if a single invoice exceeds a specific amount (e.g., ₹30,000 for Sec 194J).
2. **Cumulative Threshold**: TDS applies if the total value of all invoices for a party in a Financial Year (April-March) exceeds a limit (e.g., ₹1,00,000 for Sec 194C).
3. **Dual Threshold (Sec 194C)**: Applies if _either_ single bill _or_ cumulative threshold is crossed.

<a name="tds-rates"></a>

### Rate Determination Logic

The system dynamically selects the rate based on multiple factors:

- **PAN Status (Sec 206AA)**:
  - Valid PAN provided: Apply Section Rate (e.g., 10%, 2%, 1%).
  - No PAN: Apply higher rate (typically 20%).
- **Non-Filer Status (Sec 206AB)**:
  - Applies to "specified persons" who haven't filed ITR for the previous year.
  - Rate: Higher of twice the standard rate or 5% (capped at 20%).
- **Entity Type**: Rates may vary based on whether the party is an Individual/HUF or a Company/Firm (e.g., Sec 194C).

<a name="tds-vs-tcs"></a>

### TDS vs TCS (Mutual Exclusivity)

For the sale/purchase of goods (Sec 194Q and Sec 206C1H), both cannot apply simultaneously.

- **Rule**: If the Buyer is liable to deduct TDS under Sec 194Q, the Seller shall not collect TCS under Sec 206C(1H).
- **Logic**: 194Q takes precedence over 206C(1H).

---

<a name="general-calculations"></a>

## 4. General Accounting Calculations

<a name="totals-discounting"></a>

### Totals and Discounting

- **Net Total**: `Σ (Item Taxable Values)`
- **Total Tax**: `Σ (Line GST Amounts)`
- **Grand Total**: `Net Total + Total Tax - (Total Discount if applied after tax)`
- **Outstanding Amount**: `Grand Total - TDS Amount - Payments Received/Made`

<a name="rounding-balancing"></a>

### Rounding and Double-Entry Balancing

To maintain the integrity of the Trial Balance, the system enforces `Total Debits = Total Credits`.

1. Calculate absolute total of all debits.
2. Calculate absolute total of all credits.
3. If `|Debits - Credits| > 0`:
   - If Difference is small (typically < ₹1.00): Post to **Round Off Account**.
   - If Difference is significant: Block submission (Validation Error).

<a name="multi-currency"></a>

### Multi-Currency Handling

1. All calculations (GST, TDS, Totals) are first performed in the **Transaction Currency**.
2. For General Ledger posting, each value is converted using the **Exchange Rate**:
   `Base Amount = Transaction Amount × Exchange Rate`
3. Exchange Gain/Loss is calculated upon payment/reconciliation if the rate has changed.

---

<a name="scenario-examples"></a>

## 5. Scenario Examples

### Example 1: Intra-state Sale with Discount

- **Item**: Laptop (₹50,000, 18% GST)
- **Discount**: 10% (Before Tax)
- **Taxable Value**: `50,000 - 5,000 = 45,000`
- **CGST (9%)**: `4,000.50`
- **SGST (9%)**: `4,000.50`
- **Grand Total**: `53,101.00`

### Example 2: Professional Service Purchase with TDS (Sec 194J)

- **Service**: Audit Fees (₹1,00,000, 18% GST)
- **GST (IGST 18%)**: `18,000`
- **TDS Base**: `1,00,000` (GST excluded)
- **TDS (10%)**: `10,000`
- **Net Payable to Vendor**: `(1,00,000 + 18,000) - 10,000 = 1,08,000`
- **Accounting Posting**:
  - Debit: Audit Expense `1,00,000`
  - Debit: GST Input (IGST) `18,000`
  - Credit: TDS Payable `10,000`
  - Credit: Vendor Account `1,08,000`
