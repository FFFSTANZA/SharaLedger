# Linked Entries Enhancement - Reason Anchoring & Cross-Document Impact

## Overview

This enhancement transforms the Linked Entries view from a simple document list into a powerful business context and impact analysis tool.

### What Changed

**Before:**

- Just showed "SalesInvoice - 5" with basic details
- No context on WHY documents are linked
- No visibility into cross-document impact

**After:**

- Shows business reasons: "Payment received from Customer ABC"
- Shows impact: "Reduced outstanding by $500"
- Provides cross-document impact summary at the top
- Visual indicators (icons, colors) for different relationship types

## Key Features

### 1. Reason Anchoring

Each linked entry now displays:

- **Business Reason**: The WHY behind the link

  - Example: "Payment received from ABC Corp" instead of just "PAY-001"
  - Example: "Stock shipped to XYZ Ltd" instead of just "SHIP-042"
  - Example: "Credit note issued to John Doe" for returns

- **Impact Statement**: What effect this had
  - "Reduced outstanding by $500"
  - "5 items transferred"
  - "Fully paid: $1,200"

### 2. Cross-Document Impact View

A summary section at the top shows aggregate impact:

- Total payments received/made
- Whether returns exist
- Number of items transferred
- Outstanding amounts

### 3. Visual Hierarchy

Different relationship types have distinct visual styles:

- **Payments**: Green with arrow icons (↓ for receive, ↑ for pay)
- **Stock Transfers**: Blue with truck/package icons
- **Returns**: Orange with return arrow icons
- **Journal Entries**: Purple with book icons
- **Ledger Entries**: Gray with layer icons

## Implementation Details

### New Files

1. **`src/utils/linkedEntriesReason.ts`**
   - Core logic for determining business reasons
   - Functions:
     - `getLinkedEntryReason()`: Returns reason, impact, icon, color for any linked doc
     - `getLinkedEntriesImpactSummary()`: Aggregates overall impact
     - `groupLinkedEntriesByRelationship()`: Groups by relationship type

### Modified Files

2. **`src/pages/CommonForm/LinkedEntries.vue`**
   - Enhanced UI to display reasons and impacts
   - Added impact summary section
   - Integrated with reason system
   - Added more fields to fetch (returnAgainst, paymentType)

## Supported Relationships

### Payment Relationships

- **Reason**: "Payment received from/paid to [Party]"
- **Impact**: "Reduced outstanding by [Amount]"
- **Visual**: Green with arrow icons

### Stock Transfer Relationships

- **Shipments**: "Stock shipped to [Customer]"
- **Purchase Receipts**: "Stock received from [Supplier]"
- **Returns**: "Stock returned from/to [Party]"
- **Impact**: "[X] items transferred" or "Value: [Amount]"
- **Visual**: Blue with truck/package icons

### Invoice Relationships

- **Sales Invoice**: "Invoice raised for [Customer]"
- **Purchase Invoice**: "Bill received from [Supplier]"
- **Returns**: "Credit/Debit note issued to/from [Party]"
- **Impact**: Payment status and amounts
- **Visual**: Blue/green/orange based on payment status

### Journal Entry Relationships

- **Reason**: Based on entry type (Bank Entry, Cash Entry, etc.)
- **Impact**: "Accounts adjusted", "Bank balance updated"
- **Visual**: Purple with book icon

### Ledger Entry Relationships

- **Accounting Ledger**: "Accounting entry in [Account]"
- **Stock Ledger**: "Stock movement for [Item]"
- **Impact**: Amount credited/debited or quantity moved
- **Visual**: Gray with layer/box icons

## Business Logic Examples

### Example 1: Invoice with Payment

**Linked Entry**: Payment PAY-001

**Before Enhancement:**

```
Payment - 1
PAY-001    2024-01-15
ABC Corp   $500
```

**After Enhancement:**

```
[↓] Payment received from ABC Corp
    Reduced outstanding by $500

    PAY-001    2024-01-15
    ABC Corp   $500
```

### Example 2: Invoice with Stock Transfer

**Linked Entry**: Shipment SHIP-042

**Before Enhancement:**

```
Shipment - 1
SHIP-042   2024-01-14
ABC Corp   $1,200
```

**After Enhancement:**

```
[🚚] Stock shipped to ABC Corp
     15 items transferred

     SHIP-042   2024-01-14
     ABC Corp   $1,200
```

### Example 3: Return Invoice

**Linked Entry**: Sales Invoice SINV-RET-001

**Before Enhancement:**

```
SalesInvoice - 1
SINV-RET-001   2024-01-16
ABC Corp       $300
```

**After Enhancement:**

```
[↩] Credit note issued to ABC Corp
    Returned $300

    SINV-RET-001   2024-01-16
    ABC Corp       $300
```

## Impact Summary Examples

At the top of the Linked Entries panel:

```
Document Impact
[✓] Paid $800
[↩] Has Returns
[🚚] 25 items transferred
```

## Extension Points

The system is designed to be easily extended:

1. **Adding New Relationship Types**:

   - Add a new case in `getLinkedEntryReason()`
   - Define the business logic for that document type
   - Choose appropriate icon and color

2. **Customizing Reasons**:

   - Edit the specific reason functions (e.g., `getPaymentReason()`)
   - Modify the text templates
   - Add more metadata

3. **Adding More Impact Metrics**:
   - Extend `getLinkedEntriesImpactSummary()`
   - Add new aggregation logic
   - Update the UI to display new metrics

## Benefits

1. **Better Understanding**: Users immediately understand WHY documents are linked
2. **Quick Insights**: Impact summary shows overall effect at a glance
3. **Improved UX**: Visual hierarchy makes scanning easier
4. **Business Context**: Transforms technical links into business relationships
5. **Audit Trail**: Clear visibility of document flow and impact

## Technical Notes

- Async loading of reasons happens in parallel for performance
- Reasons are calculated on-demand when panel opens
- No database changes required - all logic is in the UI layer
- Compatible with existing linked entry infrastructure
- Works with all document types (invoices, payments, stock transfers, etc.)

## Future Enhancements

Potential improvements:

1. Timeline view showing chronological order of linked documents
2. Relationship graph visualization
3. Custom reason templates per business
4. Export linked entries with reasons to PDF
5. Notifications when linked documents change status
6. Drill-down into impact details (e.g., show which items were transferred)
