# Demo Data Improvements Summary

## Overview

Enhanced demo data generation to include comprehensive TDS (Tax Deducted at Source) and E-Way Bill functionality, providing a more realistic and feature-complete demonstration environment.

## Changes Made

### 1. Fixed GSTIN Validation Issues

**Problem**: Invalid GSTIN format in demo data causing E-Way Bill creation failures.

**Solution**:

- Updated company GSTIN: `27LIN180000A1Z5` → `27AAAPL1234C1Z5`
- Fixed 4 invalid party GSTINs that were 16 characters instead of 15
- All GSTINs now match the correct Indian GSTIN format: `##AAAAA####A#Z#`
  - 2 state code digits
  - 10-character PAN (5 letters + 4 digits + 1 letter)
  - 1 entity number
  - 'Z' (fixed)
  - 1 check digit

### 2. TDS (Tax Deducted at Source) Data

#### TDS Sections Created

Three common TDS sections are now automatically created:

| Section | Description                     | Rate | Rate (No PAN) | Threshold | Cumulative Threshold |
| ------- | ------------------------------- | ---- | ------------- | --------- | -------------------- |
| 194C    | Payment to contractors          | 1%   | 20%           | ₹30,000   | ₹1,00,000            |
| 194J    | Professional/Technical services | 10%  | 20%           | ₹30,000   | ₹1,00,000            |
| 194I    | Rent payments                   | 10%  | 20%           | ₹2,40,000 | ₹2,40,000            |

#### TDS Categories Created

- **Contractor Payment** → Linked to Section 194C
- **Professional Services** → Linked to Section 194J
- **Rent** → Linked to Section 194I

#### TDS Payable Account

Automatically creates "TDS Payable" account under Duties and Taxes (Liability)

#### Parties with TDS Configuration

Two supplier parties are pre-configured with TDS:

1. **Janky Office Spaces**

   - TDS Applicable: Yes
   - Category: Rent (194I @ 10%)
   - PAN Available: Yes

2. **Maxwell**
   - TDS Applicable: Yes
   - Category: Professional Services (194J @ 10%)
   - PAN Available: **No** (demonstrates higher 20% rate)

### 3. E-Way Bill Data

#### Automatic E-Way Bill Generation

- Generates E-Way Bills for ~20% of sales invoices with value ≥ ₹50,000
- Realistic transport details included

#### E-Way Bill Details

- **Vehicle Numbers**: Rotated from pool (MH12AB1234, DL01CD5678, KA03EF9012, GJ05GH3456)
- **Transporters**: Blue Dart Express, DTDC Courier, Delhivery, VRL Logistics
- **Distance**: Random between 100-600 km
- **Validity**: Calculated correctly (1 day per 200 km)
- **GSTIN Mapping**: Automatically populated from company and party
- **E-Way Bill Number**: Auto-generated 12-digit number
- **Supply Type**: Outward
- **Transaction Type**: Supply
- **Transport Mode**: Road

## Why E-Way Bill Section Exists Separately

### Common Question

_"If E-Way Bills are generated from Sales Invoice, why is there a separate E-Way Bill section?"_

### Answer: Flexibility & Real-World Use Cases

The separate E-Way Bill section provides critical functionality beyond invoice-linked creation:

#### 1. **Standalone E-Way Bill Creation**

- Manual entries for transactions not in the system
- Third-party invoices requiring E-Way Bills
- Goods transfer without sales (branch transfers, returns)

#### 2. **Centralized Management**

- View ALL E-Way Bills in one place
- Filter by status (Active, Expired, Cancelled)
- Track validity and expiry dates
- Bulk operations and reports

#### 3. **Multiple E-Way Bills Per Invoice**

- Partial shipments requiring separate E-Way Bills
- Different transport modes for same invoice
- Staggered deliveries

#### 4. **E-Way Bill Without Invoices**

- Goods transfer between own branches
- Job work scenarios
- Stock transfers
- Return of goods

#### 5. **Edit & Cancel Operations**

- Update transport details
- Extend validity
- Cancel expired/incorrect bills
- Add remarks and audit trail

This design follows industry standards (Tally, Zoho, SAP) where you can:

- **Quick Path**: Create from Invoice (most common case)
- **Flexible Path**: Create independently (special cases)
- **Manage All**: Single place to view/manage everything

## Demo Data Statistics

With default settings (1 year, baseCount=1000):

- **Sales Invoices**: ~1000-1500 (varies by month)
- **Purchase Invoices**: ~400-500
- **E-Way Bills**: ~20-30 (20% of invoices ≥ ₹50K)
- **TDS Sections**: 3
- **TDS Categories**: 3
- **Parties with TDS**: 2 suppliers
- **Valid GSTINs**: 32 parties + 1 company

## Testing TDS Functionality

1. **Create Purchase Invoice** for "Janky Office Spaces"

   - TDS will be calculated at 10% (has PAN)
   - Outstanding amount reduced by TDS
   - TDS Payable account credited

2. **Create Purchase Invoice** for "Maxwell"

   - TDS will be calculated at 20% (no PAN)
   - Demonstrates higher rate scenario

3. **View TDS Reports**
   - Navigate to Reports → TDS Reports
   - See TDS calculations and payable amounts

## Testing E-Way Bill Functionality

### From Sales Invoice (Recommended)

1. Open any submitted Sales Invoice ≥ ₹50,000
2. Click "Create" → "E-Way Bill"
3. Invoice details auto-populate
4. Add transport details
5. Submit

### Standalone Creation

1. Navigate to GST → E-Way Bills
2. Click "New"
3. Select Sales Invoice
4. Fill transport details
5. Submit

### View & Manage

- List View: GST → E-Way Bills
- Filter by Status, Date, Invoice
- Track validity and expiry
- View E-Way Bill Register report

## Files Modified

- `dummy/index.ts` - Enhanced data generation
- `dummy/parties.json` - Fixed invalid GSTINs

## Technical Implementation

### TDS Data Generation

```typescript
async function generateTDSData(fyo: Fyo) {
  // Creates TDS Sections (194C, 194J, 194I)
  // Creates TDS Categories
  // Creates TDS Payable account
}
```

### E-Way Bill Generation

```typescript
async function generateEWayBills(fyo: Fyo, salesInvoices: SalesInvoice[]) {
  // Filters invoices ≥ ₹50,000
  // 20% probability for each eligible invoice
  // Auto-populates from invoice + company/party GSTIN
  // Calculates validity based on distance
}
```

## Benefits

✅ **Realistic Demo**: Shows TDS and E-Way Bill features in action  
✅ **Complete Testing**: All scenarios covered (with/without PAN, various sections)  
✅ **Valid Data**: All GSTINs pass validation  
✅ **Industry Standard**: Follows Tally/Zoho patterns  
✅ **Educational**: Demonstrates proper usage  
✅ **Production Ready**: Data generation can be reused for customer onboarding

## Future Enhancements

Potential improvements for demo data:

- [ ] Add more TDS sections (194A, 194H, etc.)
- [ ] Include cancelled E-Way Bills
- [ ] Add expired E-Way Bills
- [ ] Multi-state transactions
- [ ] Export/Import scenarios
- [ ] Interstate vs Intrastate mix
- [ ] Different transport modes (Rail, Air, Ship)
