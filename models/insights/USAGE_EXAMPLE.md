# Zero-Argument Accounting - Usage Example

## Basic Usage

```typescript
import { createInsightService } from 'models/insights';

// Initialize the service
const insightService = createInsightService(fyo);

// Example 1: Get available templates for a context
// When user clicks on a profit value in a P&L report
const templates = await insightService.getTemplatesForContext(
  'Report', // contextType: Report, Ledger, Customer, Vendor, Account
  'profit_value' // contextField: the specific field clicked
);

// Display templates as dropdown options to user
templates.forEach((template) => {
  console.log(template.questionText);
  // e.g., "Why did profit change this period?"
});

// Example 2: Execute a specific template
const result = await insightService.executeQueryTemplate(
  'pl-variance-analysis', // templateId from the selected template
  {
    contextType: 'Report',
    contextField: 'profit_value',
    fromDate: '2024-01-01',
    toDate: '2024-01-31',
  }
);

if (result.success) {
  console.log(result.data);
  // Output: PLComparisonResult with variance details
}

// Example 3: Complete workflow - generate and save insight
const { narrative, doc } = await insightService.generateInsight(
  'Report', // contextType
  'profit_value', // contextField
  'pl-variance-analysis', // templateId
  {
    fromDate: '2024-01-01',
    toDate: '2024-01-31',
  }
);

console.log(narrative);
// Output: "Your profit decreased by ₹1,20,000 (24.5%) from ₹4,90,000
// to ₹3,70,000. Top 5 contributors: ..."

// The insight is automatically saved to InsightNarrative table for audit trail

// Example 4: Get recent insights history
const recentInsights = await insightService.getRecentNarratives(10);
recentInsights.forEach((insight) => {
  console.log(`${insight.user} asked: ${insight.questionAsked}`);
  console.log(`Answer: ${insight.narrativeAnswer}`);
});
```

## Available Query Templates (Pre-seeded)

1. **pl-variance-analysis**: Why did profit change this period?

   - Context: Report/profit_value
   - Function: compare_pl_periods

2. **ledger-balance-breakdown**: What transactions built this balance?

   - Context: Ledger/balance_amount
   - Function: trace_ledger_movements

3. **customer-outstanding-analysis**: Why is this customer's outstanding high?

   - Context: Customer/outstanding_amount
   - Function: analyze_customer_outstanding

4. **cash-movement-analysis**: Why did cash decrease this month?

   - Context: Account/balance_amount
   - Function: trace_ledger_movements

5. **top-expenses-analysis**: What are my top 5 expenses?

   - Context: Report/expense_value
   - Function: compare_pl_periods

6. **gst-liability-analysis**: Why is GST liability high/low?

   - Context: Account/balance_amount
   - Function: trace_ledger_movements

7. **vendor-payment-ranking**: Which vendor am I paying the most to?

   - Context: Vendor/total_paid
   - Function: analyze_customer_outstanding

8. **expense-variance-analysis**: Why is this expense higher than expected?

   - Context: Account/balance_amount
   - Function: compare_pl_periods

9. **customer-payment-pattern**: Show payment pattern for this customer

   - Context: Customer/payment_history
   - Function: analyze_customer_outstanding

10. **overdue-invoices-aging**: Which invoices are overdue?
    - Context: Customer/outstanding_amount
    - Function: analyze_customer_outstanding

## Creating Custom Query Templates

You can add new templates programmatically:

```typescript
const newTemplate = fyo.doc.getNewDoc('InsightQueryTemplate');

await newTemplate.set('name', 'my-custom-analysis');
await newTemplate.set('templateId', 'my-custom-analysis');
await newTemplate.set('contextType', 'Report');
await newTemplate.set('contextField', 'revenue_value');
await newTemplate.set('questionText', 'Why did revenue change?');
await newTemplate.set('queryFunction', 'compare_pl_periods');
await newTemplate.set(
  'answerTemplate',
  'Revenue {increased/decreased} by ₹{amount}...'
);
await newTemplate.set('requiredDoctypes', 'AccountingLedgerEntry,Account');
await newTemplate.set('isActive', true);
await newTemplate.set('trustLevel', '1');
await newTemplate.set('displayOrder', 11);

await newTemplate.insert();
```

## Adding New Query Functions

1. Create your function in `queryFunctions.ts`:

```typescript
export async function my_custom_query(
  fyo: Fyo,
  context: InsightContext
): Promise<InsightResult> {
  try {
    // Your query logic using fyo.db
    const data = await fyo.db.getAllRaw('SomeDocType', {
      filters: {
        /* ... */
      },
    });

    // Process and return
    return {
      success: true,
      data: {
        // Your result data
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
```

2. Export it:

```typescript
export const queryFunctions = {
  compare_pl_periods,
  trace_ledger_movements,
  analyze_customer_outstanding,
  my_custom_query, // Add here
};
```

3. Create a template that uses `queryFunction: 'my_custom_query'`

## Trust Levels Explained

- **Level 1 (Safe)**: Deterministic queries from ledger data

  - Always answerable
  - No assumptions or estimates
  - Example: "What transactions built this balance?"

- **Level 2 (Needs Review)**: Requires comparison or historical data

  - May need budget/forecast data
  - Involves period comparisons
  - Example: "Why is this expense higher than expected?"

- **Level 3 (Experimental)**: Currently disabled
  - Reserved for future advanced features
  - Not used in Phase 1

## Audit Trail

Every insight generated creates an InsightNarrative record with:

- User who requested it
- Timestamp
- Context (what was clicked)
- Question asked
- Answer generated
- Data snapshot (JSON)
- Source documents
- Session ID (for grouping related queries)

Query all insights for a user:

```typescript
const userInsights = await fyo.db.getAll('InsightNarrative', {
  filters: { user: 'john@example.com' },
  orderBy: 'timestamp',
  order: 'desc',
});
```

## Future UI Integration (Phase 2)

The planned E + Click interaction:

1. User presses **E** key and clicks any numeric field
2. System detects context type and field
3. Shows dropdown with 3-5 relevant questions
4. User selects question
5. System executes query and shows answer modal
6. Answer includes drill-down links to source transactions
7. Saved to audit trail automatically

This foundation is now complete and ready for UI integration!
