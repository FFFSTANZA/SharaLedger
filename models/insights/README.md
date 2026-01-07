# Zero-Argument Accounting Insights System

## Overview

The Zero-Argument Accounting system is a trust-earning explanation system built on Frappe Books' event-driven ledger. It provides defensible narratives based on actual transactions, not AI guesses.

## Core Philosophy

- **Not a chatbot**: Guided questions, not free-form chat
- **Traceable**: Every answer must be traceable to specific transactions
- **Defensible**: Makes arguments impossible by showing real data
- **Trust-earning**: One hallucination = complete trust collapse

## Architecture

### Two Core DocTypes

1. **InsightQueryTemplate**: Defines what questions are allowed and how to answer them

   - Controls which questions users can ask
   - Maps questions to query functions
   - Defines narrative templates with placeholders
   - Trust levels: 1=Safe, 2=Needs review, 3=Experimental

2. **InsightNarrative**: Stores every explanation generated (audit trail)
   - Who asked what, when
   - Complete data snapshot
   - Links to source documents
   - Reproducible answers

### Query Functions

Query functions are located in `queryFunctions.ts` and include:

- `compare_pl_periods()`: P&L variance analysis
- `trace_ledger_movements()`: Ledger transaction breakdown
- `analyze_customer_outstanding()`: Customer outstanding analysis

### InsightService

The `InsightService` class provides the main API:

```typescript
import { createInsightService } from 'models/insights';

const insightService = createInsightService(fyo);

// Get available templates for a context
const templates = await insightService.getTemplatesForContext(
  'Report',
  'profit_value'
);

// Generate a complete insight
const { narrative, doc } = await insightService.generateInsight(
  'Report',
  'profit_value',
  'pl-variance-analysis',
  { fromDate: '2024-01-01', toDate: '2024-01-31' }
);
```

## Initial Query Templates

10 pre-seeded templates cover Indian SMB needs:

1. Why did profit change this period?
2. What transactions built this balance?
3. Why is this customer's outstanding high?
4. Why did cash decrease this month?
5. What are my top 5 expenses?
6. Why is GST liability high/low?
7. Which vendor am I paying the most to?
8. Why is this expense higher than expected?
9. Show payment pattern for this customer
10. Which invoices are overdue?

## Trust Levels

- **Level 1 (Safe)**: Deterministic, always answerable from ledger data
- **Level 2 (Needs Review)**: Requires comparison data (budget/history)
- **Level 3 (Experimental)**: Disabled in Phase 1

## What Questions Are NOT Allowed

The system blocks subjective or unverifiable questions:

❌ "Is my business doing well?"
❌ "Should I hire more staff?"
❌ "What should I do about this?"
❌ "Is this vendor trustworthy?"
❌ "Will sales improve next month?"

**Principle**: If it can't be answered by querying ledger data alone, don't allow it.

## Adding New Query Functions

1. Add your function to `queryFunctions.ts`:

```typescript
export async function my_new_query(
  fyo: Fyo,
  context: InsightContext
): Promise<InsightResult> {
  // Your query logic
  return {
    success: true,
    data: {
      /* results */
    },
  };
}
```

2. Export it in the `queryFunctions` object

3. Create a template fixture in `fixtures/insightQueryTemplates.json`

4. The system will automatically make it available

## Data Flow

```
User triggers insight (E + Click)
  → System detects context (report/ledger/party/etc)
  → Queries InsightQueryTemplate for matching questions
  → User selects question from dropdown
  → System executes queryFunction
  → Fills answerTemplate with real data
  → Creates InsightNarrative record
  → Displays answer with linked references
```

## Compliance & Audit

Every insight is logged with:

- User who requested it
- Timestamp
- Context (what was clicked)
- Parameters used (date ranges, filters)
- Data snapshot
- Source documents
- Session grouping

This enables:

- Audit trails: "Show all cash explanations given in Q2"
- Accountability: Who asked what, when
- Learning: Which questions users actually use
- Reproducibility: Can regenerate same answer with same data

## Future Extensions (Phase 2+)

- UI integration with E+Click handlers
- Follow-up question chains (breadcrumb trails)
- Export to PDF
- Scheduled insights (daily/weekly summaries)
- Compare to budget/forecast (trust level 2)
