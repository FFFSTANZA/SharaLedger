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
  transportDocNo: string;
  transportDocDate: string;
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
      // Show more data by default in demo
      this.fromDate = DateTime.local()
        .minus({ months: 6 })
        .startOf('month')
        .toISODate();
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
        label: t`E-Way Bill Date`,
        fieldtype: 'Date',
        fieldname: 'ewayBillDate',
        width: 1,
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
        label: t`Vehicle No / Doc No`,
        fieldtype: 'Data',
        fieldname: 'vehicleNoOrDocNo',
        width: 1.2,
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
        'transportDocNo',
        'transportDocDate',
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

    // Pre-fetch some invoices if possible or just fetch as we go but handle missing invoice date
    for (const ewayBill of ewayBills) {
      let customerName = '';

      // If we have the invoice name but it's not the same as invoiceNo field, or just to be sure
      const invoiceId =
        (ewayBill.salesInvoice as string) || (ewayBill.invoiceNo as string);

      if (invoiceId) {
        try {
          const invoice = await this.fyo.doc.getDoc(
            ModelNameEnum.SalesInvoice,
            invoiceId
          );
          customerName = (invoice.party as string) || '';

          // Filter by customer if specified
          if (this.customer && customerName !== this.customer) {
            continue;
          }

          // Fallback if record fields are empty - but don't override if they exist
          if (!ewayBill.invoiceNo) {
            ewayBill.invoiceNo = invoice.name;
          }
          if (!ewayBill.invoiceDate) {
            // Convert to Date object if needed
            if (invoice.date instanceof Date) {
              ewayBill.invoiceDate = invoice.date;
            } else if (typeof invoice.date === 'string') {
              ewayBill.invoiceDate = new Date(invoice.date);
            } else if ((invoice.date as any)?.toJSDate) {
              ewayBill.invoiceDate = (invoice.date as any).toJSDate();
            }
          }
          if (
            !ewayBill.invoiceValue ||
            ((ewayBill.invoiceValue as any).isZero &&
              (ewayBill.invoiceValue as any).isZero()) ||
            (typeof ewayBill.invoiceValue === 'number' &&
              ewayBill.invoiceValue === 0)
          ) {
            ewayBill.invoiceValue =
              invoice.baseGrandTotal || invoice.grandTotal;
          }
        } catch (error) {
          // If invoice not found, we still show the E-Way Bill but with what we have
          console.warn(`Could not fetch invoice ${invoiceId}:`, error);
        }
      }

      // Convert dates to strings for display
      const formatDate = (date: any): string => {
        if (!date) return '';
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        if (typeof date === 'string') {
          return date.split('T')[0];
        }
        if (date?.toISODate) {
          return date.toISODate();
        }
        return '';
      };

      rows.push({
        name: ewayBill.name as string,
        invoiceNo: (ewayBill.invoiceNo as string) || '',
        customer: customerName,
        invoiceDate: formatDate(ewayBill.invoiceDate),
        invoiceValue:
          ewayBill.invoiceValue instanceof Money
            ? ewayBill.invoiceValue.float
            : (ewayBill.invoiceValue as number) || 0,
        ewayBillNo: (ewayBill.ewayBillNo as string) || '',
        vehicleNo: (ewayBill.vehicleNo as string) || '',
        transportDocNo: (ewayBill.transportDocNo as string) || '',
        transportDocDate: formatDate(ewayBill.transportDocDate),
        transportMode: (ewayBill.transportMode as string) || '',
        distanceKm: (ewayBill.distanceKm as number) || 0,
        ewayBillDate: formatDate(ewayBill.ewayBillDate),
        validUpto: formatDate(ewayBill.validUpto),
        status: (ewayBill.status as string) || 'Draft',
      });
    }

    return rows;
  }

  private getReportDataFromRows(rows: EWayBillRow[]): ReportData {
    const reportData: ReportData = [];

    for (const row of rows) {
      const reportRow: ReportRow = { cells: [] };
      const rowExtended = {
        ...row,
        vehicleNoOrDocNo:
          row.transportMode === 'Road' ? row.vehicleNo : row.transportDocNo,
      };

      for (const { fieldname, fieldtype, width } of this.columns) {
        const align = isNumeric(fieldtype) ? 'right' : 'left';
        const value = rowExtended[fieldname as keyof typeof rowExtended];

        let rawValue: string | number | null = null;
        if (typeof value === 'number') {
          rawValue = this.fyo.format(value, fieldtype);
        } else if (typeof value === 'string' && value) {
          // If it looks like an ISO date and the fieldtype is Date, format it
          if (fieldtype === 'Date' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            rawValue = this.fyo.format(value, 'Date');
          } else {
            rawValue = value;
          }
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
