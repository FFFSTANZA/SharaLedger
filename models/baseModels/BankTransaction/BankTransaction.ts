import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export class BankTransaction extends Doc {
  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'date',
        'description',
        'withdrawal',
        'deposit',
        'bankAccount',
        'status',
        'importBatch',
      ],
    };
  }
}
