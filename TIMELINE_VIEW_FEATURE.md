# Timeline View Feature

## Overview

The Timeline View is a chronological visualization of all linked documents, making it easy to understand the sequence of business events.

## Features

### 1. View Modes

**Grouped View (Default)**

- Documents grouped by type (Payments, Invoices, etc.)
- Shows count for each type
- Collapsible sections
- Priority ordering (Payments first)

**Timeline View**

- All documents in chronological order
- Most recent documents at the top
- Visual timeline with colored dots
- Date markers for each entry

### 2. Switching Views

Toggle between views using the buttons in the header:

- **Grouped** button with list icon
- **Timeline** button with clock icon

### 3. Timeline Visualization

Each timeline entry shows:

- **Vertical timeline line**: Connects all events
- **Colored dot**: Indicates relationship type
  - Green: Payments
  - Blue: Stock transfers, Invoices
  - Orange: Returns, Outstanding amounts
  - Purple: Journal entries
  - Gray: Ledger entries
- **Date marker**: Shows when the event occurred
- **Document type**: Label for the document schema
- **Business reason**: Why the document is linked
- **Impact statement**: What effect it had
- **Document name**: For quick reference

### 4. Currency Formatting

✅ **Properly Implemented**: All currency values use `sourceDoc.fyo.format(amount, 'Currency')` which:

- Uses the system's configured currency (INR/₹ for Indian businesses)
- Respects user's locale and currency settings
- NO hardcoded dollar signs

Examples:

- Indian business: `₹1,200.00`
- US business: `$1,200.00`
- European business: `€1,200.00`

## Visual Example: Timeline View

```
┌─────────────────────────────────────────────────┐
│ [×] Linked Entries         [Grouped] [Timeline] │
├─────────────────────────────────────────────────┤
│ Document Impact                                 │
│ [✓] Paid ₹15,000                               │
│ [🚚] 50 items transferred                       │
├─────────────────────────────────────────────────┤
│  |                                               │
│  |  25 Jan 2024                  Payment        │
│  ●  [↓] Payment received from ABC Corp         │
│  |      Reduced outstanding by ₹8,000          │
│  |      PAY-003                         [→]     │
│  |                                               │
│  |                                               │
│  |  22 Jan 2024                  Shipment       │
│  ●  [🚚] Stock shipped to ABC Corp              │
│  |      25.00 items transferred                 │
│  |      SHIP-002                        [→]     │
│  |                                               │
│  |                                               │
│  |  20 Jan 2024                  Payment        │
│  ●  [↓] Payment received from ABC Corp         │
│  |      Reduced outstanding by ₹7,000          │
│  |      PAY-002                         [→]     │
│  |                                               │
│  |                                               │
│  |  18 Jan 2024                  Shipment       │
│  ●  [🚚] Stock shipped to ABC Corp              │
│  |      25.00 items transferred                 │
│  |      SHIP-001                        [→]     │
│  |                                               │
│  |                                               │
│  |  15 Jan 2024           Sales Invoice         │
│  ●  [📄] Invoice raised for ABC Corp            │
│  |      Outstanding: ₹5,000                    │
│  |      SINV-002                        [→]     │
│  |                                               │
│  |                                               │
│  |  10 Jan 2024           Sales Invoice         │
│  ●  [📄] Invoice raised for ABC Corp            │
│      |      Fully paid: ₹15,000                    │
│  |      SINV-001                        [→]     │
│  |                                               │
└─────────────────────────────────────────────────┘
```

## Timeline vs Grouped View

### When to Use Timeline View

✓ **Understanding document flow**: See the sequence of events
✓ **Audit trail**: Track what happened when
✓ **Pattern recognition**: Identify payment delays, fulfillment cycles
✓ **Chronological context**: Understand business progression
✓ **Investigation**: Find when specific events occurred

### When to Use Grouped View

✓ **Quick overview**: See document counts by type
✓ **Focus on specific type**: Collapse other sections
✓ **Bulk scanning**: Review all payments/invoices together
✓ **Status checking**: Check payment status across all invoices
✓ **Category analysis**: Understand relationship distribution

## Technical Implementation

### Timeline Entry Structure

```typescript
interface TimelineEntry {
  name: string;
  schemaName: string;
  date: Date;
  reason: LinkedEntryReason;
  // ... other fields from EntryDetail
}
```

### Timeline Sorting

Entries are sorted by date in **descending order** (most recent first):

```typescript
timelineEntries.sort((a, b) => {
  const dateA = new Date(a.date).getTime();
  const dateB = new Date(b.date).getTime();
  return dateB - dateA; // Most recent first
});
```

### Color Mapping

Timeline dots use the same color scheme as reason icons:

| Color  | Document Types                    |
| ------ | --------------------------------- |
| Green  | Payments (received/made)          |
| Blue   | Stock transfers, Invoices, Quotes |
| Orange | Returns, Outstanding amounts      |
| Purple | Journal entries                   |
| Gray   | Ledger entries                    |

## User Interaction

### Clickable Entries

All timeline entries are clickable and navigate to the respective document:

```typescript
@click="routeTo(entry.schemaName, entry.name)"
```

### Hover Effects

Timeline entries have hover effects for better UX:

- Shadow increase
- Smooth transition
- Visual feedback

### Visual Indicators

- **Timeline line**: Shows continuous flow
- **Dots**: Mark individual events
- **Date labels**: Easy chronological reference
- **Schema labels**: Quick document type identification
- **Chevron icons**: Indicate clickability

## Benefits

1. **Chronological Clarity**: See events in the order they occurred
2. **Business Flow Visualization**: Understand the progression of transactions
3. **Quick Temporal Context**: Identify when events happened
4. **Pattern Recognition**: Spot delays, cycles, trends
5. **Audit Trail**: Clear documentation of event sequence
6. **Better UX**: Alternative view for different use cases

## Comparison: Before vs After

### Before (Only Grouped View)

- Documents grouped by type only
- No chronological ordering within groups
- Hard to understand sequence of events
- Limited temporal context

### After (With Timeline View)

- **Two view modes**: Grouped and Timeline
- **Chronological ordering**: Clear event sequence
- **Visual timeline**: Easy to scan and understand
- **Date markers**: Quick temporal reference
- **Flexible**: Switch between views as needed

## Future Enhancements

Potential improvements:

1. Date range filtering (show last 30 days, last quarter, etc.)
2. Search within timeline
3. Export timeline to PDF
4. Group timeline by week/month
5. Highlight important events
6. Show time gaps between events
7. Add relative time labels (e.g., "2 days ago")
8. Timeline statistics (average time between events)

## Currency Support Notes

✅ **Verified**: The implementation correctly uses the Fyo framework's formatting system:

```typescript
sourceDoc.fyo.format(amount, 'Currency');
```

This ensures:

- **Indian businesses**: Will see ₹ (INR)
- **US businesses**: Will see $ (USD)
- **Other currencies**: Automatically detected and formatted

**No hardcoded currency symbols** - All currency formatting is dynamic based on system settings!

## Example Use Cases

### Use Case 1: Payment Tracking

**Scenario**: Check when payments were received for an invoice

**Action**:

1. Open invoice
2. Click "Linked Entries"
3. Switch to "Timeline" view
4. See payments in chronological order

**Result**: Clear visibility of payment schedule and timing

### Use Case 2: Fulfillment Audit

**Scenario**: Verify when goods were shipped

**Action**:

1. Open invoice
2. Click "Linked Entries"
3. Switch to "Timeline" view
4. Look for shipment entries with dates

**Result**: Exact dates and quantities shipped

### Use Case 3: Return Investigation

**Scenario**: Understand when and why returns happened

**Action**:

1. Open invoice
2. Click "Linked Entries"
3. Switch to "Timeline" view
4. See return documents in context of other events

**Result**: Complete picture of the return flow

## Code Structure

### Key Files

- `src/pages/CommonForm/LinkedEntries.vue`: Main component
- `src/utils/linkedEntriesReason.ts`: Reason logic
- View toggle UI in header
- Timeline rendering section
- Grouped view section (existing)

### Key Components

1. **View Toggle Buttons**: Header controls
2. **Timeline Container**: Vertical line and entries
3. **Timeline Entry Cards**: Individual event display
4. **Grouped List**: Original grouping view
5. **Impact Summary**: Aggregate statistics (shared by both views)

## Testing Scenarios

1. **Empty State**: No linked entries
2. **Single Entry**: One document in timeline
3. **Multiple Same-Day**: Several documents on same date
4. **Date Range**: Documents spanning months
5. **Mixed Types**: Payments, invoices, shipments
6. **Returns**: Timeline with return documents
7. **View Switching**: Toggle between grouped/timeline
8. **Click Navigation**: Click entries to navigate
9. **Currency Display**: Verify INR/₹ for Indian businesses
