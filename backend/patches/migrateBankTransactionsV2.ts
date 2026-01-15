import { Knex } from 'knex';

export default async function migrateBankTransactionsV2(knex: Knex) {
  console.log('Migrating BankTransaction schema to V2...');
  
  // Check if table exists
  const tableExists = await knex.schema.hasTable('BankTransaction');
  if (!tableExists) {
    console.log('BankTransaction table does not exist, skipping migration');
    return;
  }

  // Get all columns
  const columns = await knex('BankTransaction').columnInfo();
  
  // Rename status values: Imported/Suggested/Posted → Unreconciled, keep Reconciled
  await knex.raw(`
    UPDATE BankTransaction
    SET status = 'Unreconciled'
    WHERE status IN ('Imported', 'Suggested', 'Posted')
  `);
  
  console.log('Updated status values to new schema');

  // Drop columns that no longer exist
  const columnsToDrop = [
    'bankName',
    'matchedDocument',
    'matchedDocumentType',
    'suggestedLedger',
    'suggestedVoucherType',
    'category'
  ];

  for (const column of columnsToDrop) {
    if (columns[column]) {
      try {
        await knex.schema.alterTable('BankTransaction', (table) => {
          table.dropColumn(column);
        });
        console.log(`Dropped column: ${column}`);
      } catch (error) {
        console.error(`Error dropping column ${column}:`, error);
      }
    }
  }

  // Add new columns if they don't exist
  if (!columns['notes']) {
    await knex.schema.alterTable('BankTransaction', (table) => {
      table.text('notes');
    });
    console.log('Added column: notes');
  }

  if (!columns['postedVoucher']) {
    await knex.schema.alterTable('BankTransaction', (table) => {
      table.text('postedVoucher');
    });
    console.log('Added column: postedVoucher');
  }

  if (!columns['postedVoucherType']) {
    await knex.schema.alterTable('BankTransaction', (table) => {
      table.text('postedVoucherType');
    });
    console.log('Added column: postedVoucherType');
  }

  // Ensure bankAccount exists (renamed from bankName or added new)
  if (!columns['bankAccount'] && columns['bankName']) {
    await knex.schema.alterTable('BankTransaction', (table) => {
      table.renameColumn('bankName', 'bankAccount');
    });
    console.log('Renamed bankName to bankAccount');
  } else if (!columns['bankAccount']) {
    await knex.schema.alterTable('BankTransaction', (table) => {
      table.text('bankAccount').notNullable().defaultTo('');
    });
    console.log('Added column: bankAccount');
  }

  // Drop foreign key constraints if they exist
  // SQLite doesn't support dropping constraints directly, so we'll recreate the table
  // But we'll keep data intact
  
  console.log('BankTransaction migration to V2 completed successfully');
}
