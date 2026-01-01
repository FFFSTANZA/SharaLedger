import { t } from 'fyo';
import { Action } from 'fyo/model/types';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';
import getCommonExportActions from 'reports/commonExporter';
import { Report } from 'reports/Report';
import { ColumnField, ReportData, ReportRow } from 'reports/types';
import { Field } from 'schemas/types';
import { isNumeric } from 'src/utils';
import { safeParseFloat } from 'utils';
import type { QueryFilter } from 'utils/db/types';

type Gst3bSummaryRow = {
  section: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalTax: number;
};

type GstTotals = {
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
};

export class GSTR3B extends Report {
  static title = 'GSTR3B';
  static reportName = 'gstr-3b';

  fromDate?: string;
  toDate?: string;
  loading = false;

  setDefaultFilters() {
    if (!this.toDate) {
      this.toDate = DateTime.local().toISODate();
    }

    if (!this.fromDate) {
      this.fromDate = DateTime.local().startOf('month').toISODate();
    }
  }

  getActions(): Action[] {
    return getCommonExportActions(this);
  }

  getFilters(): Field[] {
    return [
      {
        fieldtype: 'Date',
        label: t`From Date`,
        placeholder: t`From Date`,
        fieldname: 'fromDate',
      },
      {
        fieldtype: 'Date',
        label: t`To Date`,
        placeholder: t`To Date`,
        fieldname: 'toDate',
      },
    ];
  }

  getColumns(): ColumnField[] {
    return [
      {
        label: t`Section`,
        fieldtype: 'Data',
        fieldname: 'section',
        width: 2.5,
      },
      {
        label: t`Taxable Value`,
        fieldtype: 'Currency',
        fieldname: 'taxableValue',
      },
      {
        label: t`IGST`,
        fieldtype: 'Currency',
        fieldname: 'igst',
      },
      {
        label: t`CGST`,
        fieldtype: 'Currency',
        fieldname: 'cgst',
      },
      {
        label: t`SGST`,
        fieldtype: 'Currency',
        fieldname: 'sgst',
      },
      {
        label: t`Total Tax`,
        fieldtype: 'Currency',
        fieldname: 'totalTax',
      },
    ];
  }

  async setReportData(): Promise<void> {
    this.loading = true;

    const [outward, inward] = await Promise.all([
      this.getTotalsForInvoices(ModelNameEnum.SalesInvoice),
      this.getTotalsForInvoices(ModelNameEnum.PurchaseInvoice),
    ]);

    const outwardRow: Gst3bSummaryRow = {
      section: t`Outward Supplies (Sales)`,
      ...outward,
      totalTax: outward.igst + outward.cgst + outward.sgst,
    };

    const inwardRow: Gst3bSummaryRow = {
      section: t`Inward Supplies (Purchases)`,
      ...inward,
      totalTax: inward.igst + inward.cgst + inward.sgst,
    };

    const netRow: Gst3bSummaryRow = {
      section: t`Net GST (Sales - Purchases)`,
      taxableValue: outward.taxableValue - inward.taxableValue,
      igst: outward.igst - inward.igst,
      cgst: outward.cgst - inward.cgst,
      sgst: outward.sgst - inward.sgst,
      totalTax:
        outward.igst +
        outward.cgst +
        outward.sgst -
        (inward.igst + inward.cgst + inward.sgst),
    };

    const rows = [outwardRow, inwardRow, netRow];
    this.reportData = this.getReportDataFromRows(rows);

    this.loading = false;
  }

  private getReportDataFromRows(rows: Gst3bSummaryRow[]): ReportData {
    const reportData: ReportData = [];

    for (const row of rows) {
      const reportRow: ReportRow = { cells: [] };

      for (const { fieldname, fieldtype, width } of this.columns) {
        const align = isNumeric(fieldtype) ? 'right' : 'left';
        const rawValue = row[fieldname as keyof Gst3bSummaryRow];
        const value =
          rawValue === undefined ? '' : this.fyo.format(rawValue, fieldtype);

        reportRow.cells.push({
          align,
          rawValue,
          value,
          width: width ?? 1,
        });
      }

      reportData.push(reportRow);
    }

    return reportData;
  }

  private async getTotalsForInvoices(
    schemaName: ModelNameEnum
  ): Promise<GstTotals> {
    const date: string[] = [];

    if (this.toDate) {
      date.push('<=', this.toDate);
    }

    if (this.fromDate) {
      date.push('>=', this.fromDate);
    }

    const filters: QueryFilter = {
      submitted: true,
      cancelled: false,
    };

    if (date.length) {
      filters.date = date;
    }

    const invoiceRows = await this.fyo.db.getAllRaw(schemaName, {
      fields: ['name', 'netTotal'],
      filters,
    });

    const invoiceNames = invoiceRows
      .map((r) => r.name as string)
      .filter((n) => typeof n === 'string' && n.length);

    const taxableValue = invoiceRows.reduce((sum, row) => {
      return sum + safeParseFloat(row.netTotal);
    }, 0);

    let igst = 0;
    let cgst = 0;
    let sgst = 0;

    if (invoiceNames.length) {
      const taxes = await this.fyo.db.getAllRaw(ModelNameEnum.TaxSummary, {
        fields: ['account', 'amount'],
        filters: {
          parent: ['in', invoiceNames],
          parentSchemaName: schemaName,
        },
      });

      for (const tax of taxes) {
        const amount = safeParseFloat(tax.amount);
        const account = tax.account as string;

        if (account === 'IGST') {
          igst += amount;
        } else if (account === 'CGST') {
          cgst += amount;
        } else if (account === 'SGST') {
          sgst += amount;
        }
      }
    }

    return { taxableValue, igst, cgst, sgst };
  }
}
