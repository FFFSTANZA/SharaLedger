import { readFileSync } from 'fs';
import { join } from 'path';
import { ModelNameEnum } from 'models/types';
import test from 'tape';
import { BankStatementImporter } from 'src/banking/BankStatementImporter';
import { parseCSV } from 'utils/csvParser';
import { closeTestFyo, getTestFyo, setupTestFyo } from './helpers';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('bank statement importer auto-maps common Indian headers', async (t) => {
  const importer = new BankStatementImporter(fyo);
  const csvPath = join(__dirname, 'bank_statement.csv');
  const data = readFileSync(csvPath, { encoding: 'utf-8' });

  const rows = parseCSV(data);
  await importer.selectStatement(rows, 'bank_statement.csv');

  t.equal(
    importer.assignedTemplateFields[0],
    `${ModelNameEnum.BankTransaction}.date`,
    'date mapped'
  );
  t.equal(
    importer.assignedTemplateFields[1],
    `${ModelNameEnum.BankTransaction}.description`,
    'description mapped'
  );
  t.equal(
    importer.assignedTemplateFields[2],
    `${ModelNameEnum.BankTransaction}.debit`,
    'debit mapped'
  );
  t.equal(
    importer.assignedTemplateFields[3],
    `${ModelNameEnum.BankTransaction}.credit`,
    'credit mapped'
  );

  importer.populateDocs();
  t.equal(importer.docs.length, 2, '2 transactions parsed');

  for (const doc of importer.docs) {
    await doc.sync();
  }

  t.end();
});

closeTestFyo(fyo, __filename);
