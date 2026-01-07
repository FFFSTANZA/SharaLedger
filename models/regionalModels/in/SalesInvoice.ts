import { Fyo, t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { Action } from 'fyo/model/types';
import { SalesInvoice as BaseSalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { getInvoiceActions } from 'models/helpers';
import { ModelNameEnum } from 'models/types';

export class SalesInvoice extends BaseSalesInvoice {
  static getActions(fyo: Fyo): Action[] {
    const baseActions = getInvoiceActions(fyo, ModelNameEnum.SalesInvoice);
    const ewayBillAction = getCreateEWayBillAction(fyo);

    return [...baseActions, ewayBillAction];
  }
}

function getCreateEWayBillAction(fyo: Fyo): Action {
  return {
    label: t`E-Way Bill`,
    group: t`Create`,
    condition: (doc: Doc) => {
      if (doc.notInserted || doc.isCancelled || !doc.isSubmitted) {
        return false;
      }

      const companyGstin = fyo.singles.AccountingSettings?.gstin as
        | string
        | undefined;
      if (!companyGstin) {
        return false;
      }

      return true;
    },
    action: async (doc: Doc) => {
      const ewayBill = fyo.doc.getNewDoc(ModelNameEnum.EWayBill, {
        salesInvoice: doc.name,
      });

      await (
        ewayBill as unknown as { populateFromInvoice?: () => Promise<void> }
      ).populateFromInvoice?.();

      const name = ewayBill.name;
      if (!name) {
        return;
      }

      const { getFormRoute, routeTo } = await import('src/utils/ui');
      await routeTo(getFormRoute(ModelNameEnum.EWayBill, name));
    },
  };
}
