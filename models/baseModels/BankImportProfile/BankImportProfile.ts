import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export class BankImportProfile extends Doc {
  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['bankName', 'isActive', 'lastUsed'],
    };
  }
}
