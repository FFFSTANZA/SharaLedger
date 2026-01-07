# Phase 2: Guided Exploration - Implementation Guide

## Overview

Phase 2 adds **parameter-based refinement** to the Zero-Argument Accounting system. Users can now refine insights through predefined parameter chips without typing, maintaining trust and audit trails.

## What's New

### 1. Parameter System

Five parameter types enable controlled exploration:

- **group_by**: Break down results by dimensions (customer, month, account, etc.)
- **filter**: Apply date ranges or specific filters
- **limit**: Control result count (Top 5, Top 10, Show All)
- **drill_down**: Navigate to detailed views
- **compare**: Compare periods (last month, last year, budget)

### 2. Breadcrumb Trail

Every refinement creates a new narrative linked to its parent:

```
Narrative 1 (Root)
└── Narrative 2 (grouped by customer)
    └── Narrative 3 (top 10 only)
```

All narratives share the same `sessionId` for audit trail reconstruction.

### 3. Enhanced InsightService

New methods for parameter-driven exploration:

- `getAvailableParameters()`: Get allowed parameters for a template
- `getParameterChips()`: Create UI chips for display
- `refineInsight()`: Apply a parameter and create child narrative
- `getExplorationHistory()`: View full session history
- `reconstructExplorationPath()`: Rebuild exploration chain

## Architecture

### Database Schema Changes

**InsightQueryTemplate**: Added `availableParameters` (Text field)

- Stores JSON array of parameter definitions
- Example: `[{"type":"group_by","label":"By Customer","field":"party"}]`

**InsightNarrative**: Enhanced breadcrumb support

- `breadcrumbTrail`: JSON array of parent narrative IDs
- `sessionId`: Groups related explorations
- `parametersApplied`: Stores all applied parameters

### Type System

```typescript
// Parameter types
type ParameterType = 'group_by' | 'filter' | 'limit' | 'drill_down' | 'compare';

// Applied parameters stored in context
interface AppliedParameters {
  group_by?: string;
  filter?: {
    date_range?: string;
    from_date?: string;
    to_date?: string;
  };
  limit?: number;
  compare_to?: string;
}

// Parameter chip for UI
interface ParameterChip {
  id: string;
  label: string;
  type: ParameterType;
  parameter: InsightParameter;
  enabled: boolean;
}
```

## Usage Examples

### Example 1: Basic Refinement

```typescript
import { createInsightService } from 'models/insights';

const service = createInsightService(fyo);

// Step 1: Generate initial insight
const { narrative: initial, doc: doc1 } = await service.generateInsight(
  'Report',
  'profit_value',
  'pl-variance-analysis',
  { fromDate: '2024-01-01', toDate: '2024-01-31' }
);

console.log(initial);
// "Your profit decreased by ₹1,20,000..."

// Step 2: Get available parameters
const chips = await service.getParameterChips('pl-variance-analysis');
console.log(chips);
// [
//   { label: "By Customer", type: "group_by", ... },
//   { label: "By Month", type: "group_by", ... },
//   { label: "Last 30 Days", type: "filter", ... },
//   ...
// ]

// Step 3: User clicks "By Customer" chip
const groupByCustomer = chips.find((c) => c.label === 'By Customer');
const {
  narrative: refined,
  doc: doc2,
  parameters: newChips,
} = await service.refineInsight(doc1.name as string, groupByCustomer.parameter);

console.log(refined);
// "When broken down by customer: Customer A: -₹80,000, Customer B: -₹40,000..."

// Step 4: User clicks "Top 10" from new chips
const topTen = newChips.find((c) => c.label === 'Top 10');
const { narrative: final, doc: doc3 } = await service.refineInsight(
  doc2.name as string,
  topTen.parameter
);

console.log(final);
// "Top 10 customers by profit change: [list of 10]..."

// All three narratives are linked:
// doc1 -> doc2 -> doc3 (same sessionId)
```

### Example 2: Reconstruction

```typescript
// Reconstruct the entire exploration path
const path = await service.reconstructExplorationPath(doc3.name as string);

path.forEach((narrative, index) => {
  console.log(`Step ${index + 1}:`);
  console.log(`  Question: ${narrative.questionAsked}`);
  console.log(`  Answer: ${narrative.narrativeAnswer}`);

  const params = JSON.parse(narrative.parametersApplied);
  if (params.appliedParameters) {
    console.log(`  Parameters: ${JSON.stringify(params.appliedParameters)}`);
  }
});

// Output:
// Step 1:
//   Question: Why did profit change this period?
//   Answer: Your profit decreased by ₹1,20,000...
//   Parameters: {}
//
// Step 2:
//   Question: Why did profit change this period?
//   Answer: When broken down by customer...
//   Parameters: {"group_by":"party"}
//
// Step 3:
//   Question: Why did profit change this period?
//   Answer: Top 10 customers by profit change...
//   Parameters: {"group_by":"party","limit":10}
```

### Example 3: Session History

```typescript
// Get all insights from a session
const history = await service.getExplorationHistory(doc1.sessionId as string);

console.log(`Session ${doc1.sessionId} had ${history.length} explorations:`);
history.forEach((insight, i) => {
  const params = JSON.parse(insight.parametersApplied);
  const refinements = params.appliedParameters || {};
  console.log(
    `${i + 1}. ${insight.questionAsked} ${JSON.stringify(refinements)}`
  );
});
```

## Parameter Definitions

### Group By Parameters

Break down results by a dimension:

```json
{
  "type": "group_by",
  "label": "By Customer",
  "field": "party",
  "applies_to": ["Sales Income"]
}
```

**Common fields:**

- `party`: Group by customer/vendor
- `period`: Group by month/quarter
- `account`: Group by account
- `voucher_type`: Group by document type
- `item`: Group by product/item

### Filter Parameters

Apply date range or specific filters:

```json
{
  "type": "filter",
  "label": "Last 30 Days",
  "date_range": "last_30_days"
}
```

**Predefined ranges:**

- `last_7_days`
- `last_30_days`
- `last_quarter`
- `current_fy`
- `last_fy`
- `custom` (allows date picker)

### Limit Parameters

Control result count:

```json
{
  "type": "limit",
  "label": "Top 10",
  "value": 10
}
```

**Common limits:**

- Top 3
- Top 5
- Top 10
- Show All (no limit)

### Drill Down Parameters

Navigate to detailed views:

```json
{
  "type": "drill_down",
  "label": "Show All Transactions",
  "target": "transaction_list"
}
```

**Targets:**

- `ledger_view`: Open ledger report
- `report_view`: Open full report
- `transaction_list`: List individual transactions
- `detail_view`: Show detailed breakdown

### Compare Parameters

Compare to another period:

```json
{
  "type": "compare",
  "label": "Compare to Last Year",
  "compare_to": "last_year"
}
```

**Compare options:**

- `last_month`
- `last_quarter`
- `last_year`
- `budget` (requires budget setup)
- `custom` (custom period)

## Adding Parameters to Templates

### In Database

```typescript
const template = fyo.doc.getNewDoc('InsightQueryTemplate');

// ... set other fields ...

const parameters = [
  {
    type: 'group_by',
    label: 'By Customer',
    field: 'party',
  },
  {
    type: 'filter',
    label: 'Last 30 Days',
    date_range: 'last_30_days',
  },
  {
    type: 'limit',
    label: 'Top 10',
    value: 10,
  },
];

await template.set('availableParameters', JSON.stringify(parameters));
await template.insert();
```

### In Fixtures

Update `fixtures/insightQueryTemplatesWithParameters.json`:

```json
{
  "name": "my-analysis",
  "templateId": "my-analysis",
  "availableParameters": "[{\"type\":\"group_by\",\"label\":\"By Customer\",\"field\":\"party\"},{\"type\":\"limit\",\"label\":\"Top 10\",\"value\":10}]"
}
```

**Tip**: Use CommonParameterSets for quick setup:

```typescript
import { CommonParameterSets } from 'models/insights';

const parameters = CommonParameterSets.profitAnalysis;
await template.set('availableParameters', JSON.stringify(parameters));
```

## Parameter Helpers

### Date Range Calculator

```typescript
import { calculateDateRange } from 'models/insights';

const range = calculateDateRange('last_30_days');
console.log(range);
// { fromDate: "2024-01-01", toDate: "2024-01-31" }
```

### Group By Helper

```typescript
import { groupByField } from 'models/insights';

const results = [
  { party: 'Customer A', amount: 100 },
  { party: 'Customer B', amount: 200 },
  { party: 'Customer A', amount: 150 },
];

const grouped = groupByField(results, 'party');
// Map {
//   "Customer A" => [{ party: "Customer A", amount: 100 }, { party: "Customer A", amount: 150 }],
//   "Customer B" => [{ party: "Customer B", amount: 200 }]
// }
```

### Format Grouped Results

```typescript
import { formatGroupedResults } from 'models/insights';

const formatted = formatGroupedResults(grouped, 'amount');
console.log(formatted);
// [
//   { group: "Customer A", count: 2, items: [...], total: 250 },
//   { group: "Customer B", count: 1, items: [...], total: 200 }
// ]
```

## UI Integration (Future Phase)

When building the UI, parameter chips can be rendered as:

```vue
<template>
  <div class="insight-container">
    <div class="narrative-text">{{ narrative }}</div>

    <div class="parameter-chips">
      <span class="chip-label">💡 Refine this answer:</span>
      <button
        v-for="chip in parameterChips"
        :key="chip.id"
        :disabled="!chip.enabled"
        @click="applyParameter(chip)"
        class="parameter-chip"
      >
        {{ chip.label }}
      </button>
    </div>

    <div v-if="breadcrumbs.length > 0" class="breadcrumb-trail">
      <span>Exploration path:</span>
      <span v-for="(crumb, i) in breadcrumbs" :key="i">
        {{ i > 0 ? '→' : '' }}
        <button @click="navigateToCrumb(crumb)">Step {{ i + 1 }}</button>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    async applyParameter(chip) {
      const result = await this.insightService.refineInsight(
        this.currentNarrativeId,
        chip.parameter
      );

      this.narrative = result.narrative;
      this.currentNarrativeId = result.doc.name;
      this.parameterChips = result.parameters;
      this.updateBreadcrumbs();
    },
  },
};
</script>
```

## Best Practices

### 1. Parameter Selection

Choose parameters that:

- ✅ Are meaningful for the query type
- ✅ Lead to actionable insights
- ✅ Can be computed from available data
- ❌ Don't require subjective judgment
- ❌ Don't need external data sources

### 2. Parameter Combinations

Some parameters work well together:

- group_by + limit: "By Customer, Top 10"
- filter + compare: "Last 30 Days vs. Last Year"
- group_by + filter: "By Month, Current FY"

Avoid conflicting combinations:

- Multiple group_by parameters (pick one)
- Contradictory filters

### 3. Breadcrumb Management

- Keep trails under 5 levels deep
- Provide "Reset" option to return to root
- Show trail inline for context
- Save full session for audit

### 4. Performance

- Apply limits early to reduce data processing
- Cache frequently used groupings
- Use database-level GROUP BY when possible
- Consider pagination for large drill-downs

## Testing

```typescript
// Test parameter parsing
import { parseAvailableParameters } from 'models/insights';

const json = '[{"type":"group_by","label":"By Customer","field":"party"}]';
const params = parseAvailableParameters(json);
expect(params).toHaveLength(1);
expect(params[0].type).toBe('group_by');

// Test parameter merging
import { mergeAppliedParameters } from 'models/insights';

const existing = { group_by: 'party' };
const newParam = { type: 'limit', value: 10 };
const merged = mergeAppliedParameters(existing, newParam);
expect(merged).toEqual({ group_by: 'party', limit: 10 });

// Test date range calculation
import { calculateDateRange } from 'models/insights';

const range = calculateDateRange('last_7_days');
expect(range.toDate).toBe(DateTime.now().toISODate());
```

## Migration from Phase 1

Existing templates without `availableParameters` will:

- ✅ Continue to work normally
- ✅ Show no parameter chips
- ✅ Generate insights as before
- ⚠️ Won't support refinement

To migrate:

1. Identify common refinement needs per template
2. Add appropriate parameters to `availableParameters`
3. Test parameter combinations
4. Update fixtures for new deployments

## Compliance & Audit

Phase 2 maintains full audit compliance:

### Breadcrumb Trail Audit

```sql
-- Find all explorations in a session
SELECT * FROM InsightNarrative
WHERE sessionId = 'session-123'
ORDER BY timestamp ASC;

-- Reconstruct specific exploration path
SELECT * FROM InsightNarrative
WHERE name IN (
  SELECT json_extract(breadcrumbTrail, '$[*]')
  FROM InsightNarrative
  WHERE name = 'narrative-456'
)
ORDER BY timestamp ASC;
```

### Parameter Usage Analysis

```typescript
// Most used parameters
const narratives = await fyo.db.getAll('InsightNarrative');
const paramStats = {};

narratives.forEach((n) => {
  const params = JSON.parse(n.parametersApplied || '{}').appliedParameters;
  if (params) {
    Object.keys(params).forEach((key) => {
      paramStats[key] = (paramStats[key] || 0) + 1;
    });
  }
});

console.log('Most used parameters:', paramStats);
// { group_by: 45, filter: 32, limit: 28, compare: 12 }
```

## Summary

Phase 2 delivers:

- ✅ Controlled exploration without free text
- ✅ Five parameter types covering common needs
- ✅ Full breadcrumb trail for audit
- ✅ Session-based grouping
- ✅ Backward compatible with Phase 1
- ✅ Ready for UI integration

Users can now explore insights deeply while maintaining the core philosophy: **guided freedom, not restriction**.
