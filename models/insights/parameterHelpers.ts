/**
 * Parameter Helpers
 * Utility functions for applying parameters to query results
 */

import { DateTime } from 'luxon';
import { AppliedParameters } from './parameterTypes';

/**
 * Calculate date range based on filter parameter
 */
export function calculateDateRange(
  dateRangeType: string,
  customFrom?: string,
  customTo?: string
): { fromDate: string; toDate: string } {
  const now = DateTime.now();

  switch (dateRangeType) {
    case 'last_7_days':
      return {
        fromDate: now.minus({ days: 7 }).toISODate(),
        toDate: now.toISODate(),
      };

    case 'last_30_days':
      return {
        fromDate: now.minus({ days: 30 }).toISODate(),
        toDate: now.toISODate(),
      };

    case 'last_quarter':
      return {
        fromDate: now.minus({ months: 3 }).toISODate(),
        toDate: now.toISODate(),
      };

    case 'current_fy':
      // Assuming FY starts in April (India)
      const fyStart =
        now.month >= 4
          ? DateTime.local(now.year, 4, 1)
          : DateTime.local(now.year - 1, 4, 1);
      return {
        fromDate: fyStart.toISODate(),
        toDate: now.toISODate(),
      };

    case 'last_fy':
      const lastFyStart =
        now.month >= 4
          ? DateTime.local(now.year - 1, 4, 1)
          : DateTime.local(now.year - 2, 4, 1);
      const lastFyEnd =
        now.month >= 4
          ? DateTime.local(now.year, 3, 31)
          : DateTime.local(now.year - 1, 3, 31);
      return {
        fromDate: lastFyStart.toISODate(),
        toDate: lastFyEnd.toISODate(),
      };

    case 'custom':
      return {
        fromDate: customFrom || now.minus({ months: 1 }).toISODate(),
        toDate: customTo || now.toISODate(),
      };

    default:
      return {
        fromDate: now.minus({ months: 1 }).toISODate(),
        toDate: now.toISODate(),
      };
  }
}

/**
 * Apply limit to array of results
 */
export function applyLimit<T>(results: T[], limit?: number): T[] {
  if (!limit || limit <= 0) return results;
  return results.slice(0, limit);
}

/**
 * Group results by a specific field
 */
export function groupByField<T extends Record<string, unknown>>(
  results: T[],
  field: string
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const item of results) {
    const key = String(item[field] || 'Unknown');
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  }

  return grouped;
}

/**
 * Group ledger entries by period (month)
 */
export function groupByPeriod<T extends { date: string | Date }>(
  entries: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const entry of entries) {
    const date =
      typeof entry.date === 'string'
        ? DateTime.fromISO(entry.date)
        : DateTime.fromJSDate(entry.date);

    const period = date.toFormat('yyyy-MM');

    if (!grouped.has(period)) {
      grouped.set(period, []);
    }
    grouped.get(period)!.push(entry);
  }

  return grouped;
}

/**
 * Calculate comparison period based on compare_to parameter
 */
export function calculateComparisonPeriod(
  compareType: string,
  currentFromDate: string,
  currentToDate: string,
  customPeriod?: { from_date: string; to_date: string }
): { fromDate: string; toDate: string } {
  const currentStart = DateTime.fromISO(currentFromDate);
  const currentEnd = DateTime.fromISO(currentToDate);
  const periodLength = currentEnd.diff(currentStart, 'days').days;

  switch (compareType) {
    case 'last_month':
      return {
        fromDate: currentStart.minus({ months: 1 }).toISODate(),
        toDate: currentEnd.minus({ months: 1 }).toISODate(),
      };

    case 'last_quarter':
      return {
        fromDate: currentStart.minus({ months: 3 }).toISODate(),
        toDate: currentEnd.minus({ months: 3 }).toISODate(),
      };

    case 'last_year':
      return {
        fromDate: currentStart.minus({ years: 1 }).toISODate(),
        toDate: currentEnd.minus({ years: 1 }).toISODate(),
      };

    case 'custom':
      if (customPeriod) {
        return {
          fromDate: customPeriod.from_date,
          toDate: customPeriod.to_date,
        };
      }
      // Fallback to previous period of same length
      return {
        fromDate: currentStart.minus({ days: periodLength + 1 }).toISODate(),
        toDate: currentStart.minus({ days: 1 }).toISODate(),
      };

    default:
      // Default to previous period of same length
      return {
        fromDate: currentStart.minus({ days: periodLength + 1 }).toISODate(),
        toDate: currentStart.minus({ days: 1 }).toISODate(),
      };
  }
}

/**
 * Apply all parameters to modify context
 */
export function applyParametersToContext(
  baseContext: Record<string, unknown>,
  parameters?: AppliedParameters
): Record<string, unknown> {
  if (!parameters) return baseContext;

  const modified = { ...baseContext };

  // Apply filter parameters
  if (parameters.filter) {
    if (parameters.filter.date_range) {
      const range = calculateDateRange(
        parameters.filter.date_range,
        parameters.filter.from_date,
        parameters.filter.to_date
      );
      modified.fromDate = range.fromDate;
      modified.toDate = range.toDate;
    }

    if (parameters.filter.account) {
      modified.accountName = parameters.filter.account;
    }

    if (parameters.filter.party) {
      modified.partyName = parameters.filter.party;
    }
  }

  // Apply comparison parameters
  if (parameters.compare_to && modified.fromDate && modified.toDate) {
    const comparison = calculateComparisonPeriod(
      parameters.compare_to,
      modified.fromDate as string,
      modified.toDate as string,
      parameters.compare_period
    );
    modified.compareFromDate = comparison.fromDate;
    modified.compareToDate = comparison.toDate;
  }

  // Store group_by and limit for post-processing
  if (parameters.group_by) {
    modified.groupByField = parameters.group_by;
  }

  if (parameters.limit) {
    modified.resultLimit = parameters.limit;
  }

  return modified;
}

/**
 * Post-process results based on parameters
 */
export function postProcessResults<T extends Record<string, unknown>>(
  results: T[],
  parameters?: AppliedParameters
): T[] | Map<string, T[]> {
  if (!parameters) return results;

  let processed: T[] | Map<string, T[]> = results;

  // Apply group_by if specified
  if (parameters.group_by && parameters.group_by !== 'none') {
    if (parameters.group_by === 'period') {
      processed = groupByPeriod(results);
    } else {
      processed = groupByField(results, parameters.group_by);
    }
  }

  // Apply limit if specified and not grouped
  if (parameters.limit && Array.isArray(processed)) {
    processed = applyLimit(processed, parameters.limit);
  }

  return processed;
}

/**
 * Format grouped results for display
 */
export function formatGroupedResults<T extends Record<string, unknown>>(
  grouped: Map<string, T[]>,
  aggregateField?: string
): Array<{
  group: string;
  count: number;
  items: T[];
  total?: number;
}> {
  const formatted = [];

  for (const [group, items] of grouped.entries()) {
    const result: {
      group: string;
      count: number;
      items: T[];
      total?: number;
    } = {
      group,
      count: items.length,
      items,
    };

    // Calculate total if aggregate field is specified
    if (aggregateField) {
      result.total = items.reduce((sum, item) => {
        const value = item[aggregateField];
        return sum + (typeof value === 'number' ? value : 0);
      }, 0);
    }

    formatted.push(result);
  }

  // Sort by total (descending) or count
  formatted.sort((a, b) => {
    if (a.total !== undefined && b.total !== undefined) {
      return Math.abs(b.total) - Math.abs(a.total);
    }
    return b.count - a.count;
  });

  return formatted;
}
