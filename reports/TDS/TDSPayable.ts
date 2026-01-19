import { t } from 'fyo';
import { Action } from 'fyo/model/types';
import { DateTime } from 'luxon';
import { Money } from 'pesa';
import { ModelNameEnum } from 'models/types';
import getCommonExportActions from 'reports/commonExporter';
import { Report } from 'reports/Report';
import { ColumnField, ReportData, ReportRow } from 'reports/types';
import { Field } from 'schemas/types';
import { isNumeric } from 'src/utils';
import { QueryFilter } from 'utils/db/types';

type TDSPayableRow = {
  date: string;
  invoice: string;
  party: string;
  tdsSection: string;
  grossAmount: number;
  tdsRate: number;
  tdsAmount: number;
  netPayable: number;
};

export class TDSPayable extends Report {
  static title = 'TDS Payable';
  static reportName = 'tds-payable';

  fromDate?: string;
  toDate?: string;
  party?: string;
  tdsSection?: string;
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
      {
        fieldtype: 'Link',
        label: t`Party`,
        placeholder: t`Party`,
        fieldname: 'party',
        target: 'Party',
      },
      {
        fieldtype: 'Link',
        label: t`TDS Section`,
        placeholder: t`TDS Section`,
        fieldname: 'tdsSection',
        target: 'TDSSection',
      },
    ];
  }

  getColumns(): ColumnField[] {
    return [
      {
        label: t`Date`,
        fieldtype: 'Date',
        fieldname: 'date',
        width: 1,
      },
      {
        label: t`Invoice`,
        fieldtype: 'Link',
        fieldname: 'invoice',
        width: 1.2,
      },
      {
        label: t`Party`,
        fieldtype: 'Link',
        fieldname: 'party',
        width: 1.5,
      },
      {
        label: t`TDS Section`,
        fieldtype: 'Data',
        fieldname: 'tdsSection',
        width: 1,
      },
      {
        label: t`Gross Amount`,
        fieldtype: 'Currency',
        fieldname: 'grossAmount',
        width: 1.2,
      },
      {
        label: t`TDS Rate (%)`,
        fieldtype: 'Float',
        fieldname: 'tdsRate',
        width: 1,
      },
      {
        label: t`TDS Amount`,
        fieldtype: 'Currency',
        fieldname: 'tdsAmount',
        width: 1.2,
      },
      {
        label: t`Net Payable`,
        fieldtype: 'Currency',
        fieldname: 'netPayable',
        width: 1.2,
      },
    ];
  }

  async setReportData(): Promise<void> {
    this.loading = true;

    const rows = await this.getTDSPayableData();
    this.reportData = this.getReportDataFromRows(rows);

    this.loading = false;
  }

  private async getTDSPayableData(): Promise<TDSPayableRow[]> {
    const filters: QueryFilter = {
      submitted: true,
      cancelled: false,
    };

    if (this.fromDate) {
      filters.date = ['>=', this.fromDate];
    }

    if (this.toDate) {
      filters.date = filters.date
        ? [...(filters.date as string[]), '<=', this.toDate]
        : ['<=', this.toDate];
    }

    if (this.party) {
      filters.party = this.party;
    }

    // Get all purchase invoices
    const purchaseInvoices = await this.fyo.db.getAll(
      ModelNameEnum.PurchaseInvoice,
      {
        filters,
        fields: ['name', 'date', 'party', 'baseGrandTotal'],
        orderBy: 'date',
      }
    );

    const rows: TDSPayableRow[] = [];

    for (const invoice of purchaseInvoices) {
      // Get purchase invoice doc to use its regional logic
      const pi = (await this.fyo.doc.getDoc(
        ModelNameEnum.PurchaseInvoice,
        invoice.name as string
      )) as any;

      const tdsDetails = await pi.calculateTDS();

      // Skip if no TDS was deducted
      if (tdsDetails.tdsAmount.isZero()) {
        continue;
      }

      // Filter by TDS Section if specified
      if (this.tdsSection && tdsDetails.tdsSection !== this.tdsSection) {
        continue;
      }

      // If it's a return, TDS amount is reversed
      const tdsAmount = pi.isReturn
        ? -(tdsDetails.tdsAmount instanceof Money ? tdsDetails.tdsAmount.float : tdsDetails.tdsAmount)
        : (tdsDetails.tdsAmount instanceof Money ? tdsDetails.tdsAmount.float : tdsDetails.tdsAmount);

      const grossAmount = pi.baseGrandTotal instanceof Money ? pi.baseGrandTotal.float : pi.baseGrandTotal;
      const netPayable = grossAmount - tdsAmount;

      rows.push({
        date: pi.date,
        invoice: pi.name,
        party: pi.party,
        tdsSection: tdsDetails.tdsSection || '',
        grossAmount,
        tdsRate: tdsDetails.tdsRate,
        tdsAmount,
        netPayable,
      });
    }

    return rows;
  }

  private getReportDataFromRows(rows: TDSPayableRow[]): ReportData {
    const reportData: ReportData = [];

    for (const row of rows) {
      const reportRow: ReportRow = { cells: [] };

      for (const { fieldname, fieldtype, width } of this.columns) {
        const align = isNumeric(fieldtype) ? 'right' : 'left';
        const value = row[fieldname as keyof TDSPayableRow];

        let rawValue: string | number | null = null;
        if (typeof value === 'number') {
          rawValue = this.fyo.format(value, fieldtype);
        } else if (typeof value === 'string') {
          rawValue = value;
        }

        reportRow.cells.push({
          rawValue: value ?? '',
          value: rawValue,
          align,
          width: width ?? 1,
        });
      }

      reportData.push(reportRow);
    }

    // Add total row
    if (rows.length > 0) {
      const totalGross = rows.reduce((sum, row) => sum + row.grossAmount, 0);
      const totalTDS = rows.reduce((sum, row) => sum + row.tdsAmount, 0);
      const totalNet = rows.reduce((sum, row) => sum + row.netPayable, 0);

      const totalRow: ReportRow = { cells: [] };
      for (const { fieldname, fieldtype, width } of this.columns) {
        const align = isNumeric(fieldtype) ? 'right' : 'left';
        let value: string | number = '';

        if (fieldname === 'date') {
          value = t`Total`;
        } else if (fieldname === 'grossAmount') {
          value = this.fyo.format(totalGross, fieldtype);
        } else if (fieldname === 'tdsAmount') {
          value = this.fyo.format(totalTDS, fieldtype);
        } else if (fieldname === 'netPayable') {
          value = this.fyo.format(totalNet, fieldtype);
        }

        totalRow.cells.push({
          rawValue: value,
          value,
          align,
          width: width ?? 1,
          bold: true,
        });
      }

      reportData.push(totalRow);
    }

    return reportData;
  }
}
