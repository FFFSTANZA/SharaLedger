import { t } from 'fyo';
import { Action } from 'fyo/model/types';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';
import getCommonExportActions from 'reports/commonExporter';
import { Report } from 'reports/Report';
import { ColumnField, ReportData, ReportRow } from 'reports/types';
import { Field } from 'schemas/types';
import { isNumeric } from 'src/utils';
import { QueryFilter } from 'utils/db/types';

type TDSSummaryRow = {
  party: string;
  tdsSection: string;
  invoiceCount: number;
  totalGrossAmount: number;
  totalTDSAmount: number;
  totalNetPayable: number;
};

export class TDSSummary extends Report {
  static title = 'TDS Summary (Vendor-wise)';
  static reportName = 'tds-summary';

  fromDate?: string;
  toDate?: string;
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
        label: t`Party`,
        fieldtype: 'Link',
        fieldname: 'party',
        width: 2,
      },
      {
        label: t`TDS Section`,
        fieldtype: 'Data',
        fieldname: 'tdsSection',
        width: 1.2,
      },
      {
        label: t`Invoice Count`,
        fieldtype: 'Int',
        fieldname: 'invoiceCount',
        width: 1,
      },
      {
        label: t`Total Gross Amount`,
        fieldtype: 'Currency',
        fieldname: 'totalGrossAmount',
        width: 1.5,
      },
      {
        label: t`Total TDS Amount`,
        fieldtype: 'Currency',
        fieldname: 'totalTDSAmount',
        width: 1.5,
      },
      {
        label: t`Total Net Payable`,
        fieldtype: 'Currency',
        fieldname: 'totalNetPayable',
        width: 1.5,
      },
    ];
  }

  async setReportData(): Promise<void> {
    this.loading = true;

    const rows = await this.getTDSSummaryData();
    this.reportData = this.getReportDataFromRows(rows);

    this.loading = false;
  }

  private async getTDSSummaryData(): Promise<TDSSummaryRow[]> {
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

    // Get all purchase invoices
    const purchaseInvoices = await this.fyo.db.getAll(
      ModelNameEnum.PurchaseInvoice,
      {
        filters,
        fields: ['name', 'date', 'party', 'baseGrandTotal'],
        orderBy: 'party',
      }
    );

    // Group by party and TDS section
    const summaryMap = new Map<
      string,
      {
        party: string;
        tdsSection: string;
        invoiceCount: number;
        totalGrossAmount: number;
        totalTDSAmount: number;
      }
    >();

    for (const invoice of purchaseInvoices) {
      // Get party details
      const party = await this.fyo.doc.getDoc(
        ModelNameEnum.Party,
        invoice.party as string
      );

      const tdsApplicable = party.get('tdsApplicable') as boolean;
      const tdsCategory = party.get('tdsCategory') as string | undefined;
      const panAvailable = (party.get('panAvailable') as boolean) ?? true;

      if (!tdsApplicable || !tdsCategory) {
        continue;
      }

      // Get TDS Category
      const tdsCategoryDoc = await this.fyo.doc.getDoc(
        'TDSCategory',
        tdsCategory
      );
      const tdsSectionName = tdsCategoryDoc.get('tdsSection') as
        | string
        | undefined;

      if (!tdsSectionName) {
        continue;
      }

      // Filter by TDS Section if specified
      if (this.tdsSection && tdsSectionName !== this.tdsSection) {
        continue;
      }

      // Get TDS Section
      const tdsSection = await this.fyo.doc.getDoc(
        'TDSSection',
        tdsSectionName
      );

      const isActive = tdsSection.get('isActive') as boolean;
      if (!isActive) {
        continue;
      }

      const rate = panAvailable
        ? (tdsSection.get('rate') as number)
        : (tdsSection.get('rateWithoutPan') as number);

      const grossAmount = invoice.baseGrandTotal as number;

      // Check threshold
      const threshold = tdsSection.get('threshold') as number | undefined;
      if (threshold && grossAmount < threshold) {
        continue;
      }

      const tdsAmount = (grossAmount * rate) / 100;

      const partyName = invoice.party as string;
      const key = `${partyName}-${tdsSectionName}`;

      if (summaryMap.has(key)) {
        const existing = summaryMap.get(key)!;
        existing.invoiceCount++;
        existing.totalGrossAmount += grossAmount;
        existing.totalTDSAmount += tdsAmount;
      } else {
        summaryMap.set(key, {
          party: invoice.party as string,
          tdsSection: tdsSectionName,
          invoiceCount: 1,
          totalGrossAmount: grossAmount,
          totalTDSAmount: tdsAmount,
        });
      }
    }

    // Convert map to array
    const rows: TDSSummaryRow[] = Array.from(summaryMap.values()).map(
      (item) => ({
        ...item,
        totalNetPayable: item.totalGrossAmount - item.totalTDSAmount,
      })
    );

    return rows;
  }

  private getReportDataFromRows(rows: TDSSummaryRow[]): ReportData {
    const reportData: ReportData = [];

    for (const row of rows) {
      const reportRow: ReportRow = { cells: [] };

      for (const { fieldname, fieldtype, width } of this.columns) {
        const align = isNumeric(fieldtype) ? 'right' : 'left';
        const value = row[fieldname as keyof TDSSummaryRow];

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
      const totalInvoices = rows.reduce(
        (sum, row) => sum + row.invoiceCount,
        0
      );
      const totalGross = rows.reduce(
        (sum, row) => sum + row.totalGrossAmount,
        0
      );
      const totalTDS = rows.reduce((sum, row) => sum + row.totalTDSAmount, 0);
      const totalNet = rows.reduce((sum, row) => sum + row.totalNetPayable, 0);

      const totalRow: ReportRow = { cells: [] };
      for (const { fieldname, fieldtype, width } of this.columns) {
        const align = isNumeric(fieldtype) ? 'right' : 'left';
        let value: string | number = '';

        if (fieldname === 'party') {
          value = t`Total`;
        } else if (fieldname === 'invoiceCount') {
          value = this.fyo.format(totalInvoices, fieldtype);
        } else if (fieldname === 'totalGrossAmount') {
          value = this.fyo.format(totalGross, fieldtype);
        } else if (fieldname === 'totalTDSAmount') {
          value = this.fyo.format(totalTDS, fieldtype);
        } else if (fieldname === 'totalNetPayable') {
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
