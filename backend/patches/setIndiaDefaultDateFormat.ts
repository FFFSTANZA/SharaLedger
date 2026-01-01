import { ModelNameEnum } from 'models/types';
import { DatabaseManager } from '../database/manager';

async function execute(dm: DatabaseManager) {
  const values =
    (await dm.db?.getSingleValues(
      { fieldname: 'countryCode', parent: ModelNameEnum.SystemSettings },
      { fieldname: 'dateFormat', parent: ModelNameEnum.SystemSettings }
    )) ?? [];

  const countryCodeValue = values.find(
    (v) => v.fieldname === 'countryCode'
  )?.value;
  const countryCode =
    typeof countryCodeValue === 'string' ? countryCodeValue : undefined;

  if (countryCode !== 'in') {
    return;
  }

  const dateFormatValue = values.find(
    (v) => v.fieldname === 'dateFormat'
  )?.value;
  const dateFormat =
    typeof dateFormatValue === 'string' ? dateFormatValue : undefined;

  if (!dateFormat || dateFormat === 'MMM d, y') {
    await dm.db?.update(ModelNameEnum.SystemSettings, {
      dateFormat: 'dd/MM/yyyy',
    });
  }
}

export default { execute };
