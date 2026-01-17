import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from './helpers';
import { assertDoesNotThrow } from 'backend/database/tests/helpers';
import { getDbError, DuplicateEntryError } from 'fyo/utils/errors';
import { getBankStatementEntryHash } from 'src/banking/bankStatement';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('bank statement entry hash is deterministic', (t) => {
  const params = {
    transactionDate: new Date('2024-01-02'),
    amount: 1234.5,
    description: 'Test Narration',
    bankAccount: 'My Bank',
  };

  t.equal(
    getBankStatementEntryHash(params),
    getBankStatementEntryHash(params),
    'same input produces same hash'
  );

  t.notEqual(
    getBankStatementEntryHash(params),
    getBankStatementEntryHash({ ...params, amount: 1234.51 }),
    'different input produces different hash'
  );

  t.end();
});

test('bank statement entry transactionHash is unique (dedupe)', async (t) => {
  const bankAccounts = (await fyo.db.getAll('Account', {
    fields: ['name'],
    filters: { accountType: 'Bank', isGroup: false },
    limit: 1,
  })) as { name: string }[];

  const bankAccount = bankAccounts[0]?.name;
  t.ok(bankAccount, 'bank account exists');
  if (!bankAccount) {
    t.end();
    return;
  }

  const transactionDate = new Date('2024-01-02');
  const amount = 100;
  const description = 'Duplicate test';

  const transactionHash = getBankStatementEntryHash({
    transactionDate,
    amount,
    description,
    bankAccount,
  });

  const doc1 = fyo.doc.getNewDoc('BankStatementEntry', {
    bankAccount,
    transactionDate,
    description,
    amount: fyo.pesa(amount),
    debitCredit: 'Credit',
    transactionHash,
    status: 'Unreconciled',
  });

  await assertDoesNotThrow(async () => await doc1.sync());

  const doc2 = fyo.doc.getNewDoc('BankStatementEntry', {
    bankAccount,
    transactionDate,
    description,
    amount: fyo.pesa(amount),
    debitCredit: 'Credit',
    transactionHash,
    status: 'Unreconciled',
  });

  try {
    await doc2.sync();
    t.fail('expected unique constraint to throw');
  } catch (err) {
    t.equal(
      err instanceof Error ? getDbError(err) : null,
      DuplicateEntryError,
      'duplicate import prevented by db unique constraint'
    );
  }

  t.end();
});

closeTestFyo(fyo, __filename);
