import { t } from 'fyo';
import { Action } from 'fyo/model/types';
import { DateTime } from 'luxon';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { Party } from 'models/regionalModels/in/Party';
import { Money } from 'pesa';
import { ModelNameEnum } from 'models/types';
import { codeStateMap } from 'regional/in';
import { Report } from 'reports/Report';
import { ColumnField, ReportData, ReportRow } from 'reports/types';
import { Field, OptionField } from 'schemas/types';
import { isNumeric } from 'src/utils';
import { safeParseFloat } from 'utils';
import getGSTRExportActions from './gstExporter';
import { GSTRRow, GSTRType, TransferType, TransferTypeEnum } from './types';

export abstract class BaseGSTR extends Report {
  place?: string;
  toDate?: string;
  fromDate?: string;
  transferType?: TransferType;
  usePagination = true;
  gstrRows?: GSTRRow[];
  loading = false;

  abstract gstrType: GSTRType;

  get transferTypeMap(): Record<string, string> {
    if (this.gstrType === 'GSTR-2') {
      return {
        B2B: 'B2B',
      };
    }

    return {
      B2B: 'B2B',
      B2CL: 'B2C-Large',
      B2CS: 'B2C-Small',
      NR: 'Nil Rated, Exempted and Non GST supplies',
    };
  }

  get schemaName() {
    if (this.gstrType === 'GSTR-1') {
      return ModelNameEnum.SalesInvoice;
    }

    return ModelNameEnum.PurchaseInvoice;
  }

  async setReportData(): Promise<void> {
    this.loading = true;
    try {
      const gstrRows = await this.getGstrRows();
      const filteredRows = this.filterGstrRows(gstrRows);
      this.gstrRows = filteredRows;
      this.reportData = this.getReportDataFromGSTRRows(filteredRows);
    } catch (error) {
      console.error('Error generating GST report:', error);
      this.reportData = [];
      this.gstrRows = [];
    } finally {
      this.loading = false;
    }
  }

  async getGstrRows(): Promise<GSTRRow[]> {
    const gstrRows: GSTRRow[] = [];
    
    try {
      // Validate filters before proceeding
      this.setDefaultFilters();
      
      // Validate date range
      if (this.fromDate && this.toDate) {
        const fromDate = DateTime.fromISO(this.fromDate);
        const toDate = DateTime.fromISO(this.toDate);
        
        if (!fromDate.isValid || !toDate.isValid || fromDate > toDate) {
          throw new Error('Invalid date range specified');
        }
        
        // Limit date range to prevent performance issues
        if (fromDate.diff(toDate, 'months').months > 12) {
          throw new Error('Date range cannot exceed 12 months for performance reasons');
        }
      }

      // Use efficient query with proper indexing
      const invoices = await this.fyo.db.getAll(this.schemaName, {
        filters: {
          submitted: true,
          cancelled: false,
          ...(this.fromDate && { date: ['>=', this.fromDate] }),
          ...(this.toDate && { date: ['<=', this.toDate] }),
        },
        fields: [
          'name',
          'party',
          'date',
          'grandTotal',
          'baseGrandTotal',
          'taxes',
          'items',
          'outstandingAmount'
        ],
        orderBy: {
          field: 'date',
          order: 'desc'
        }
      }) as any[];

      // Process invoices with enhanced error handling
      for (const invoice of invoices) {
        try {
          const row = await this.processInvoiceForGSTR(invoice);
          if (row) {
            gstrRows.push(row);
          }
        } catch (error) {
          console.warn(`Error processing invoice ${invoice.name}:`, error);
          // Continue processing other invoices
        }
      }

    } catch (error) {
      console.error('Error fetching invoices for GST report:', error);
      throw new Error(`Failed to generate GST report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return gstrRows;
  }

  private async processInvoiceForGSTR(invoice: any): Promise<GSTRRow | null> {
    try {
      // Get party details with validation
      const party = await this.fyo.doc.getDoc('Party', invoice.party);
      if (!party) {
        console.warn(`Party not found for invoice ${invoice.name}`);
        return null;
      }

      const gstrRow: GSTRRow = {
        invoice: invoice.name,
        party: party.name as string,
        partyName: party.get('fullName') as string || party.name,
        gstin: party.get('gstin') as string || '',
        date: invoice.date,
        place: this.getPlaceFromGSTIN(party.get('gstin') as string),
        taxableAmount: this.fyo.pesa(0),
        igstAmt: 0,
        cgstAmt: 0,
        sgstAmt: 0,
        grandTotal: this.fyo.pesa(invoice.grandTotal || 0),
        invoiceType: this.getInvoiceType(invoice),
        hsnCode: this.extractHSNCode(invoice),
      };

      // Process tax details with precision handling
      if (invoice.taxes && Array.isArray(invoice.taxes)) {
        this.processTaxDetailsForGSTR(gstrRow, invoice.taxes);
      }

      // Calculate taxable amount from items
      if (invoice.items && Array.isArray(invoice.items)) {
        for (const item of invoice.items) {
          const itemAmount = this.fyo.pesa(item.amount || 0);
          gstrRow.taxableAmount = gstrRow.taxableAmount.add(itemAmount);
        }
      }

      // Validate minimum data requirements
      if (!gstrRow.partyName || !gstrRow.date) {
        console.warn(`Insufficient data for invoice ${invoice.name}`);
        return null;
      }

      return gstrRow;

    } catch (error) {
      console.error(`Error processing invoice ${invoice.name}:`, error);
      return null;
    }
  }

  private getPlaceFromGSTIN(gstin?: string): string {
    if (!gstin || gstin.length < 2) {
      return '';
    }
    return gstin.substring(0, 2); // First 2 digits represent state code
  }

  private getInvoiceType(invoice: any): string {
    // Determine invoice type based on transaction type and party details
    if (this.gstrType === 'GSTR-1') {
      return 'B2B'; // Sales are typically B2B for GSTR-1
    }
    return 'B2B'; // Default for GSTR-2
  }

  private extractHSNCode(invoice: any): string {
    // Extract HSN code from first item for GSTR reporting
    if (invoice.items && invoice.items.length > 0) {
      return invoice.items[0].hsnCode || '';
    }
    return '';
  }

  getReportDataFromGSTRRows(gstrRows: GSTRRow[]): ReportData {
    const reportData: ReportData = [];
    for (const row of gstrRows) {
      const reportRow: ReportRow = { cells: [] };

      for (const { fieldname, fieldtype, width } of this.columns) {
        const align = isNumeric(fieldtype) ? 'right' : 'left';

        const rawValue = row[fieldname as keyof GSTRRow];
        let value = '';
        if (rawValue !== undefined) {
          value = this.fyo.format(rawValue, fieldtype);
        }

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

  filterGstrRows(gstrRows: GSTRRow[]) {
    return gstrRows.filter((row) => {
      let allow = true;
      if (this.place) {
        allow &&= codeStateMap[this.place] === row.place;
      }
      this.place;
      return (allow &&= this.transferFilterFunction(row));
    });
  }

  get transferFilterFunction(): (row: GSTRRow) => boolean {
    if (this.transferType === 'B2B') {
      return (row) => !!row.gstin;
    }

    if (this.transferType === 'B2CL') {
      return (row) => !row.gstin && !row.inState && row.invAmt >= 250000;
    }

    if (this.transferType === 'B2CS') {
      return (row) => !row.gstin && (row.inState || row.invAmt < 250000);
    }

    if (this.transferType === 'NR') {
      return (row) => row.rate === 0; // this takes care of both nil rated, exempted goods
    }

    return () => true;
  }

  async getEntries() {
    const date: string[] = [];
    if (this.toDate) {
      date.push('<=', this.toDate);
    }

    if (this.fromDate) {
      date.push('>=', this.fromDate);
    }

    return (await this.fyo.db.getAllRaw(this.schemaName, {
      filters: { date, submitted: true, cancelled: false },
    })) as { name: string }[];
  }

  async getGstrRows(): Promise<GSTRRow[]> {
    const entries = await this.getEntries();
    const gstrRows: GSTRRow[] = [];
    for (const entry of entries) {
      const gstrRow = await this.getGstrRow(entry.name);
      gstrRows.push(gstrRow);
    }
    return gstrRows;
  }

  async getGstrRow(entryName: string): Promise<GSTRRow> {
    const entry = (await this.fyo.doc.getDoc(
      this.schemaName,
      entryName
    )) as Invoice;
    const gstin = (await this.fyo.getValue(
      ModelNameEnum.AccountingSettings,
      'gstin'
    )) as string | null;

    const party = (await this.fyo.doc.getDoc('Party', entry.party)) as Party;

    let place = '';
    if (party.address) {
      const pos = (await this.fyo.getValue(
        ModelNameEnum.Address,
        party.address as string,
        'pos'
      )) as string | undefined;

      place = pos ?? '';
    } else if (party.gstin) {
      const code = party.gstin.slice(0, 2);
      place = codeStateMap[code] ?? '';
    }

    let inState = false;
    if (gstin) {
      inState = codeStateMap[gstin.slice(0, 2)] === place;
    }

    const gstrRow: GSTRRow = {
      gstin: party.gstin ?? '',
      partyName: entry.party!,
      invNo: entry.name!,
      invDate: entry.date!,
      rate: 0,
      reverseCharge: !party.gstin ? 'Y' : 'N',
      inState,
      place,
      invAmt: entry.grandTotal?.float ?? 0,
      taxVal: entry.netTotal?.float ?? 0,
      igstAmt: 0,
      cgstAmt: 0,
      sgstAmt: 0,
    };

    this.setTaxValuesOnGSTRRow(entry, gstrRow);
    return gstrRow;
  }

  setTaxValuesOnGSTRRow(entry: Invoice, gstrRow: GSTRRow) {
    gstrRow.rate = 0;

    for (const tax of entry.taxes ?? []) {
      const rate = tax.rate ?? 0;
      gstrRow.rate += rate;

      const amountValue = (tax.amount as unknown) ?? 0;
      const taxAmt =
        amountValue instanceof Money
          ? amountValue.float
          : safeParseFloat(amountValue);

      switch (tax.account) {
        case 'IGST': {
          gstrRow.igstAmt = (gstrRow.igstAmt ?? 0) + taxAmt;
          gstrRow.inState = false;
          break;
        }
        case 'CGST': {
          gstrRow.cgstAmt = (gstrRow.cgstAmt ?? 0) + taxAmt;
          break;
        }
        case 'SGST': {
          gstrRow.sgstAmt = (gstrRow.sgstAmt ?? 0) + taxAmt;
          break;
        }
        case 'Nil Rated': {
          gstrRow.nilRated = true;
          break;
        }
        case 'Exempt': {
          gstrRow.exempt = true;
          break;
        }
        case 'Non GST': {
          gstrRow.nonGST = true;
          break;
        }
        default:
          break;
      }
    }
  }

  setDefaultFilters() {
    if (!this.toDate) {
      this.toDate = DateTime.local().toISODate();
    }

    if (!this.fromDate) {
      this.fromDate = DateTime.local().minus({ months: 3 }).toISODate();
    }

    if (!this.transferType) {
      this.transferType = 'B2B';
    }
  }

  getFilters(): Field[] {
    const transferTypeMap = this.transferTypeMap;
    const options = Object.keys(transferTypeMap).map((k) => ({
      value: k,
      label: transferTypeMap[k],
    }));

    return [
      {
        fieldtype: 'Select',
        label: t`Transfer Type`,
        placeholder: t`Transfer Type`,
        fieldname: 'transferType',
        options,
      } as OptionField,
      {
        fieldtype: 'AutoComplete',
        label: t`Place`,
        placeholder: t`Place`,
        fieldname: 'place',
        options: Object.keys(codeStateMap).map((code) => {
          return {
            value: code,
            label: codeStateMap[code],
          };
        }),
      } as OptionField,
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

  getColumns(): ColumnField[] | Promise<ColumnField[]> {
    const columns = [
      {
        label: t`Party`,
        fieldtype: 'Data',
        fieldname: 'partyName',
        width: 1.5,
      },
      {
        label: t`Invoice No.`,
        fieldname: 'invNo',
        fieldtype: 'Data',
      },
      {
        label: t`Invoice Value`,
        fieldname: 'invAmt',
        fieldtype: 'Currency',
      },
      {
        label: t`Invoice Date`,
        fieldname: 'invDate',
        fieldtype: 'Date',
      },
      {
        label: t`Place of supply`,
        fieldname: 'place',
        fieldtype: 'Data',
      },
      {
        label: t`Rate`,
        fieldname: 'rate',
        width: 0.5,
      },
      {
        label: t`Taxable Value`,
        fieldname: 'taxVal',
        fieldtype: 'Currency',
      },
      {
        label: t`Reverse Chrg.`,
        fieldname: 'reverseCharge',
        fieldtype: 'Data',
      },
      {
        label: t`Intergrated Tax`,
        fieldname: 'igstAmt',
        fieldtype: 'Currency',
      },
      {
        label: t`Central Tax`,
        fieldname: 'cgstAmt',
        fieldtype: 'Currency',
      },
      {
        label: t`State Tax`,
        fieldname: 'sgstAmt',
        fieldtype: 'Currency',
      },
    ] as ColumnField[];

    const transferType = this.transferType ?? TransferTypeEnum.B2B;
    if (transferType === TransferTypeEnum.B2B) {
      columns.unshift({
        label: t`GSTIN No.`,
        fieldname: 'gstin',
        fieldtype: 'Data',
        width: 1.5,
      });
    }

    return columns;
  }

  getActions(): Action[] {
    return getGSTRExportActions(this);
  }
}
