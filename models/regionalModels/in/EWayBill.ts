import {
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
    fromGstin: () => true,
    toGstin: () => true,
    statusChangedBy: () => true,
    statusChangedAt: () => true,
  };

  async beforeInsert() {
    await this.populateFromInvoice();

    if (!this.status) {
      this.status = 'Draft';
    }

    this.setValidUptoFromDistance();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async beforeSync() {
    const previousStatus =
      (this.get('status') as EWayBillStatus | undefined) ?? 'Draft';

    this.setValidUptoFromDistance();

    if (this.status && this.status !== previousStatus) {
      this.statusChangedAt = DateTime.local().toISO();
      this.statusChangedBy =
        (this.fyo.singles.AccountingSettings?.fullname as string | undefined) ??
        (this.fyo.singles.AccountingSettings?.email as string | undefined) ??
        'System';
    }

    if (this.status === 'Active' && !this.ewayBillNo && this.invoiceValue) {
      const threshold = this.fyo.pesa(50000);
      if (this.invoiceValue.gte(threshold)) {
        console.warn(
          'Invoice value is ≥ ₹50,000. An E-Way Bill number is typically required.'
        );
      }
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
