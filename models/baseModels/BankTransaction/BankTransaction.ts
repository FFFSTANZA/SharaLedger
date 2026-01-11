import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { Money } from 'pesa';

export type BankTransactionStatus = 'Unmatched' | 'Matched' | 'Posted';

export class BankTransaction extends Doc {
  date?: Date;
  description?: string;
  debit?: Money;
  credit?: Money;
  balance?: Money;
  bankReference?: string;
  modeOfPayment?: string;
  bankAccount?: string;
  importBatch?: string;
  status?: BankTransactionStatus;
  dedupeKey?: string;

  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'date',
        'description',
        'debit',
        'credit',
        'balance',
        'status',
        'bankAccount',
        'importBatch',
      ],
    };
  }

  async validate() {
    await super.validate();

    const debit = this.debit ?? this.fyo.pesa(0);
    const credit = this.credit ?? this.fyo.pesa(0);

    if (debit.isZero() && credit.isZero()) {
      throw new ValidationError(t`Either Debit or Credit amount is required.`);
    }

    if (debit.isPositive() && credit.isPositive()) {
      throw new ValidationError(
        t`Both Debit and Credit cannot be set for the same transaction.`
      );
    }
  }

  beforeSync() {
    this.normalizeFields();
  }

  normalizeFields() {
    if (typeof this.description === 'string') {
      this.description = this.description.replaceAll(/\s+/g, ' ').trim();
    }

    if (!this.modeOfPayment) {
      this.modeOfPayment = inferModeOfPayment(this.description);
    }

    this.dedupeKey = this.getDedupeKeyValue();
  }

  getDedupeKeyValue(): string {
    const dateISO = this.date instanceof Date ? this.date.toISOString() : '';
    const debit = this.debit ?? this.fyo.pesa(0);
    const credit = this.credit ?? this.fyo.pesa(0);

    const description = (this.description ?? '').toLowerCase().trim();
    const bankReference = (this.bankReference ?? '').toLowerCase().trim();

    if (bankReference) {
      return `${dateISO}|${bankReference}`;
    }

    return [dateISO, debit.toString(), credit.toString(), description].join('|');
  }
}

function inferModeOfPayment(description?: string) {
  if (!description) {
    return '';
  }

  const d = description.toUpperCase();
  const patterns: { key: string; match: RegExp }[] = [
    { key: 'UPI', match: /\bUPI\b/ },
    { key: 'IMPS', match: /\bIMPS\b/ },
    { key: 'NEFT', match: /\bNEFT\b/ },
    { key: 'RTGS', match: /\bRTGS\b/ },
    { key: 'ATM', match: /\bATM\b/ },
    { key: 'POS', match: /\bPOS\b/ },
    { key: 'CARD', match: /\bCARD\b/ },
    { key: 'CHEQUE', match: /\bCHQ\b|\bCHEQUE\b/ },
  ];

  for (const p of patterns) {
    if (p.match.test(d)) {
      return p.key;
    }
  }

  return '';
}
