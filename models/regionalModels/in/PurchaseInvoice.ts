import { Fyo } from 'fyo';
import { Action, ListViewSettings } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { DateTime } from 'luxon';
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
   * Override validate to check TDS configuration
   */
  override async validate() {
    await super.validate();

    // Check if TDS is applicable and validate TDS Payable account exists
    const tdsDetails = await this.calculateTDS();
    if (tdsDetails.tdsAmount.gt(0)) {
      const tdsPayableAccount = await this.getTDSPayableAccount();
      if (!tdsPayableAccount) {
        throw new ValidationError(
          this.fyo
            .t`TDS Payable account not configured. Please set it in Accounting Settings or create an account named "TDS Payable".`
        );
      }
    }
  }

  /**
   * Override afterSubmit so that the party outstanding amount reflects
   * the net payable (after TDS), while keeping the expense booked at gross.
   */
  override async afterSubmit() {
    const tdsDetails = await this.calculateTDS();
    const hasTDS = tdsDetails.tdsAmount.gt(0);

    const originalMakeAutoPayment = this.makeAutoPayment;

    if (hasTDS) {
      this.makeAutoPayment = false;
    }

    await super.afterSubmit();

    if (hasTDS) {
      const netOutstanding = this.isReturn
        ? this.baseGrandTotal!.add(tdsDetails.tdsAmount)
        : this.baseGrandTotal!.sub(tdsDetails.tdsAmount);

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
      // For returns, amounts are negative in Fyo.
      // tdsAmount from calculateTDS is positive.
      // vendor debit = -118 + 10 = -108.
      // TDS debit = -10.
      const vendorDebit = tdsDetails.tdsAmount.gt(0)
        ? this.baseGrandTotal!.add(tdsDetails.tdsAmount)
        : this.baseGrandTotal!;
      await posting.debit(this.account!, vendorDebit);

      if (tdsDetails.tdsAmount.gt(0)) {
        const tdsPayableAccount = await this.getTDSPayableAccount();
        if (tdsPayableAccount) {
          // Reverse TDS liability (negative debit)
          await posting.debit(tdsPayableAccount, tdsDetails.tdsAmount.neg());
        }
      }
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
      } else {
        // TDS is applicable but no payable account configured
        // Still allow posting but log warning (account should be configured)
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

    try {
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

      // Calculate TDS on amount excluding GST (CBDT Circular 23/2017)
      const exchangeRate = this.exchangeRate ?? 1;
      const netAmount = this.netTotal ?? zeroAmount;
      const discountAmount = this.getTotalDiscount();

      let applicableAmount = netAmount;
      if (!this.discountAfterTax) {
        applicableAmount = applicableAmount.sub(discountAmount);
      }

      // Convert to base currency for threshold check and calculation
      const baseApplicableAmount = applicableAmount.mul(exchangeRate);
      const absBaseApplicableAmount = baseApplicableAmount.abs();

      // Check mutual exclusivity with other sections first
      let otherSectionApplicable = false;
      if (tdsSection.mutualExclusiveWith) {
        // Check if 194Q vs 206C1H conditions
        const applicableSection = TDSSection.getApplicableSection(
          tdsSection,
          (await this.fyo.doc.getDoc(
            'TDSSection',
            tdsSection.mutualExclusiveWith
          )) as TDSSection,
          {
            buyerTurnover:
              this.fyo.singles.AccountingSettings?.businessTurnover,
            sellerTurnover: party.businessTurnover,
            amount: absBaseApplicableAmount,
          }
        );
        otherSectionApplicable =
          applicableSection !== null &&
          applicableSection.name !== tdsSection.name;
      }

      let cumulativeTotal = zeroAmount;

      // Check threshold with enhanced validation
      if (
        !tdsSection.isApplicableForAmount(
          absBaseApplicableAmount,
          undefined,
          party.businessTurnover,
          undefined,
          undefined,
          undefined,
          false,
          undefined,
          party.businessTurnover,
          party.professionalIncome
        )
      ) {
        // Check cumulative threshold for sections like 194C
        if (
          tdsSection.cumulativeThreshold &&
          tdsSection.cumulativeThreshold.gt(0)
        ) {
          const invoiceDate = DateTime.fromISO(
            (this.date as string) || DateTime.local().toISODate()
          );

          // Use fiscal year start based on Indian financial year (April 1)
          let startYear = invoiceDate.year;
          if (invoiceDate.month < 4) {
            startYear -= 1;
          }
          const fyStart = `${startYear}-04-01`;
          const fyEnd = `${startYear + 1}-03-31`;

          const previousInvoices = (await this.fyo.db.getAll(this.schemaName, {
            filters: {
              party: this.party,
              submitted: true,
              cancelled: false,
              date: ['between', [fyStart, fyEnd]],
            },
            fields: ['netTotal', 'exchangeRate', 'name', 'date'],
          })) as any[];

          for (const inv of previousInvoices) {
            if (inv.name === this.name) continue;

            const invDate = DateTime.fromISO(inv.date);
            // Only include invoices from same fiscal year
            if (
              invDate < DateTime.fromISO(fyStart) ||
              invDate > DateTime.fromISO(fyEnd)
            ) {
              continue;
            }

            const amount = this.fyo
              .pesa(inv.netTotal || 0)
              .mul(inv.exchangeRate ?? 1);
            cumulativeTotal = cumulativeTotal.add(amount);
          }

          const currentCumulative = cumulativeTotal.add(baseApplicableAmount);

          if (
            currentCumulative.abs().lt(tdsSection.cumulativeThreshold) &&
            cumulativeTotal.abs().lt(tdsSection.cumulativeThreshold)
          ) {
            return { tdsAmount: zeroAmount, tdsRate: 0, tdsSection: null };
          }
        } else {
          return { tdsAmount: zeroAmount, tdsRate: 0, tdsSection: null };
        }
      }

      // Calculate TDS with enhanced rate determination
      const hasPan = party.panAvailable ?? true;
      const isNonFiler = !party.itrFiled; // Assuming party has itrFiled field

      const tdsRate = tdsSection.getApplicableRate(
        hasPan,
        absBaseApplicableAmount,
        cumulativeTotal,
        party.itrFiled, // isITRFiler parameter
        otherSectionApplicable,
        isNonFiler
      );

      // Apply TDS calculation with proper rounding
      const tdsAmount = absBaseApplicableAmount.mul(tdsRate / 100);

      // Round TDS amount to 2 decimal places
      const roundedTdsAmount = this.fyo.pesa(
        Math.round(tdsAmount.toNumber() * 100) / 100
      );

      return {
        tdsAmount: roundedTdsAmount,
        tdsRate,
        tdsSection: tdsSection.name ?? null,
      };
    } catch (error) {
      console.warn('TDS calculation failed:', error);
      return { tdsAmount: zeroAmount, tdsRate: 0, tdsSection: null };
    }
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
