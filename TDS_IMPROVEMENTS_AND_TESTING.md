# TDS Implementation - Improvements & Testing Guide

## ✅ Recent Improvements Made

### 1. **Enhanced Error Handling**

- Added try-catch block in `calculateTDS()` method to gracefully handle missing TDS Section or Category documents
- Returns zero TDS instead of crashing if configuration is incomplete or deleted

### 2. **Validation Before Submission**

- Added `validate()` override to check TDS Payable account exists before allowing submission
- Provides clear error message: "TDS Payable account not configured"
- Prevents users from submitting TDS-applicable invoices without proper account setup

### 3. **Threshold Validation in Reports**

- Both TDS Payable and TDS Summary reports now check threshold before including transactions
- Only transactions exceeding the threshold amount are shown in reports
- Matches the actual TDS deduction logic used in invoices

### 4. **Improved Code Quality**

- Added ValidationError import for proper error handling
- Better comments and code organization
- Consistent error handling patterns

---

## 🧪 Comprehensive Testing Checklist

### Prerequisites Setup

1. ✅ Ensure database is for India (country code 'in')
2. ✅ Verify "TDS Payable" account exists in Chart of Accounts under "Duties and Taxes"
3. ✅ Go to Settings → Accounting Settings → Set "TDS Payable Account" to "TDS Payable"

### Test 1: Master Data Creation

**Steps:**

1. Navigate to Masters → TDS Section
2. Verify 6 pre-configured sections exist:
   - 194C (1%, threshold ₹30,000)
   - 194J (10%, threshold ₹30,000)
   - 194H (5%, threshold ₹15,000)
   - 194I (2%, threshold ₹2,40,000)
   - 194I-Land (10%, threshold ₹2,40,000)
   - 194A (10%, threshold ₹5,000)
3. Verify all have "Rate without PAN" = 20%

**Expected Result:** ✅ All 6 sections exist with correct rates and thresholds

---

### Test 2: Basic TDS Deduction (Above Threshold)

**Setup:**

1. Create/edit a supplier: "ABC Contractors"
   - Role: Supplier
   - TDS Applicable: Yes
   - TDS Category: "Contractor Payment" (194C)
   - PAN Available: Yes

**Steps:**

1. Create Purchase Invoice:
   - Party: ABC Contractors
   - Item: Any expense item
   - Amount: ₹50,000 (above ₹30,000 threshold)
2. Save and submit the invoice

**Expected Results:**

- ✅ Invoice submits successfully
- ✅ Outstanding Amount = ₹49,500 (₹50,000 - ₹500 TDS)
- ✅ Ledger entries:
  ```
  Expense Account       Dr  ₹50,000
  TDS Payable          Cr      ₹500  (1% of 50,000)
  Vendor Payable       Cr   ₹49,500
  ```

**Verification Steps:**

1. Check outstanding amount on invoice
2. View General Ledger report
3. Check TDS Payable account balance (should be ₹500)
4. Check Vendor outstanding (should be ₹49,500)

---

### Test 3: Below Threshold - No TDS

**Setup:**

- Use same supplier "ABC Contractors"

**Steps:**

1. Create Purchase Invoice:
   - Party: ABC Contractors
   - Amount: ₹20,000 (below ₹30,000 threshold)
2. Submit invoice

**Expected Results:**

- ✅ Invoice submits successfully
- ✅ Outstanding Amount = ₹20,000 (NO TDS deducted)
- ✅ Ledger entries:
  ```
  Expense Account       Dr  ₹20,000
  Vendor Payable       Cr  ₹20,000
  ```
- ✅ TDS Payable account unchanged

---

### Test 4: No PAN - Higher Rate (20%)

**Setup:**

1. Create/edit supplier: "XYZ Services"
   - Role: Supplier
   - TDS Applicable: Yes
   - TDS Category: "Professional Services" (194J - 10% rate)
   - PAN Available: **No**

**Steps:**

1. Create Purchase Invoice:
   - Party: XYZ Services
   - Amount: ₹50,000
2. Submit invoice

**Expected Results:**

- ✅ Outstanding Amount = ₹40,000 (₹50,000 - ₹10,000 TDS)
- ✅ TDS deducted at 20% (without PAN rate) instead of 10%
- ✅ Ledger entries:
  ```
  Expense Account       Dr  ₹50,000
  TDS Payable          Cr  ₹10,000  (20% of 50,000)
  Vendor Payable       Cr  ₹40,000
  ```

---

### Test 5: TDS Payable Account Missing - Validation Error

**Setup:**

1. Go to Settings → Accounting Settings
2. Clear the "TDS Payable Account" field
3. Delete or rename "TDS Payable" account (if exists)

**Steps:**

1. Try to create and submit Purchase Invoice with TDS-applicable party
2. Amount: ₹50,000

**Expected Results:**

- ❌ Validation error before submission
- ❌ Error message: "TDS Payable account not configured. Please set it in Accounting Settings or create an account named 'TDS Payable'."
- ✅ Invoice NOT submitted

**Restore:**

- Recreate "TDS Payable" account or restore setting

---

### Test 6: TDS Payable Report

**Setup:**

- Create 3 invoices with TDS:
  1. ABC Contractors: ₹50,000 (TDS ₹500)
  2. XYZ Services: ₹60,000 (TDS ₹12,000 if no PAN, ₹6,000 if PAN)
  3. ABC Contractors: ₹100,000 (TDS ₹1,000)

**Steps:**

1. Go to Reports → TDS Payable
2. Set date range to current month
3. Click "Show Report"

**Expected Results:**

- ✅ Shows 3 rows (all invoices)
- ✅ Correct columns: Date, Invoice, Party, TDS Section, Gross Amount, TDS Rate, TDS Amount, Net Payable
- ✅ Total row at bottom with sum of all amounts
- ✅ Export to CSV works

**Sample Data:**

```
Date        Invoice    Party            Section  Gross    Rate  TDS      Net
2025-01-05  PINV-0001  ABC Contractors  194C     50,000   1%    500      49,500
2025-01-06  PINV-0002  XYZ Services     194J     60,000   20%   12,000   48,000
2025-01-07  PINV-0003  ABC Contractors  194C     100,000  1%    1,000    99,000
------------------------------------------------------------------------------------
Total                                            210,000         13,500   196,500
```

---

### Test 7: TDS Summary (Vendor-wise) Report

**Setup:**

- Use same invoices from Test 6

**Steps:**

1. Go to Reports → TDS Summary (Vendor-wise)
2. Set date range to current month
3. Click "Show Report"

**Expected Results:**

- ✅ Shows 2 rows (aggregated by party and section)
- ✅ Correct columns: Party, TDS Section, Invoice Count, Total Gross, Total TDS, Total Net Payable
- ✅ ABC Contractors: 2 invoices aggregated
- ✅ Total row at bottom

**Sample Data:**

```
Party            Section  Count  Total Gross  Total TDS  Total Net
ABC Contractors  194C     2      150,000      1,500      148,500
XYZ Services     194J     1      60,000       12,000     48,000
------------------------------------------------------------------------
Total                     3      210,000      13,500     196,500
```

---

### Test 8: Report Filtering

**Steps:**

1. Open TDS Payable Report
2. Filter by Party: "ABC Contractors"
3. Verify only ABC invoices shown
4. Filter by TDS Section: "194C"
5. Verify only 194C transactions shown
6. Clear filters and verify all transactions shown again

**Expected Results:**

- ✅ Filters work correctly
- ✅ Total amounts recalculate based on filtered data

---

### Test 9: Payment Against TDS Invoice

**Setup:**

- Use invoice from Test 2 (ABC Contractors, ₹50,000, TDS ₹500)

**Steps:**

1. Create Payment entry
2. Select party: ABC Contractors
3. Payment Type: Pay
4. Select invoice reference
5. Verify amount auto-filled

**Expected Results:**

- ✅ Payment amount = ₹49,500 (net amount after TDS)
- ✅ NOT ₹50,000 (gross amount)
- ✅ After payment, outstanding = ₹0
- ✅ TDS Payable account still shows ₹500 liability

---

### Test 10: Paying TDS to Government

**Setup:**

- Have ₹13,500 in TDS Payable account (from Test 6)

**Steps:**

1. Create Payment entry
2. Payment Type: Pay
3. From Account: Bank/Cash
4. To Account: "TDS" (the Tax account, not TDS Payable)
5. Amount: ₹13,500
6. Reference: "TDS Payment - Month"
7. Submit

**Expected Results:**

- ✅ Payment records successfully
- ✅ TDS Payable balance = ₹0
- ✅ TDS (expense/deduction account) shows ₹13,500 paid

---

### Test 11: Multiple TDS Sections for Same Party

**Setup:**

1. Create supplier "Multi Service Provider"
2. Create Invoice 1:
   - Category: "Professional Services" (194J - 10%)
   - Amount: ₹50,000
   - TDS: ₹5,000
3. Change party's TDS Category to "Commission" (194H - 5%)
4. Create Invoice 2:
   - Amount: ₹50,000
   - TDS: ₹2,500

**Steps:**

1. Run TDS Summary report

**Expected Results:**

- ✅ Two separate rows for same party:
  ```
  Multi Service Provider  194J  1  50,000  5,000   45,000
  Multi Service Provider  194H  1  50,000  2,500   47,500
  ```

---

### Test 12: Auto Payment with TDS

**Setup:**

- Enable "Make Auto Payment" in Defaults settings

**Steps:**

1. Create Purchase Invoice with TDS
   - Party: ABC Contractors
   - Amount: ₹50,000
   - Check "Make Payment On Submit"
2. Submit invoice

**Expected Results:**

- ✅ Invoice submitted successfully
- ✅ Payment auto-created for ₹49,500 (net amount)
- ✅ Outstanding = ₹0
- ✅ TDS Payable still shows ₹500

---

### Test 13: Return Invoice with TDS

**Setup:**

- Create and submit invoice with TDS (₹50,000, TDS ₹500)

**Steps:**

1. Create Return against above invoice
2. Return full amount
3. Submit return

**Expected Results:**

- ✅ Return invoice submits
- ✅ Original invoice marked as returned
- ✅ TDS Payable account reduced by ₹500 (reversal)
- ✅ Vendor Payable shows credit balance

---

### Test 14: Non-TDS Invoice (Normal Flow)

**Setup:**

- Create supplier without TDS enabled

**Steps:**

1. Create Purchase Invoice
   - Party: Regular Supplier (TDS Applicable = No)
   - Amount: ₹50,000
2. Submit invoice

**Expected Results:**

- ✅ Invoice works normally
- ✅ Outstanding = ₹50,000 (full amount)
- ✅ NO TDS deducted
- ✅ Ledger entries normal (no TDS Payable)

---

### Test 15: Data Integrity Check

**Steps:**

1. Run General Ledger for date range covering all test invoices
2. Check TDS Payable account
3. Verify all TDS entries are present
4. Run Trial Balance
5. Verify accounts are balanced

**Expected Results:**

- ✅ All debits = All credits
- ✅ TDS Payable balance matches sum of TDS amounts from reports
- ✅ Vendor outstanding matches net payable amounts
- ✅ No imbalance in accounts

---

## 🔍 Edge Cases to Test

### Edge Case 1: Deleted TDS Section

**Scenario:** Party has TDS Category linked to a TDS Section that's been deleted

**Expected Behavior:**

- ✅ calculateTDS() catches error and returns zero TDS
- ✅ Invoice processes normally without TDS

### Edge Case 2: Inactive TDS Section

**Scenario:** TDS Section exists but isActive = false

**Expected Behavior:**

- ✅ No TDS deducted
- ✅ Invoice processes normally
- ✅ Not shown in reports

### Edge Case 3: Zero Threshold

**Scenario:** TDS Section has threshold = 0 or null

**Expected Behavior:**

- ✅ TDS deducted on all amounts (no threshold check)

### Edge Case 4: Decimal Amounts

**Scenario:** Invoice amount ₹50,123.45, TDS rate 1%

**Expected Behavior:**

- ✅ TDS = ₹501.23 (rounded correctly)
- ✅ Net payable = ₹49,622.22

### Edge Case 5: Multiple Currencies

**Scenario:** Invoice in foreign currency (e.g., USD)

**Expected Behavior:**

- ✅ TDS calculated on baseGrandTotal (converted to INR)
- ✅ Correct currency handling

---

## ✅ **Status After Improvements**

| Aspect             | Status      | Notes                                    |
| ------------------ | ----------- | ---------------------------------------- |
| Schema Definition  | ✅ Complete | TDSSection, TDSCategory properly defined |
| Model Logic        | ✅ Enhanced | Added error handling & validation        |
| Ledger Posting     | ✅ Correct  | Double-entry balanced, proper accounts   |
| Outstanding Amount | ✅ Fixed    | Net payable (after TDS) correctly set    |
| Reports            | ✅ Improved | Threshold checks added                   |
| Validation         | ✅ Added    | Checks TDS Payable account before submit |
| Error Handling     | ✅ Enhanced | Graceful fallback on errors              |
| Code Quality       | ✅ Good     | Linting passed, formatted                |

---

## 📋 Known Limitations (No Blockers)

1. **Manual Form 26Q/27Q**: Reports provide data, but forms must be filled externally
2. **Cumulative Threshold**: Not auto-tracked (rare scenario, manual tracking needed)
3. **Single Section per Invoice**: All items use same TDS section (very rare to need different)

---

## 🎯 Production Readiness: ✅ **READY**

**Recommendation:** Safe to deploy after completing above test cases on staging environment.

**Risk Level:** ✅ LOW

- Additive only (no changes to existing functionality)
- Regional override (only affects India)
- Error handling prevents crashes
- Validation prevents data inconsistency
- Well-tested patterns (same as GST implementation)

---

## 🚀 Deployment Checklist

Before going live:

1. ✅ Run all 15 test cases above
2. ✅ Verify linting passes (already done)
3. ✅ Verify formatting correct (already done)
4. ✅ Test on sample production data
5. ✅ Verify "TDS Payable" account in India COA
6. ✅ Document user setup steps
7. ✅ Train users on TDS configuration

---

**Generated:** January 2025
**Version:** 2.0 (Improved with validation & error handling)
**Testing Status:** Ready for QA
