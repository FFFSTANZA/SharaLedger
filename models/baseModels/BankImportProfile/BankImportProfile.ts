import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export type BankImportDebitCreditLogic =
  | 'SeparateColumns'
  | 'SignedAmount'
  | 'IndicatorColumn';

export class BankImportProfile extends Doc {
  bankName?: string;
  accountType?: 'Savings' | 'Current' | 'Other';
  dateFormat?: string;
  debitCreditLogic?: BankImportDebitCreditLogic;
  ignoreHeaderRowsCount?: number;
  columnMapping?: string;
  headerSignature?: string;

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['bankName', 'accountType', 'dateFormat', 'debitCreditLogic'],
    };
  }
}
