import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';

export class BankImportBatch extends Doc {
  importedAt?: Date;
  fileName?: string;
  bankAccount?: string;
  transactionsImported?: number;
  duplicatesSkipped?: number;
  errors?: number;

  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'importedAt',
        'fileName',
        'bankAccount',
        'transactionsImported',
        'duplicatesSkipped',
        'errors',
      ],
    };
  }

  async beforeDelete() {
    if (!this.name) {
      return;
    }

    const txns = await this.fyo.db.getAll(ModelNameEnum.BankTransaction, {
      fields: ['name'],
      filters: { importBatch: this.name },
    });

    for (const txn of txns) {
      if (!txn.name) {
        continue;
      }

      await this.fyo.db.delete(
        ModelNameEnum.BankTransaction,
        txn.name as string
      );
    }
  }
}
