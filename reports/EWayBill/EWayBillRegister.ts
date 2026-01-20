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

type EWayBillRow = {
  name: string;
  invoiceNo: string;
  customer: string;
  invoiceDate: string;
  invoiceValue: number;
  ewayBillNo: string;
  vehicleNo: string;
  transportMode: string;
  distanceKm: number;
  ewayBillDate: string;
  validUpto: string;
  status: string;
};

export class EWayBillRegister extends Report {
  static title = 'E-Way Bill Register';
  static reportName = 'eway-bill-register';

  fromDate?: string;
  toDate?: string;
  customer?: string;
  status?: string;
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
        label: t`Customer`,
        placeholder: t`Customer`,
        fieldname: 'customer',
        target: 'Party',
      },
      {
        fieldtype: 'Select',
        label: t`Status`,
        placeholder: t`Status`,
        fieldname: 'status',
        options: [
          { label: t`All`, value: '' },
          { label: t`Draft`, value: 'Draft' },
          { label: t`Active`, value: 'Active' },
          { label: t`Cancelled`, value: 'Cancelled' },
          { label: t`Expired`, value: 'Expired' },
        ],
      },
    ];
  }

  getColumns(): ColumnField[] {
    return [
      {
        label: t`E-Way Bill No`,
        fieldtype: 'Data',
        fieldname: 'ewayBillNo',
        width: 1.2,
      },
      {
        label: t`Status`,
        fieldtype: 'Data',
        fieldname: 'status',
        width: 0.8,
      },
      {
        label: t`Invoice No`,
        fieldtype: 'Link',
        fieldname: 'invoiceNo',
        target: ModelNameEnum.SalesInvoice,
        width: 1,
      },
      {
        label: t`Customer`,
        fieldtype: 'Data',
        fieldname: 'customer',
        width: 1.5,
      },
      {
        label: t`Invoice Date`,
        fieldtype: 'Date',
        fieldname: 'invoiceDate',
        width: 1,
      },
      {
        label: t`Invoice Value`,
        fieldtype: 'Currency',
        fieldname: 'invoiceValue',
        width: 1.2,
      },
      {
        label: t`Transport Mode`,
        fieldtype: 'Data',
        fieldname: 'transportMode',
        width: 1,
      },
      {
        label: t`Vehicle No`,
        fieldtype: 'Data',
        fieldname: 'vehicleNo',
        width: 1,
      },
      {
        label: t`Distance (KM)`,
        fieldtype: 'Int',
        fieldname: 'distanceKm',
        width: 0.8,
      },
      {
        label: t`Valid Upto`,
        fieldtype: 'Date',
        fieldname: 'validUpto',
        width: 1,
      },
    ];
  }

  async setReportData(): Promise<void> {
    this.loading = true;

    const rows = await this.getEWayBillData();
    this.reportData = this.getReportDataFromRows(rows);

    this.loading = false;
  }

  private async getEWayBillData(): Promise<EWayBillRow[]> {
    const filters: QueryFilter = {};

    if (this.fromDate) {
      filters.invoiceDate = ['>=', this.fromDate];
    }

    if (this.toDate) {
      filters.invoiceDate = filters.invoiceDate
        ? [...(filters.invoiceDate as string[]), '<=', this.toDate]
        : ['<=', this.toDate];
    }

    if (this.status) {
      filters.status = this.status;
    }

    // Get all E-Way Bills
    const ewayBills = await this.fyo.db.getAll(ModelNameEnum.EWayBill, {
      filters,
      fields: [
        'name',
        'salesInvoice',
        'invoiceNo',
        'invoiceDate',
        'invoiceValue',
        'ewayBillNo',
        'vehicleNo',
        'transportMode',
        'distanceKm',
        'ewayBillDate',
        'validUpto',
        'status',
      ],
      orderBy: 'invoiceDate',
      order: 'desc',
    });

    const rows: EWayBillRow[] = [];

    for (const ewayBill of ewayBills) {
      // Get customer name from invoice
      let customerName = '';
      if (ewayBill.salesInvoice) {
        try {
          const invoice = await this.fyo.doc.getDoc(
            ModelNameEnum.SalesInvoice,
            ewayBill.salesInvoice as string
          );
          customerName = (invoice.party as string) || '';

          // Filter by customer if specified
          if (this.customer && customerName !== this.customer) {
            continue;
          }
        } catch (error) {
          console.warn('Could not fetch invoice:', error);
        }
      }

      rows.push({
        name: ewayBill.name as string,
        invoiceNo: (ewayBill.invoiceNo as string) || '',
        customer: customerName,
        invoiceDate: (ewayBill.invoiceDate as string) || '',
        invoiceValue: ewayBill.invoiceValue instanceof Money ? ewayBill.invoiceValue.float : (ewayBill.invoiceValue as number) || 0,
        ewayBillNo: (ewayBill.ewayBillNo as string) || '',
        vehicleNo: (ewayBill.vehicleNo as string) || '',
        transportMode: (ewayBill.transportMode as string) || '',
        distanceKm: (ewayBill.distanceKm as number) || 0,
        ewayBillDate: (ewayBill.ewayBillDate as string) || '',
        validUpto: (ewayBill.validUpto as string) || '',
        status: (ewayBill.status as string) || 'Draft',
      });
    }

    return rows;
  }

  private getReportDataFromRows(rows: EWayBillRow[]): ReportData {
    const reportData: ReportData = [];

    for (const row of rows) {
      const reportRow: ReportRow = { cells: [] };

      for (const { fieldname, fieldtype, width } of this.columns) {
        const align = isNumeric(fieldtype) ? 'right' : 'left';
        const value = row[fieldname as keyof EWayBillRow];

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

    return reportData;
  }
}
