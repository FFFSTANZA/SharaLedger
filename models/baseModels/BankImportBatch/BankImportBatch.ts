import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export class BankImportBatch extends Doc {
  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['importDate', 'bankAccount', 'fileName', 'totalTransactions'],
    };
  }
}
