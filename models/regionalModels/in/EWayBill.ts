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

      const ewayBillDate = DateTime.fromISO(value);
      if (!ewayBillDate.isValid) {
        throw new ValidationError(t`Invalid E-Way Bill date`);
      }

      // E-Way Bill should not be older than invoice date
      if (this.invoiceDate) {
        const invoiceDate = DateTime.fromISO(this.invoiceDate);
        if (ewayBillDate < invoiceDate) {
          throw new ValidationError(
            t`E-Way Bill date cannot be before invoice date`
          );
        }
      }
    },
    vehicleNo: (value) => {
      if (!value) {
        return;
      }

      // Indian vehicle number validation: 2 letters + 2 digits + 1-2 letters + 1-4 digits
      const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{1,4}$/;
      if (typeof value === 'string' && !vehicleRegex.test(value.toUpperCase().replace(/\s/g, ''))) {
        throw new ValidationError(
          t`Invalid vehicle number format. Expected format: MH12AB1234 or MH12A1234`
        );
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

      const billDate = DateTime.fromISO(this.ewayBillDate);
      const validUptoDate = DateTime.fromISO(this.validUpto);

      if (validUptoDate <= billDate) {
        throw new ValidationError(
          t`Valid Upto date must be after E-Way Bill Date`
        );
      }
    },
  };

  hidden: HiddenMap = {
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

  // eslint-disable-next-line @typescript-eslint/require-await
  async beforeSync() {
    const previousStatus = this.status;

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
      const validUptoDate = DateTime.fromISO(this.validUpto).endOf('day');
      if (DateTime.local() > validUptoDate) {
        this.status = 'Expired';
        return;
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

    const billDate = DateTime.fromISO(this.ewayBillDate);
    const days = Math.max(1, Math.ceil(this.distanceKm / 200));
    this.validUpto = billDate.plus({ days }).toISODate();
  }

  async populateFromInvoice() {
    if (!this.salesInvoice) {
      return;
    }

    const invoice = await this.fyo.doc.getDoc(
      ModelNameEnum.SalesInvoice,
      this.salesInvoice
    );
    this.invoiceNo = invoice.name as string;
    this.invoiceDate = invoice.date as string;
    this.invoiceValue = invoice.baseGrandTotal as Money;

    const companyGstin = this.fyo.singles.AccountingSettings?.gstin as
      | string
      | undefined;
    if (companyGstin) {
      this.fromGstin = companyGstin;
    }

    const partyName = invoice.party as string;
    if (partyName) {
      const party = await this.fyo.doc.getDoc(ModelNameEnum.Party, partyName);
      const customerGstin = party.get('gstin') as string | undefined;
      if (customerGstin) {
        this.toGstin = customerGstin;
      }
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
