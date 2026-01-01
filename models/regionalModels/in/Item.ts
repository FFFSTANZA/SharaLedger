import { ListsMap } from 'fyo/model/types';
import { Item as BaseItem } from 'models/baseModels/Item/Item';
import { SelectOption } from 'schemas/types';

const HSN_OPTIONS: SelectOption[] = [
  { value: '2106', label: '2106 - Food preparations (F&B)' },
  { value: '2202', label: '2202 - Non-alcoholic beverages (retail/F&B)' },
  { value: '6109', label: '6109 - T-shirts and similar garments (retail)' },
  {
    value: '8471',
    label: '8471 - Computers and data processing machines (IT)',
  },
];

const SAC_OPTIONS: SelectOption[] = [
  { value: '9963', label: '9963 - Accommodation, food and beverage services' },
  {
    value: '9983',
    label: '9983 - Other professional / technical services (IT/consulting)',
  },
  {
    value: '9984',
    label: '9984 - Telecom / broadcasting / information services',
  },
  { value: '9987', label: '9987 - Maintenance and repair services' },
];

export class Item extends BaseItem {
  static lists: ListsMap = {
    hsnCode: (doc) => {
      const itemType = (doc?.itemType as string | undefined) ?? '';

      if (itemType === 'Service') {
        return SAC_OPTIONS;
      }

      if (itemType === 'Product') {
        return HSN_OPTIONS;
      }

      return [...HSN_OPTIONS, ...SAC_OPTIONS];
    },
  };
}
