/**
 * Parameter Types for Zero-Argument Accounting
 * Defines all allowed parameter types for refining insights
 */

export type ParameterType =
  | 'group_by'
  | 'filter'
  | 'limit'
  | 'drill_down'
  | 'compare';

export interface BaseParameter {
  type: ParameterType;
  label: string;
  description?: string;
}

export interface GroupByParameter extends BaseParameter {
  type: 'group_by';
  field: string;
  applies_to?: string[];
}

export interface FilterParameter extends BaseParameter {
  type: 'filter';
  date_range?:
    | 'last_7_days'
    | 'last_30_days'
    | 'last_quarter'
    | 'current_fy'
    | 'last_fy'
    | 'custom';
  custom_from_date?: string;
  custom_to_date?: string;
  account_filter?: string;
  party_filter?: string;
}

export interface LimitParameter extends BaseParameter {
  type: 'limit';
  value: number;
}

export interface DrillDownParameter extends BaseParameter {
  type: 'drill_down';
  target: 'ledger_view' | 'report_view' | 'transaction_list' | 'detail_view';
  target_schema?: string;
  target_filter?: Record<string, unknown>;
}

export interface CompareParameter extends BaseParameter {
  type: 'compare';
  compare_to: 'last_month' | 'last_quarter' | 'last_year' | 'budget' | 'custom';
  custom_period?: {
    from_date: string;
    to_date: string;
  };
}

export type InsightParameter =
  | GroupByParameter
  | FilterParameter
  | LimitParameter
  | DrillDownParameter
  | CompareParameter;

export interface AppliedParameters {
  group_by?: string;
  filter?: {
    date_range?: string;
    from_date?: string;
    to_date?: string;
    account?: string;
    party?: string;
  };
  limit?: number;
  compare_to?: string;
  compare_period?: {
    from_date: string;
    to_date: string;
  };
  [key: string]: unknown;
}

export interface ParameterChip {
  id: string;
  label: string;
  type: ParameterType;
  parameter: InsightParameter;
  enabled: boolean;
}

/**
 * Helper function to parse availableParameters JSON string
 */
export function parseAvailableParameters(
  jsonString: string | undefined
): InsightParameter[] {
  if (!jsonString) return [];

  try {
    const parsed = JSON.parse(jsonString) as unknown;
    return Array.isArray(parsed) ? (parsed as InsightParameter[]) : [];
  } catch {
    return [];
  }
}

/**
 * Helper function to create parameter chips for UI
 */
export function createParameterChips(
  parameters: InsightParameter[]
): ParameterChip[] {
  return parameters.map((param, index) => ({
    id: `param-${index}-${param.type}`,
    label: param.label,
    type: param.type,
    parameter: param,
    enabled: true,
  }));
}

/**
 * Helper function to merge applied parameters
 */
export function mergeAppliedParameters(
  existing: AppliedParameters,
  newParam: InsightParameter
): AppliedParameters {
  const merged = { ...existing };

  switch (newParam.type) {
    case 'group_by':
      merged.group_by = newParam.field;
      break;

    case 'filter':
      merged.filter = {
        ...merged.filter,
        date_range: newParam.date_range,
        from_date: newParam.custom_from_date,
        to_date: newParam.custom_to_date,
        account: newParam.account_filter,
        party: newParam.party_filter,
      };
      break;

    case 'limit':
      merged.limit = newParam.value;
      break;

    case 'compare':
      merged.compare_to = newParam.compare_to;
      if (newParam.custom_period) {
        merged.compare_period = newParam.custom_period;
      }
      break;

    case 'drill_down':
      // Drill-down doesn't modify parameters, it changes the view
      merged.drill_down_target = newParam.target;
      break;
  }

  return merged;
}

/**
 * Predefined parameter sets for common scenarios
 */
export const CommonParameterSets = {
  profitAnalysis: [
    {
      type: 'group_by',
      label: 'By Customer',
      field: 'party',
      applies_to: ['Sales Income'],
    } as GroupByParameter,
    {
      type: 'group_by',
      label: 'By Month',
      field: 'period',
    } as GroupByParameter,
    {
      type: 'filter',
      label: 'Last 30 Days',
      date_range: 'last_30_days',
    } as FilterParameter,
    {
      type: 'limit',
      label: 'Top 10',
      value: 10,
    } as LimitParameter,
    {
      type: 'compare',
      label: 'Compare to Last Year',
      compare_to: 'last_year',
    } as CompareParameter,
  ],

  balanceAnalysis: [
    {
      type: 'drill_down',
      label: 'Show All Transactions',
      target: 'transaction_list',
    } as DrillDownParameter,
    {
      type: 'filter',
      label: 'Last 7 Days',
      date_range: 'last_7_days',
    } as FilterParameter,
    {
      type: 'filter',
      label: 'Last Quarter',
      date_range: 'last_quarter',
    } as FilterParameter,
    {
      type: 'group_by',
      label: 'By Voucher Type',
      field: 'voucher_type',
    } as GroupByParameter,
  ],

  customerAnalysis: [
    {
      type: 'filter',
      label: 'Last 30 Days',
      date_range: 'last_30_days',
    } as FilterParameter,
    {
      type: 'drill_down',
      label: 'Payment Pattern',
      target: 'detail_view',
    } as DrillDownParameter,
    {
      type: 'limit',
      label: 'Top 5 Invoices',
      value: 5,
    } as LimitParameter,
    {
      type: 'compare',
      label: 'Compare to Last Year',
      compare_to: 'last_year',
    } as CompareParameter,
  ],

  expenseAnalysis: [
    {
      type: 'group_by',
      label: 'By Account',
      field: 'account',
    } as GroupByParameter,
    {
      type: 'group_by',
      label: 'By Month',
      field: 'period',
    } as GroupByParameter,
    {
      type: 'limit',
      label: 'Top 5',
      value: 5,
    } as LimitParameter,
    {
      type: 'compare',
      label: 'Compare to Last Month',
      compare_to: 'last_month',
    } as CompareParameter,
    {
      type: 'drill_down',
      label: 'View All Entries',
      target: 'ledger_view',
    } as DrillDownParameter,
  ],
};
