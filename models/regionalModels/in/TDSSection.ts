import { Doc } from 'fyo/model/doc';
import { Money } from 'pesa';

export class TDSSection extends Doc {
  name?: string;
  description?: string;
  rate?: number;
  rateWithoutPan?: number;
  threshold?: Money;
  cumulativeThreshold?: Money;
  effectiveDate?: string;
  isActive?: boolean;

  /**
   * Get the applicable TDS rate based on PAN availability
   */
  getApplicableRate(hasPan: boolean): number {
    if (hasPan) {
      return this.rate ?? 0;
    }
    return this.rateWithoutPan ?? 20;
  }

  /**
   * Check if TDS is applicable for a given amount
   */
  isApplicableForAmount(amount: Money): boolean {
    if (!this.isActive) {
      return false;
    }

    if (!this.threshold) {
      return true;
    }

    return amount.gte(this.threshold);
  }
}
