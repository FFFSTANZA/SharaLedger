import { Doc } from 'fyo/model/doc';
import { Money } from 'pesa';

export class TDSSection extends Doc {
  name?: string;
  description?: string;
  rate?: number;
  rateWithoutPan?: number;
  threshold?: Money;
  cumulativeThreshold?: Money;
  perContractThreshold?: Money;
  effectiveDate?: string;
  isActive?: boolean;
  requiresITRFiling?: boolean;
  tieredRates?: boolean;
  tier1Rate?: number;
  tier1Threshold?: Money;
  tier2Rate?: number;
  turnoverThreshold?: Money;
  serviceType?: string;
  mutualExclusiveWith?: string;

  /**
   * Get the applicable TDS rate based on PAN availability and conditions
   */
  getApplicableRate(
    hasPan: boolean,
    amount?: Money,
    cumulativeAmount?: Money,
    isITRFiler?: boolean,
    otherSectionApplicable?: boolean
  ): number {
    // Check mutual exclusivity first
    if (otherSectionApplicable && this.mutualExclusiveWith) {
      return 0; // Don't apply if mutually exclusive section applies
    }

    if (!hasPan) {
      return this.rateWithoutPan ?? 20;
    }

    // Handle tiered rates (like 194N)
    if (this.tieredRates && amount) {
      return this.getTieredRate(amount, isITRFiler);
    }

    return this.rate ?? 0;
  }

  /**
   * Calculate tiered rate based on amount and ITR filing status
   */
  private getTieredRate(amount: Money, isITRFiler?: boolean): number {
    if (!this.tieredRates) {
      return this.rate ?? 0;
    }

    // For ITR filers: 2% above ₹1 crore
    if (isITRFiler) {
      return amount.gte('100000000') ? (this.rate ?? 2) : 0;
    }

    // For non-ITR filers: 2% above ₹20 lakh, 5% above ₹1 crore
    if (amount.gte('100000000')) {
      return this.tier2Rate ?? 5;
    } else if (amount.gte('2000000')) {
      return this.tier1Rate ?? 2;
    }

    return 0;
  }

  /**
   * Check if TDS is applicable for a given amount with complex conditions
   */
  isApplicableForAmount(
    amount: Money,
    cumulativeAmount?: Money,
    partyTurnover?: Money,
    buyerTurnover?: Money,
    sellerTurnover?: Money
  ): boolean {
    if (!this.isActive) {
      return false;
    }

    // Handle turnover-based sections (194Q, 206C1H)
    if (this.turnoverThreshold) {
      if (this.serviceType === 'Goods-Purchase') {
        // 194Q: Buyer conditions
        return (
          amount.gte('50000000') && // ₹50 lakh purchase
          buyerTurnover &&
          buyerTurnover.gte(this.turnoverThreshold) // ₹10 crore buyer turnover
        );
      } else if (this.serviceType === 'Goods-Sale') {
        // 206C1H: Seller conditions
        return (
          amount.gte('50000000') && // ₹50 lakh sale
          sellerTurnover &&
          sellerTurnover.gte(this.turnoverThreshold) // ₹10 crore seller turnover
        );
      }
    }

    // Handle dual threshold conditions (194C)
    if (this.cumulativeThreshold && this.perContractThreshold) {
      // Check per contract threshold
      if (amount.gte(this.perContractThreshold)) {
        return true;
      }

      // Check cumulative threshold
      if (cumulativeAmount && cumulativeAmount.gte(this.cumulativeThreshold)) {
        return true;
      }

      return false;
    }

    // Standard single threshold check
    if (!this.threshold) {
      return true;
    }

    return amount.gte(this.threshold);
  }

  /**
   * Get applicable TDS amount with complex calculations
   */
  calculateTDSAmount(
    baseAmount: Money,
    hasPan: boolean,
    cumulativeAmount?: Money,
    isITRFiler?: boolean,
    otherSectionApplicable?: boolean,
    partyTurnover?: Money,
    buyerTurnover?: Money,
    sellerTurnover?: Money
  ): Money {
    if (!this.isApplicableForAmount(
      baseAmount,
      cumulativeAmount,
      partyTurnover,
      buyerTurnover,
      sellerTurnover
    )) {
      return baseAmount.mul(0);
    }

    const rate = this.getApplicableRate(
      hasPan,
      baseAmount,
      cumulativeAmount,
      isITRFiler,
      otherSectionApplicable
    );

    return baseAmount.mul(rate / 100);
  }

  /**
   * Get service type classification for rate determination
   */
  getServiceClassification(): string {
    return this.serviceType ?? 'General';
  }

  /**
   * Check if this section is mutually exclusive with another
   */
  isMutuallyExclusiveWith(otherSectionCode: string): boolean {
    return this.mutualExclusiveWith === otherSectionCode;
  }

  /**
   * Determine which section applies in case of mutual exclusivity
   */
  static getApplicableSection(
    section1: TDSSection,
    section2: TDSSection,
    conditions: {
      buyerTurnover?: Money;
      sellerTurnover?: Money;
      amount?: Money;
    }
  ): TDSSection | null {
    const { buyerTurnover, sellerTurnover, amount } = conditions;

    // Check 194Q vs 206C1H logic
    if (
      section1.name === '194Q' ||
      section1.name === '206C1H' ||
      section2.name === '194Q' ||
      section2.name === '206C1H'
    ) {
      // 194Q takes precedence if conditions are met
      const tdsSection = section1.name === '194Q' ? section1 : section2;
      const tcsSection = section1.name === '206C1H' ? section1 : section2;

      // Check if 194Q conditions are met (buyer turnover > ₹10 crore and purchase > ₹50 lakh)
      if (
        buyerTurnover &&
        buyerTurnover.gte('1000000000') && // ₹10 crore
        amount &&
        amount.gte('50000000') // ₹50 lakh
      ) {
        return tdsSection; // 194Q applies
      }

      // Check if 206C1H conditions are met (seller turnover > ₹10 crore and sale > ₹50 lakh)
      if (
        sellerTurnover &&
        sellerTurnover.gte('1000000000') && // ₹10 crore
        amount &&
        amount.gte('50000000') // ₹50 lakh
      ) {
        return tcsSection; // 206C1H applies
      }
    }

    return null;
  }
}
