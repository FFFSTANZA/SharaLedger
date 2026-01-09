import { Doc } from 'fyo/model/doc';
import { InsightContext } from 'models/insights/types';
import { isNumeric } from 'src/utils';
import { Field } from 'schemas/types';

/**
 * Detect if a field/cell is eligible for insights
 */
export function isInsightEligible(
  fieldtype?: string,
  value?: unknown
): boolean {
  if (!fieldtype) {
    return false;
  }

  // Only numeric fields are eligible
  if (!isNumeric(fieldtype)) {
    return false;
  }

  // Must have a value
  if (value === null || value === undefined) {
    return false;
  }

  // Must be non-zero
  if (typeof value === 'number' && value === 0) {
    return false;
  }

  return true;
}

/**
 * Build insight context from report cell data
 */
export function buildReportCellContext(
  cell: { fieldname?: string; fieldtype?: string; rawValue?: unknown },
  row: Record<string, unknown>,
  reportName?: string
): InsightContext | null {
  if (!isInsightEligible(cell.fieldtype, cell.rawValue)) {
    return null;
  }

  const context: InsightContext = {
    contextType: 'Report',
    contextField: cell.fieldname || '',
    value: cell.rawValue,
    reportName,
    row,
  };

  return context;
}

/**
 * Build insight context from form field
 */
export function buildFormFieldContext(
  df: Field,
  value: unknown,
  doc?: Doc
): InsightContext | null {
  if (!isInsightEligible(df.fieldtype, value)) {
    return null;
  }

  // Determine context type based on doc schema
  let contextType = 'Account';
  if (doc?.schemaName === 'Customer') {
    contextType = 'Customer';
  } else if (doc?.schemaName === 'Vendor' || doc?.schemaName === 'Supplier') {
    contextType = 'Vendor';
  }

  const context: InsightContext = {
    contextType,
    contextField: df.fieldname,
    value,
    docName: doc?.name,
    schemaName: doc?.schemaName,
  };

  return context;
}

/**
 * Build context info for display in the dialog
 */
export function buildContextInfo(
  context: InsightContext
): { label: string; value: string } | null {
  if (!context) {
    return null;
  }

  let label = 'Value';
  const value = String(context.value);

  if (context.contextField) {
    label = context.contextField
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim();
    label = label.charAt(0).toUpperCase() + label.slice(1);
  }

  if (context.reportName && typeof context.reportName === 'string') {
    label = `${context.reportName} - ${label}`;
  }

  if (context.docName && typeof context.docName === 'string') {
    label = `${context.docName} - ${label}`;
  }

  return { label, value };
}
