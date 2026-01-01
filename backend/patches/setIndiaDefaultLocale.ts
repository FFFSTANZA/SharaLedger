import { ModelNameEnum } from 'models/types';
import { DatabaseManager } from '../database/manager';

async function execute(dm: DatabaseManager) {
  const values =
    (await dm.db?.getSingleValues(
      { fieldname: 'countryCode', parent: ModelNameEnum.SystemSettings },
      { fieldname: 'locale', parent: ModelNameEnum.SystemSettings }
    )) ?? [];

  const countryCodeValue = values.find(
    (v) => v.fieldname === 'countryCode'
  )?.value;
  const countryCode =
    typeof countryCodeValue === 'string' ? countryCodeValue : undefined;

  if (countryCode !== 'in') {
    return;
  }

  const localeValue = values.find((v) => v.fieldname === 'locale')?.value;
  const locale = typeof localeValue === 'string' ? localeValue : undefined;

  if (!locale || locale === 'en' || locale === 'en-US') {
    await dm.db?.update(ModelNameEnum.SystemSettings, {
      locale: 'en-IN',
    });
  }
}

export default { execute };
