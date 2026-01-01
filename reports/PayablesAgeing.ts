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

type AgeingBucket =
  | 'bucket0to30'
  | 'bucket31to60'
  | 'bucket61to90'
  | 'bucket90plus';

type AgeingRow = {
  party: string;
  gstin?: string;
  outstanding: number;
  bucket0to30: number;
  bucket31to60: number;
  bucket61to90: number;
  bucket90plus: number;
};

const CREDIT_DAYS = 30;

export class PayablesAgeing extends Report {
  static title = 'Payables Ageing';
  static reportName = 'payables-ageing';

  asOfDate?: string;
  loading = false;

  setDefaultFilters() {
    if (!this.asOfDate) {
      this.asOfDate = DateTime.local().toISODate();
    }
  }

  getActions(): Action[] {
    return getCommonExportActions(this);
  }

  getFilters(): Field[] {
    return [
      {
        fieldtype: 'Date',
        label: t`As on Date`,
        placeholder: t`As on Date`,
        fieldname: 'asOfDate',
      },
    ];
  }

  getColumns(): ColumnField[] {
    const columns: ColumnField[] = [
      { label: t`Vendor`, fieldtype: 'Data', fieldname: 'party', width: 2 },
    ];

    if (this.hasPartyGstin) {
      columns.push({
        label: t`GSTIN`,
        fieldtype: 'Data',
        fieldname: 'gstin',
        width: 1.5,
      });
    }

    columns.push(
      {
        label: t`Outstanding`,
        fieldtype: 'Currency',
        fieldname: 'outstanding',
      },
      {
        label: t`0-30`,
        fieldtype: 'Currency',
        fieldname: 'bucket0to30',
      },
      {
        label: t`31-60`,
        fieldtype: 'Currency',
        fieldname: 'bucket31to60',
      },
      {
        label: t`61-90`,
        fieldtype: 'Currency',
        fieldname: 'bucket61to90',
      },
      {
        label: t`90+`,
        fieldtype: 'Currency',
        fieldname: 'bucket90plus',
      }
    );

    return columns;
  }

  async setReportData(): Promise<void> {
    this.loading = true;

    const asOf = DateTime.fromISO(
      this.asOfDate ?? DateTime.local().toISODate(),
      { zone: 'utc' }
    ).endOf('day');

    const invoiceRows = await this.fyo.db.getAllRaw(
      ModelNameEnum.PurchaseInvoice,
      {
        fields: ['name', 'party', 'date', 'outstandingAmount'],
        filters: {
          submitted: true,
          cancelled: false,
          date: ['<=', asOf.toISO()],
        },
      }
    );

    const partyNames = Array.from(
      new Set(invoiceRows.map((r) => r.party as string).filter(Boolean))
    );

    const partyMap = await this.getPartyMap(partyNames);

    const acc: Record<string, AgeingRow> = {};

    for (const row of invoiceRows) {
      const party = row.party as string;
      if (!party) {
        continue;
      }

      const outstanding = safeParseFloat(row.outstandingAmount);
      if (outstanding <= 0) {
        continue;
      }

      const dt = DateTime.fromISO(String(row.date ?? ''), { zone: 'utc' });
      const ageDays = dt.isValid ? Math.floor(asOf.diff(dt, 'days').days) : 0;
      const overdueDays = Math.max(0, ageDays - CREDIT_DAYS);

      let bucket: AgeingBucket = 'bucket0to30';
      if (overdueDays > 90) {
        bucket = 'bucket90plus';
      } else if (overdueDays > 60) {
        bucket = 'bucket61to90';
      } else if (overdueDays > 30) {
        bucket = 'bucket31to60';
      }

      acc[party] ??= {
        party,
        gstin: partyMap[party]?.gstin,
        outstanding: 0,
        bucket0to30: 0,
        bucket31to60: 0,
        bucket61to90: 0,
        bucket90plus: 0,
      };

      acc[party].outstanding += outstanding;
      acc[party][bucket] += outstanding;
    }

    const rows = Object.values(acc).sort(
      (a, b) => b.outstanding - a.outstanding
    );

    this.reportData = this.getReportDataFromRows(rows);
    this.loading = false;
  }

  private get hasPartyGstin(): boolean {
    return !!this.fyo.schemaMap.Party?.fields?.some(
      (f) => f.fieldname === 'gstin'
    );
  }

  private async getPartyMap(partyNames: string[]) {
    if (!partyNames.length) {
      return {} as Record<string, { gstin?: string }>;
    }

    const fields = ['name'];
    if (this.hasPartyGstin) {
      fields.push('gstin');
    }

    const parties = await this.fyo.db.getAllRaw(ModelNameEnum.Party, {
      fields,
      filters: { name: ['in', partyNames] },
    });

    return parties.reduce((map, p) => {
      const name = p.name as string;
      map[name] = { gstin: p.gstin as string | undefined };
      return map;
    }, {} as Record<string, { gstin?: string }>);
  }

  private getReportDataFromRows(rows: AgeingRow[]): ReportData {
    const reportData: ReportData = [];

    for (const row of rows) {
      const reportRow: ReportRow = { cells: [] };

      for (const { fieldname, fieldtype, width } of this.columns) {
        const align = isNumeric(fieldtype) ? 'right' : 'left';
        const rawValue = row[fieldname as keyof AgeingRow];
        const value = this.fyo.format(rawValue ?? '', fieldtype);

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
}
