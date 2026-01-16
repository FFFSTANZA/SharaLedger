import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export class BankRule extends Doc {
  ruleName!: string;
  condition!: string;
  targetAccount!: string;
  targetParty?: string;
  isActive!: boolean;

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['ruleName', 'condition', 'targetAccount', 'isActive'],
    };
  }
}
