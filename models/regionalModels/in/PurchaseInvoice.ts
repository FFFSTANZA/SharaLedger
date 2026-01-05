import { Fyo } from 'fyo';
import { Action, ListViewSettings } from 'fyo/model/types';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { ModelNameEnum } from 'models/types';
import { PurchaseInvoice as BasePurchaseInvoice } from 'models/baseModels/PurchaseInvoice/PurchaseInvoice';
import { getInvoiceActions, getTransactionStatusColumn } from '../../helpers';
import { Party } from './Party';
import { TDSSection } from './TDSSection';
import { TDSCategory } from './TDSCategory';
import { Money } from 'pesa';

export class PurchaseInvoice extends BasePurchaseInvoice {
  /**
   * Override afterSubmit so that the party outstanding amount reflects
   * the net payable (after TDS), while keeping the expense booked at gross.
   */
  override async afterSubmit() {
    const tdsDetails = await this.calculateTDS();
    const hasTDS = !this.isReturn && tdsDetails.tdsAmount.gt(0);

    const originalMakeAutoPayment = this.makeAutoPayment;

    if (hasTDS) {
      this.makeAutoPayment = false;
    }

    await super.afterSubmit();

    if (hasTDS) {
      const netOutstanding = this.baseGrandTotal!.sub(tdsDetails.tdsAmount);

      await this.fyo.db.update(this.schemaName, {
        name: this.name as string,
        outstandingAmount: netOutstanding,
      });

      const party = (await this.fyo.doc.getDoc(
        ModelNameEnum.Party,
        this.party
      )) as Party;

      await party.updateOutstandingAmount();
      await this.load();

      if (originalMakeAutoPayment && this.autoPaymentAccount) {
        const payment = this.getPayment();
        await payment?.sync();
        await payment?.submit();
        await this.load();
      }

      this.makeAutoPayment = originalMakeAutoPayment;
    }
  }

  /**
   * Override getPosting to add TDS entries
   */
  async getPosting() {
    const exchangeRate = this.exchangeRate ?? 1;
    const posting: LedgerPosting = new LedgerPosting(this, this.fyo);

    // Calculate TDS details
    const tdsDetails = await this.calculateTDS();

    if (this.isReturn) {
      await posting.debit(this.account!, this.baseGrandTotal!);
    } else {
      // If TDS is applicable, vendor payable is net amount (grand total - TDS)
      const vendorPayable = tdsDetails.tdsAmount.gt(0)
        ? this.baseGrandTotal!.sub(tdsDetails.tdsAmount)
        : this.baseGrandTotal!;
      await posting.credit(this.account!, vendorPayable);
    }

    // Debit expense accounts (full amounts)
    for (const item of this.items!) {
      if (this.isReturn) {
        await posting.credit(item.account!, item.amount!.mul(exchangeRate));
        continue;
      }
      await posting.debit(item.account!, item.amount!.mul(exchangeRate));
    }

    // Handle taxes
    if (this.taxes) {
      for (const tax of this.taxes) {
        if (this.isReturn) {
          await posting.credit(tax.account!, tax.amount!.mul(exchangeRate));
          continue;
        }
        await posting.debit(tax.account!, tax.amount!.mul(exchangeRate));
      }
    }

    // Handle discount
    const discountAmount = this.getTotalDiscount();
    const discountAccount = this.fyo.singles.AccountingSettings
      ?.discountAccount as string | undefined;
    if (discountAccount && discountAmount.isPositive()) {
      if (this.isReturn) {
        await posting.debit(discountAccount, discountAmount.mul(exchangeRate));
      } else {
        await posting.credit(discountAccount, discountAmount.mul(exchangeRate));
      }
    }

    // Add TDS Payable entry (Liability Account)
    if (tdsDetails.tdsAmount.gt(0) && !this.isReturn) {
      const tdsPayableAccount = await this.getTDSPayableAccount();
      if (tdsPayableAccount) {
        await posting.credit(tdsPayableAccount, tdsDetails.tdsAmount);
      }
    }

    await posting.makeRoundOffEntry();
    return posting;
  }

  /**
   * Calculate TDS amount based on party's TDS settings
   */
  async calculateTDS(): Promise<{
    tdsAmount: Money;
    tdsRate: number;
    tdsSection: string | null;
  }> {
    const zeroAmount = this.fyo.pesa(0);

    // Check if party exists
    if (!this.party) {
      return { tdsAmount: zeroAmount, tdsRate: 0, tdsSection: null };
    }

    // Get party details
    const party = (await this.fyo.doc.getDoc(
      ModelNameEnum.Party,
      this.party
    )) as Party;

    // Check if TDS is applicable for this party
    if (!party.tdsApplicable || !party.tdsCategory) {
      return { tdsAmount: zeroAmount, tdsRate: 0, tdsSection: null };
    }

    // Get TDS Category
    const tdsCategory = (await this.fyo.doc.getDoc(
      'TDSCategory',
      party.tdsCategory
    )) as TDSCategory;

    if (!tdsCategory.tdsSection) {
      return { tdsAmount: zeroAmount, tdsRate: 0, tdsSection: null };
    }

    // Get TDS Section
    const tdsSection = (await this.fyo.doc.getDoc(
      'TDSSection',
      tdsCategory.tdsSection
    )) as TDSSection;

    // Check if section is active
    if (!tdsSection.isActive) {
      return { tdsAmount: zeroAmount, tdsRate: 0, tdsSection: null };
    }

    // Check threshold
    const grossAmount = this.baseGrandTotal ?? zeroAmount;
    if (!tdsSection.isApplicableForAmount(grossAmount)) {
      return { tdsAmount: zeroAmount, tdsRate: 0, tdsSection: null };
    }

    // Calculate TDS
    const hasPan = party.panAvailable ?? true;
    const tdsRate = tdsSection.getApplicableRate(hasPan);
    const tdsAmount = grossAmount.mul(tdsRate / 100);

    return {
      tdsAmount,
      tdsRate,
      tdsSection: tdsSection.name ?? null,
    };
  }

  /**
   * Get TDS Payable account from Accounting Settings
   * If not found, will try to find "TDS Payable" account
   */
  async getTDSPayableAccount(): Promise<string | null> {
    // Try to get from settings first
    const tdsPayableAccount = this.fyo.singles.AccountingSettings
      ?.tdsPayableAccount as string | undefined;

    if (tdsPayableAccount) {
      return tdsPayableAccount;
    }

    // Check if "TDS Payable" account exists
    const accountExists = await this.fyo.db.exists('Account', 'TDS Payable');
    if (accountExists) {
      return 'TDS Payable';
    }

    // Return null - will need to be configured
    return null;
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'name',
        getTransactionStatusColumn(),
        'party',
        'date',
        'baseGrandTotal',
        'outstandingAmount',
      ],
    };
  }

  static getActions(fyo: Fyo): Action[] {
    return getInvoiceActions(fyo, ModelNameEnum.PurchaseInvoice);
  }
}
