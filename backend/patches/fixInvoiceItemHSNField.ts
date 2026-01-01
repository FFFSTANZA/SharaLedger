import { DatabaseManager } from '../database/manager';

const TABLES = ['SalesInvoiceItem', 'PurchaseInvoiceItem', 'SalesQuoteItem'];

async function execute(dm: DatabaseManager) {
  const knex = dm.db?.knex;
  const knexSchema = dm.db?.knex?.schema;
  if (!knex || !knexSchema) {
    return;
  }

  const [{ value: countryCode } = { value: 'in' }] =
    ((await knex('SingleValue').where({
      fieldname: 'countryCode',
      parent: 'SystemSettings',
    })) as { value: string }[]) ?? [];

  if (countryCode !== 'in') {
    return;
  }

  for (const tableName of TABLES) {
    const exists = await knexSchema.hasTable(tableName);
    if (!exists) {
      continue;
    }

    await knexSchema.alterTable(tableName, (table) => {
      table.text('hsnCode').alter();
    });
  }
}

export default { execute, beforeMigrate: true };
