import { Doc } from 'fyo/model/doc';
import { FiltersMap, ReadOnlyMap } from 'fyo/model/types';
import { Money } from 'pesa';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { DateTime } from 'luxon';
import { t } from 'fyo';

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
  status?: string;

  async validate() {
    await super.validate();
    this.validateDistance();
    this.validateVehicleNumber();
    this.validateInvoiceValue();
    this.validateEWayBillNumber();
    this.validateValidityDate();
  }

  validateDistance() {
    if (this.distanceKm !== undefined && this.distanceKm !== null) {
      if (this.distanceKm <= 0) {
        throw new ValidationError(
          t`Distance must be greater than 0 kilometers`
        );
      }
    }
  }

  validateVehicleNumber() {
    if (!this.vehicleNo) {
      return;
    }

    // Basic vehicle number format validation for India
    // Format: XX00XX0000 (State Code + District Code + Series + Number)
    const vehiclePattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/;

    if (!vehiclePattern.test(this.vehicleNo.replace(/[\s-]/g, ''))) {
      console.warn('Vehicle number format may be invalid:', this.vehicleNo);
    }
  }

  validateInvoiceValue() {
    if (!this.invoiceValue) {
      return;
    }

    const threshold = this.fyo.pesa(50000);
    if (this.invoiceValue.gte(threshold) && !this.ewayBillNo) {
      console.warn(
        `Invoice value is ≥ ₹50,000. An E-Way Bill number is typically required. Invoice value: ${this.invoiceValue.float}`
      );
    }
  }

  validateEWayBillNumber() {
    if (!this.ewayBillNo) {
      return;
    }

    if (!/^\d{12}$/.test(this.ewayBillNo)) {
      throw new ValidationError(t`E-Way Bill number must be 12 digits`);
    }
  }

  validateValidityDate() {
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
  }

  async beforeInsert() {
    await this.populateFromInvoice();
    this.setValidUptoFromDistance();
    this.updateStatus();
  }

  beforeSave() {
    this.setValidUptoFromDistance();
    this.updateStatus();
  }

  setValidUptoFromDistance() {
    if (this.validUpto || !this.ewayBillDate || !this.distanceKm) {
      return;
    }

    const billDate = DateTime.fromISO(this.ewayBillDate);
    const days = Math.max(1, Math.ceil(this.distanceKm / 200));
    this.validUpto = billDate.plus({ days }).toISODate();
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
      const validUptoDate = DateTime.fromISO(this.validUpto);
      const now = DateTime.local();

      if (now > validUptoDate) {
        this.status = 'Expired';
        return;
      }
    }

    this.status = 'Active';
  }

  async populateFromInvoice() {
    if (!this.salesInvoice) {
      return;
    }

    const invoice = await this.fyo.doc.getDoc(
      ModelNameEnum.SalesInvoice,
      this.salesInvoice
    );

    // Populate invoice details
    this.invoiceNo = invoice.name as string;
    this.invoiceDate = invoice.date as string;
    this.invoiceValue = invoice.baseGrandTotal as Money;

    // Populate GSTIN details
    const companyGstin = this.fyo.singles.AccountingSettings?.gstin as
      | string
      | undefined;
    if (companyGstin) {
      this.fromGstin = companyGstin;
    }

    // Get customer GSTIN
    const partyName = invoice.party as string;
    if (partyName) {
      const party = await this.fyo.doc.getDoc(ModelNameEnum.Party, partyName);
      const customerGstin = party.get('gstin') as string | undefined;
      if (customerGstin) {
        this.toGstin = customerGstin;
      }
    }
  }

  readOnly: ReadOnlyMap = {
    salesInvoice: () => !this.notInserted,
    invoiceNo: () => true,
    invoiceDate: () => true,
    invoiceValue: () => true,
    fromGstin: () => true,
    toGstin: () => true,
  };

  static filters: FiltersMap = {
    salesInvoice: () => ({
      submitted: true,
    }),
  };
}
