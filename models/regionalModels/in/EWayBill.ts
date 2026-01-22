import {
  FiltersMap,
  HiddenMap,
  ListViewSettings,
  ReadOnlyMap,
  ValidationMap,
} from 'fyo/model/types';
import { Doc } from 'fyo/model/doc';
import { ValidationError } from 'fyo/utils/errors';
import { Money } from 'pesa';
import { DateTime } from 'luxon';
import { t } from 'fyo';
import { ModelNameEnum } from 'models/types';

export type EWayBillStatus = 'Draft' | 'Active' | 'Cancelled' | 'Expired';

export class EWayBill extends Doc {
  salesInvoice?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  invoiceValue?: Money;
  supplyType?: string;
  subType?: string;
  fromGstin?: string;
  toGstin?: string;
  transporterName?: string;
  transportMode?: string;
  vehicleNo?: string;
  transportDocNo?: string;
  transportDocDate?: string;
  distanceKm?: number;
  ewayBillNo?: string;
  ewayBillDate?: string;
  validUpto?: string;

  status?: EWayBillStatus;
  statusChangedBy?: string;
  statusChangedAt?: string;
  statusChangeReason?: string;
  remarks?: string;

  validations: ValidationMap = {
    distanceKm: (value) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      if (typeof value === 'number' && value <= 0) {
        throw new ValidationError(
          t`Distance must be greater than 0 kilometers`
        );
      }
    },
    ewayBillNo: (value) => {
      if (!value) {
        return;
      }

      if (typeof value !== 'string' || !/^\d{12}$/.test(value)) {
        throw new ValidationError(t`E-Way Bill number must be 12 digits`);
      }
    },
    ewayBillDate: (value) => {
      if (!value) {
        return;
      }

      let ewayBillDate: DateTime;
      if (typeof value === 'string') {
        ewayBillDate = DateTime.fromISO(value);
      } else if (value instanceof Date) {
        ewayBillDate = DateTime.fromJSDate(value);
      } else {
        throw new ValidationError(t`Invalid E-Way Bill date format`);
      }

      if (!ewayBillDate.isValid) {
        throw new ValidationError(t`Invalid E-Way Bill date`);
      }

      // E-Way Bill should not be older than invoice date
      if (this.invoiceDate) {
        let invoiceDate: DateTime;
        if (typeof this.invoiceDate === 'string') {
          invoiceDate = DateTime.fromISO(this.invoiceDate);
        } else if (this.invoiceDate instanceof Date) {
          invoiceDate = DateTime.fromJSDate(this.invoiceDate);
        } else {
          return; // Skip validation if invoice date format is invalid
        }

        if (invoiceDate.isValid && ewayBillDate < invoiceDate) {
          throw new ValidationError(
            t`E-Way Bill date cannot be before invoice date`
          );
        }
      }
    },
    vehicleNo: (value) => {
      if (this.transportMode === 'Road') {
        if (!value) {
          throw new ValidationError(t`Vehicle Number is required for Road transport`);
        }

        // Indian vehicle number validation: 2 letters + 2 digits + 1-2 letters + 1-4 digits
        const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{1,4}$/;
        if (typeof value === 'string' && !vehicleRegex.test(value.toUpperCase().replace(/\s/g, ''))) {
          throw new ValidationError(
            t`Invalid vehicle number format. Expected format: MH12AB1234 or MH12A1234`
          );
        }
      }
    },
    transportDocNo: (value) => {
      if (this.transportMode && this.transportMode !== 'Road' && !value) {
        let docLabel = t`Transport Document Number`;
        if (this.transportMode === 'Rail') docLabel = t`RR Number`;
        if (this.transportMode === 'Air') docLabel = t`AWB Number`;
        if (this.transportMode === 'Ship') docLabel = t`Bill of Lading Number`;

        throw new ValidationError(t`${docLabel} is required for ${this.transportMode} transport`);
      }
    },
    fromGstin: (value) => {
      if (!value) {
        return;
      }

      // Indian GSTIN validation: 2 digits + 5 letters + 4 digits + 1 letter + 1 digit + 1 letter + 1 digit
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$/;
      if (typeof value === 'string' && !gstinRegex.test(value.toUpperCase())) {
        throw new ValidationError(t`Invalid GSTIN format. Expected format: 27AAAAA0000A1Z5`);
      }
    },
    toGstin: (value) => {
      if (!value) {
        return;
      }

      // Indian GSTIN validation: 2 digits + 5 letters + 4 digits + 1 letter + 1 digit + 1 letter + 1 digit
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$/;
      if (typeof value === 'string' && !gstinRegex.test(value.toUpperCase())) {
        throw new ValidationError(t`Invalid GSTIN format. Expected format: 27AAAAA0000A1Z5`);
      }
    },
    validUpto: () => {
      if (!this.ewayBillDate || !this.validUpto) {
        return;
      }

      let billDate: DateTime;
      let validUptoDate: DateTime;

      // Handle ewayBillDate (can be string or Date)
      if (typeof this.ewayBillDate === 'string') {
        billDate = DateTime.fromISO(this.ewayBillDate);
      } else if (this.ewayBillDate instanceof Date) {
        billDate = DateTime.fromJSDate(this.ewayBillDate);
      } else {
        return; // Skip validation if ewayBillDate format is invalid
      }

      // Handle validUpto (can be string or Date)
      if (typeof this.validUpto === 'string') {
        validUptoDate = DateTime.fromISO(this.validUpto);
      } else if (this.validUpto instanceof Date) {
        validUptoDate = DateTime.fromJSDate(this.validUpto);
      } else {
        return; // Skip validation if validUpto format is invalid
      }

      if (billDate.isValid && validUptoDate.isValid && validUptoDate <= billDate) {
        throw new ValidationError(
          t`Valid Upto date must be after E-Way Bill Date`
        );
      }
    },
  };

  hidden: HiddenMap = {
    vehicleNo: () => this.transportMode !== 'Road',
    transportDocNo: () => !this.transportMode || this.transportMode === 'Road',
    transportDocDate: () => !this.transportMode || this.transportMode === 'Road',
    statusChangeReason: () => {
      return this.status !== 'Cancelled' && this.status !== 'Expired';
    },
  };

  readOnly: ReadOnlyMap = {
    salesInvoice: () => !this.notInserted,
    invoiceNo: () => true,
    invoiceDate: () => true,
    invoiceValue: () => true,
    statusChangedBy: () => true,
    statusChangedAt: () => true,
  };

  async beforeInsert() {
    await this.populateFromInvoice();
    this.setValidUptoFromDistance();
    this.updateStatus();
  }

  async _applyChange(
    fieldname: string,
    retriggerChildDocApplyChange?: boolean
  ): Promise<boolean> {
    const res = await super._applyChange(
      fieldname,
      retriggerChildDocApplyChange
    );

    if (fieldname === 'salesInvoice' && this.salesInvoice) {
      await this.populateFromInvoice();
    }

    return res;
  }

  async beforeSync() {
    const previousStatus = this.status;

    // Ensure invoice details are populated
    if (!this.invoiceNo || !this.invoiceDate || !this.invoiceValue || this.invoiceValue.isZero()) {
      await this.populateFromInvoice();
    }

    this.setValidUptoFromDistance();
    this.updateStatus();

    if (previousStatus !== this.status) {
      this.statusChangedAt = DateTime.local().toISO();
      this.statusChangedBy =
        (this.fyo.singles.AccountingSettings?.fullname as string | undefined) ??
        (this.fyo.singles.AccountingSettings?.email as string | undefined) ??
        'System';
    }

    this.showEWayBillRequiredWarning();
  }

  updateStatus() {
    if (this.cancelled) {
      this.status = 'Cancelled';
      return;
    }

    if (!this.submitted) {
      this.status = 'Draft';
      return;
    }

    if (this.validUpto) {
      let validUptoDate: DateTime;
      if (typeof this.validUpto === 'string') {
        validUptoDate = DateTime.fromISO(this.validUpto);
      } else if (this.validUpto instanceof Date) {
        validUptoDate = DateTime.fromJSDate(this.validUpto);
      } else {
        return; // Skip status update if validUpto format is invalid
      }

      if (validUptoDate.isValid) {
        const validUptoEndOfDay = validUptoDate.endOf('day');
        if (DateTime.local() > validUptoEndOfDay) {
          this.status = 'Expired';
          return;
        }
      }
    }

    this.status = 'Active';
  }

  showEWayBillRequiredWarning() {
    if (!this.invoiceValue || this.ewayBillNo) {
      return;
    }

    const threshold = this.fyo.pesa(50000);
    if (this.invoiceValue.gte(threshold)) {
      console.warn(
        'Invoice value is ≥ ₹50,000. An E-Way Bill number is typically required.'
      );
    }
  }

  setValidUptoFromDistance() {
    if (this.validUpto || !this.ewayBillDate || !this.distanceKm) {
      return;
    }

    let billDate: DateTime;
    if (typeof this.ewayBillDate === 'string') {
      billDate = DateTime.fromISO(this.ewayBillDate);
    } else if (this.ewayBillDate instanceof Date) {
      billDate = DateTime.fromJSDate(this.ewayBillDate);
    } else {
      return; // Skip if ewayBillDate format is invalid
    }

    if (!billDate.isValid) {
      return; // Skip if date is invalid
    }

    const days = Math.max(1, Math.ceil(this.distanceKm / 200));
    this.validUpto = billDate.plus({ days }).toJSDate();
  }

  async populateFromInvoice() {
    if (!this.salesInvoice) {
      return;
    }

    try {
      const invoice = await this.fyo.doc.getDoc(
        ModelNameEnum.SalesInvoice,
        this.salesInvoice
      );
      
      if (!invoice) {
        console.warn(`Invoice ${this.salesInvoice} not found for E-Way Bill`);
        return;
      }

      this.invoiceNo = invoice.name as string;
      
      // Handle invoice date - can be string, Date, or DateTime
      if (invoice.date instanceof Date) {
        this.invoiceDate = invoice.date.toISOString().split('T')[0];
      } else if (typeof invoice.date === 'string') {
        this.invoiceDate = invoice.date.split('T')[0];
      } else if (invoice.date && typeof (invoice.date as any).toISODate === 'function') {
        // Handle Luxon DateTime
        this.invoiceDate = (invoice.date as any).toISODate();
      }
      
      // Use baseGrandTotal or grandTotal if base is missing/zero
      const value = (invoice.baseGrandTotal as Money) || (invoice.grandTotal as Money);
      if (value) {
        this.invoiceValue = value;
      }

      const companyGstin = this.fyo.singles.AccountingSettings?.gstin as
        | string
        | undefined;
      if (companyGstin && !this.fromGstin) {
        this.fromGstin = companyGstin;
      }

      const partyName = invoice.party as string;
      if (partyName && !this.toGstin) {
        const party = await this.fyo.doc.getDoc(ModelNameEnum.Party, partyName);
        const customerGstin = party.get('gstin') as string | undefined;
        if (customerGstin) {
          this.toGstin = customerGstin;
        }
      }
    } catch (error) {
      console.error('Error populating E-Way Bill from invoice:', error);
    }
  }

  static filters: FiltersMap = {
    salesInvoice: () => ({
      submitted: true,
    }),
  };

  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'name',
        'status',
        'invoiceNo',
        'invoiceDate',
        'invoiceValue',
        'ewayBillNo',
        'vehicleNo',
        'validUpto',
      ],
    };
  }
}
