# Zero-Argument Insights - Context Menu Access

## Overview

This document describes the context menu (right-click) interface for accessing Zero-Argument Insights in Frappe Books.

## What Changed

Previously, the planned implementation was to use **E+Click** (keyboard shortcut) to access insights on numeric values. This has been replaced with a **right-click context menu** for better discoverability and ease of use.

## Why Context Menu?

- **More discoverable**: Users naturally right-click on items to explore options
- **Non-disruptive**: Doesn't add visual clutter to the UI
- **Standard pattern**: Familiar interaction that users already know
- **Easier to use**: No need to remember keyboard shortcuts

## How It Works

### For Users

1. **Navigate to a report** (e.g., Profit & Loss, General Ledger, E-Way Bill Register)
2. **Right-click on any numeric value** in the report
3. **Select "Ask a question about this value"** from the context menu
4. **Choose from available questions** in the insight dialog
5. **View the narrative answer** with real data from your books

### Technical Implementation

#### New Components

1. **InsightContextMenu.vue** - The context menu that appears on right-click

   - Positioned at cursor location
   - Auto-adjusts to stay within viewport
   - Shows "Ask a question about this value" option

2. **InsightDialog.vue** - The dialog for question selection and narrative display

   - Shows available questions based on context
   - Displays trust level indicators
   - Shows generated narrative with data
   - Allows "Ask Another" to explore different questions

3. **insightContext.ts** - Utility functions for context detection
   - `isInsightEligible()` - Checks if a field/value can have insights
   - `buildReportCellContext()` - Builds context from report cell data
   - `buildFormFieldContext()` - Builds context from form field data
   - `buildContextInfo()` - Formats context for display

#### Integration Points

**ListReport.vue** - Main integration point for reports

- Detects right-clicks on numeric cells
- Shows context menu for eligible values
- Opens insight dialog with proper context
- Visual indicator: `cursor-context-menu` class on eligible cells

**Eligibility Rules**

- Field must be numeric (Currency, Float, Int, etc.)
- Value must be non-zero
- Value must be non-null

## User Experience Flow

```
1. User sees numeric value in report
   ↓
2. Right-clicks on the value
   ↓
3. Context menu appears with "Ask a question" option
   ↓
4. Dialog opens showing available questions
   ↓
5. User selects a question
   ↓
6. System queries ledger data
   ↓
7. Narrative answer is displayed
   ↓
8. User can "Ask Another" or "Done"
```

## Example Scenarios

### Scenario 1: Profit & Loss Report

- User right-clicks on "Net Profit" value
- Selects "Ask a question"
- Chooses "Why did profit change this period?"
- Sees narrative: "Your profit increased by ₹50,000 primarily due to..."

### Scenario 2: E-Way Bill Register

- User right-clicks on "Invoice Value"
- Selects "Ask a question"
- Chooses "What transactions built this balance?"
- Sees list of all transactions that contribute to the value

### Scenario 3: General Ledger

- User right-clicks on account balance
- Selects "Ask a question"
- Chooses "Why did cash decrease this month?"
- Sees breakdown of cash outflows

## Architecture Principles

✅ **Non-blocking**: Right-click menu doesn't interfere with normal interactions
✅ **Progressive enhancement**: Works alongside existing functionality
✅ **Context-aware**: Only shows on eligible numeric values
✅ **Zero visual clutter**: No UI changes until user initiates
✅ **Defensive**: Gracefully handles missing data or errors

## Future Enhancements

- Context menu support for form fields (Currency, Float controls)
- Ledger view integration
- Customer/Vendor outstanding integration
- Parameter chips for refining insights
- Breadcrumb trail navigation

## Notes

- This replaces the E+Click shortcut mentioned in previous documentation
- The InsightService API remains unchanged
- All query functions and templates work as designed
- No changes to the underlying insight generation logic
