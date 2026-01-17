<template>
  <div class="flex flex-col overflow-hidden w-full h-full">
    <PageHeader :title="t`Banking`">
      <Button
        v-if="activeTab === 'reconciliation'"
        :title="t`Refresh`"
        :icon="true"
        @click="refreshUnreconciled"
      >
        <feather-icon name="refresh-cw" class="w-4 h-4" />
      </Button>
    </PageHeader>

    <div class="flex gap-2 border-b dark:border-gray-800 px-4">
      <button
        class="h-row-mid px-4 text-sm font-semibold"
        :class="
          activeTab === 'import'
            ? 'text-violet-600 border-b-2 border-violet-600'
            : 'text-gray-600 dark:text-gray-400'
        "
        @click="activeTab = 'import'"
      >
        {{ t`Import` }}
      </button>
      <button
        class="h-row-mid px-4 text-sm font-semibold"
        :class="
          activeTab === 'reconciliation'
            ? 'text-violet-600 border-b-2 border-violet-600'
            : 'text-gray-600 dark:text-gray-400'
        "
        @click="activeTab = 'reconciliation'"
      >
        {{ t`Reconciliation` }}
      </button>
    </div>

    <div
      v-if="activeTab === 'import'"
      class="flex flex-col overflow-auto custom-scroll custom-scroll-thumb1 p-4"
    >
      <div class="flex flex-wrap gap-4 items-end">
        <Link
          class="w-72"
          :border="true"
          :df="bankAccountDf"
          :value="importBankAccount"
          :show-label="true"
          @change="(v) => (importBankAccount = v)"
        />

        <Button type="primary" :disabled="isImporting" @click="selectFile">
          {{ t`Select CSV File` }}
        </Button>

        <Button
          v-if="previewRows.length"
          type="primary"
          :disabled="!importBankAccount || isImporting"
          @click="saveImportedEntries"
        >
          {{ t`Save as Unreconciled Entries` }}
        </Button>
      </div>

      <p v-if="importFileName" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
        {{ t`Selected` }}: <span class="font-semibold">{{ importFileName }}</span>
      </p>

      <p v-if="importMessage" class="text-sm mt-2" :class="importMessageClass">
        {{ importMessage }}
      </p>

      <div v-if="previewRows.length" class="mt-4 border dark:border-gray-800 rounded-xl overflow-hidden">
        <div
          class="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] tracking-widest font-bold uppercase bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400"
        >
          <div class="col-span-2">{{ t`Date` }}</div>
          <div class="col-span-6">{{ t`Description` }}</div>
          <div class="col-span-2">{{ t`Debit / Credit` }}</div>
          <div class="col-span-2 text-end">{{ t`Amount` }}</div>
        </div>

        <div class="max-h-[60vh] overflow-auto custom-scroll custom-scroll-thumb1">
          <div
            v-for="row in previewRows"
            :key="row.rowIndex"
            class="grid grid-cols-12 gap-2 px-3 py-2 border-t dark:border-gray-800 text-sm"
            :class="row.isDuplicate || row.error ? 'opacity-60' : ''"
          >
            <div class="col-span-2">{{ formatDate(row.transactionDate) }}</div>
            <div class="col-span-6 truncate" :title="row.description">
              {{ row.description }}
            </div>
            <div class="col-span-2">
              <span v-if="row.error" class="text-red-600">{{ t`Error` }}</span>
              <span v-else-if="row.isDuplicate" class="text-amber-600">{{ t`Duplicate` }}</span>
              <span v-else>{{ row.debitCredit }}</span>
            </div>
            <div class="col-span-2 text-end">
              {{ formatCurrency(row.amount) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex overflow-hidden flex-1">
      <div class="w-1/2 border-e dark:border-gray-800 overflow-auto custom-scroll custom-scroll-thumb1">
        <div class="flex items-center justify-between px-4 py-3 border-b dark:border-gray-800">
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {{ t`Unreconciled Bank Statement Entries` }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ unreconciledEntries.length }}
          </p>
        </div>

        <div v-if="!unreconciledEntries.length" class="p-4 text-sm text-gray-500 dark:text-gray-400">
          {{ t`No unreconciled entries.` }}
        </div>

        <button
          v-for="entry in unreconciledEntries"
          :key="entry.name"
          class="w-full text-left px-4 py-3 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30"
          :class="selectedEntry?.name === entry.name ? 'bg-violet-50 dark:bg-violet-900/20' : ''"
          @click="selectEntry(entry)"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {{ entry.description }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(entry.transactionDate) }} · {{ entry.bankAccount }}
              </p>
            </div>
            <div class="text-sm font-semibold" :class="entry.debitCredit === 'Debit' ? 'text-red-600' : 'text-green-600'">
              {{ entry.debitCredit === 'Debit' ? '-' : '+' }}{{ formatCurrency(entry.amount) }}
            </div>
          </div>
        </button>
      </div>

      <div class="w-1/2 overflow-auto custom-scroll custom-scroll-thumb1 p-4">
        <div v-if="!selectedEntry" class="text-sm text-gray-500 dark:text-gray-400">
          {{ t`Select an entry to reconcile.` }}
        </div>

        <div v-else>
          <div class="border dark:border-gray-800 rounded-xl p-4">
            <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {{ t`Selected Entry` }} #{{ selectedEntry.name }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ formatDate(selectedEntry.transactionDate) }} · {{ selectedEntry.bankAccount }}
            </p>
            <p class="text-sm mt-3 whitespace-pre-line">
              {{ selectedEntry.description }}
            </p>
            <p class="text-sm mt-2 font-semibold">
              {{ selectedEntry.debitCredit }} · {{ formatCurrency(selectedEntry.amount) }}
            </p>
          </div>

          <div class="mt-4 flex gap-2">
            <button
              class="px-3 py-2 rounded-xl text-sm font-semibold"
              :class="reconcileMode === 'match' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300'"
              @click="reconcileMode = 'match'"
            >
              {{ t`Match Existing` }}
            </button>
            <button
              class="px-3 py-2 rounded-xl text-sm font-semibold"
              :class="reconcileMode === 'create' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300'"
              @click="reconcileMode = 'create'"
            >
              {{ t`Create New` }}
            </button>
            <button
              class="px-3 py-2 rounded-xl text-sm font-semibold"
              :class="reconcileMode === 'ignore' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300'"
              @click="reconcileMode = 'ignore'"
            >
              {{ t`Ignore` }}
            </button>
          </div>

          <div v-if="reconcileMode === 'match'" class="mt-4 border dark:border-gray-800 rounded-xl p-4">
            <p class="text-sm font-semibold mb-3">{{ t`Match with existing accounting entry` }}</p>

            <Select
              :border="true"
              size="small"
              :show-label="true"
              :df="matchDocTypeDf"
              :value="matchDocType"
              @change="(v) => (matchDocType = v)"
            />

            <Link
              class="mt-3"
              :border="true"
              :show-label="true"
              :df="matchDocDf"
              :value="matchDocName"
              @change="(v) => (matchDocName = v)"
            />

            <div class="mt-4 flex justify-end">
              <Button
                type="primary"
                :disabled="isReconciling || !matchDocType || !matchDocName"
                @click="matchExisting"
              >
                {{ t`Match` }}
              </Button>
            </div>
          </div>

          <div v-else-if="reconcileMode === 'create'" class="mt-4 border dark:border-gray-800 rounded-xl p-4">
            <p class="text-sm font-semibold mb-3">{{ t`Create a new accounting entry (Draft)` }}</p>

            <Select
              :border="true"
              size="small"
              :show-label="true"
              :df="createDocTypeDf"
              :value="createDocType"
              @change="onCreateDocTypeChange"
            />

            <Link
              v-if="createDocType !== 'Journal Entry'"
              class="mt-3"
              :border="true"
              :show-label="true"
              :df="partyDf"
              :value="createParty"
              @change="onPartyChange"
            />

            <Link
              v-if="createDocType !== 'Journal Entry'"
              class="mt-3"
              :border="true"
              :show-label="true"
              :df="partyAccountDf"
              :value="createPartyAccount"
              @change="(v) => (createPartyAccount = v)"
            />

            <Link
              v-if="createDocType === 'Journal Entry'"
              class="mt-3"
              :border="true"
              :show-label="true"
              :df="ledgerAccountDf"
              :value="createLedgerAccount"
              @change="(v) => (createLedgerAccount = v)"
            />

            <div class="mt-4 flex justify-end">
              <Button
                type="primary"
                :disabled="isReconciling || !canCreateDoc"
                @click="createNewAccountingDoc"
              >
                {{ t`Create Draft & Match` }}
              </Button>
            </div>
          </div>

          <div v-else class="mt-4 border dark:border-gray-800 rounded-xl p-4">
            <p class="text-sm font-semibold mb-3">{{ t`Ignore this entry` }}</p>
            <div class="flex justify-end">
              <Button
                :disabled="isReconciling"
                @click="ignoreSelected"
              >
                {{ t`Mark as Ignored` }}
              </Button>
            </div>
          </div>

          <p v-if="reconcileMessage" class="text-sm mt-3" :class="reconcileMessageClass">
            {{ reconcileMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { getDbError, DuplicateEntryError } from 'fyo/utils/errors';
import Button from 'src/components/Button.vue';
import PageHeader from 'src/components/PageHeader.vue';
import Link from 'src/components/Controls/Link.vue';
import Select from 'src/components/Controls/Select.vue';
import { fyo } from 'src/initFyo';
import { showDialog } from 'src/utils/interactive';
import { selectTextFile } from 'src/utils/ui';
import { parseCSV } from 'utils/csvParser';
import {
  detectBankStatementCsvColumns,
  getBankStatementEntryHash,
  parseDebitCredit,
  parseStatementDate,
} from 'src/banking/bankStatement';
import { defineComponent } from 'vue';

type PreviewRow = {
  rowIndex: number;
  transactionDate: Date;
  description: string;
  amount: number;
  debitCredit: 'Debit' | 'Credit';
  hash: string;
  isDuplicate: boolean;
  error?: string;
};

type StatementEntrySummary = {
  name: string;
  bankAccount: string;
  transactionDate: string | Date;
  description: string;
  amount: number | string;
  debitCredit: 'Debit' | 'Credit';
};

export default defineComponent({
  name: 'Banking',
  components: {
    PageHeader,
    Button,
    Link,
    Select,
  },
  data() {
    return {
      fyo,
      activeTab: 'import' as 'import' | 'reconciliation',

      importBankAccount: '' as string,
      importFileName: '' as string,
      previewRows: [] as PreviewRow[],
      isImporting: false,
      importMessage: '' as string,
      importMessageType: 'info' as 'info' | 'error' | 'success',

      unreconciledEntries: [] as StatementEntrySummary[],
      selectedEntry: null as null | StatementEntrySummary,
      reconcileMode: 'create' as 'create' | 'match' | 'ignore',
      isReconciling: false,
      reconcileMessage: '' as string,
      reconcileMessageType: 'info' as 'info' | 'error' | 'success',

      matchDocType: 'Payment' as 'Payment' | 'JournalEntry',
      matchDocName: '' as string,

      createDocType: 'Receipt Entry' as
        | 'Receipt Entry'
        | 'Payment Entry'
        | 'Journal Entry',
      createParty: '' as string,
      createPartyAccount: '' as string,
      createLedgerAccount: '' as string,
    };
  },
  computed: {
    bankAccountDf() {
      return {
        fieldname: 'bankAccount',
        label: this.t`Bank Account`,
        fieldtype: 'Link',
        target: 'Account',
        filters: { accountType: 'Bank', isGroup: false },
      };
    },
    importMessageClass(): string {
      return {
        info: 'text-gray-600 dark:text-gray-400',
        success: 'text-green-600',
        error: 'text-red-600',
      }[this.importMessageType];
    },
    reconcileMessageClass(): string {
      return {
        info: 'text-gray-600 dark:text-gray-400',
        success: 'text-green-600',
        error: 'text-red-600',
      }[this.reconcileMessageType];
    },
    matchDocTypeDf() {
      return {
        fieldname: 'matchDocType',
        label: this.t`Document Type`,
        fieldtype: 'Select',
        options: [
          { label: this.t`Payment`, value: 'Payment' },
          { label: this.t`Journal Entry`, value: 'JournalEntry' },
        ],
      };
    },
    matchDocDf() {
      return {
        fieldname: 'matchDocName',
        label: this.t`Document`,
        fieldtype: 'Link',
        target: this.matchDocType,
        create: false,
      };
    },
    createDocTypeDf() {
      return {
        fieldname: 'createDocType',
        label: this.t`Accounting Document Type`,
        fieldtype: 'Select',
        options: [
          { label: this.t`Receipt Entry`, value: 'Receipt Entry' },
          { label: this.t`Payment Entry`, value: 'Payment Entry' },
          { label: this.t`Journal Entry`, value: 'Journal Entry' },
        ],
      };
    },
    partyDf() {
      return {
        fieldname: 'party',
        label: this.t`Party`,
        fieldtype: 'Link',
        target: 'Party',
        create: false,
      };
    },
    partyAccountDf() {
      return {
        fieldname: 'partyAccount',
        label: this.t`Party / Ledger Account`,
        fieldtype: 'Link',
        target: 'Account',
        create: false,
        filters: { isGroup: false },
      };
    },
    ledgerAccountDf() {
      return {
        fieldname: 'ledgerAccount',
        label: this.t`Ledger Account`,
        fieldtype: 'Link',
        target: 'Account',
        create: false,
        filters: { isGroup: false },
      };
    },
    canCreateDoc(): boolean {
      if (!this.selectedEntry) {
        return false;
      }

      if (this.createDocType === 'Journal Entry') {
        return !!this.createLedgerAccount;
      }

      return !!this.createParty && !!this.createPartyAccount;
    },
  },
  async mounted() {
    await this.refreshUnreconciled();
  },
  methods: {
    formatCurrency(value: unknown): string {
      try {
        if (typeof value === 'number') {
          return this.fyo.format(this.fyo.pesa(value), 'Currency');
        }

        if (typeof value === 'string') {
          const n = Number.parseFloat(value);
          if (!Number.isNaN(n)) {
            return this.fyo.format(this.fyo.pesa(n), 'Currency');
          }
        }

        return this.fyo.format(value as never, 'Currency');
      } catch {
        return String(value ?? '');
      }
    },
    formatDate(value: unknown): string {
      if (value instanceof Date) {
        return this.fyo.format(value, 'Date');
      }

      if (typeof value === 'string') {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) {
          return this.fyo.format(d, 'Date');
        }
      }

      return String(value ?? '');
    },
    async selectFile() {
      this.importMessage = '';
      this.importMessageType = 'info';
      this.previewRows = [];
      this.importFileName = '';

      if (!this.importBankAccount) {
        await showDialog({
          title: this.t`Bank Account required`,
          detail: this.t`Select a bank account before importing.`,
          type: 'error',
        });
        return;
      }

      const { text, name } = await selectTextFile([
        { name: 'CSV', extensions: ['csv'] },
      ]);

      if (!text) {
        return;
      }

      this.importFileName = name;

      try {
        const matrix = parseCSV(text);
        if (!matrix.length) {
          throw new Error('Empty file');
        }

        const [headers, ...rows] = matrix;
        const columns = detectBankStatementCsvColumns(headers);

        const preview: PreviewRow[] = [];
        const hashes: string[] = [];
        const seenInFile = new Set<string>();

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row?.length || row.every((c) => !String(c ?? '').trim())) {
            continue;
          }

          const rowIndex = i + 2;
          try {
            const transactionDate = parseStatementDate(
              row[columns.dateIdx] ?? ''
            );
            const description = String(row[columns.descriptionIdx] ?? '').trim();
            const { amount, debitCredit } = parseDebitCredit({ row, columns });

            const hash = getBankStatementEntryHash({
              transactionDate,
              amount,
              description,
              bankAccount: this.importBankAccount,
            });

            const isDuplicate = seenInFile.has(hash);
            seenInFile.add(hash);

            preview.push({
              rowIndex,
              transactionDate,
              description,
              amount,
              debitCredit,
              hash,
              isDuplicate,
            });
            hashes.push(hash);
          } catch (err) {
            preview.push({
              rowIndex,
              transactionDate: new Date(),
              description: row.join(', '),
              amount: 0,
              debitCredit: 'Debit',
              hash: '',
              isDuplicate: false,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }

        if (!preview.length) {
          this.importMessage = this.t`No rows found in file.`;
          this.importMessageType = 'info';
          return;
        }

        const existing = await this.fyo.db.getAll('BankStatementEntry', {
          fields: ['transactionHash'],
          filters: {
            transactionHash: ['in', hashes],
          },
          limit: hashes.length,
        });

        const existingSet = new Set(
          existing
            .map((r) => r.transactionHash)
            .filter((v): v is string => typeof v === 'string')
        );

        for (const row of preview) {
          if (!row.hash) {
            continue;
          }

          if (existingSet.has(row.hash)) {
            row.isDuplicate = true;
          }
        }

        this.previewRows = preview;
        const dupes = preview.filter((r) => r.isDuplicate).length;
        if (dupes) {
          this.importMessage = this.t`${dupes} duplicate rows detected (will be skipped on save).`;
          this.importMessageType = 'info';
        }
      } catch (err) {
        await showDialog({
          title: this.t`Cannot read file`,
          detail: err instanceof Error ? err.message : String(err),
          type: 'error',
        });
      }
    },

    async saveImportedEntries() {
      if (!this.importBankAccount || this.isImporting) {
        return;
      }

      this.isImporting = true;
      this.importMessage = '';

      let imported = 0;
      let duplicates = 0;
      let failed = 0;

      for (const row of this.previewRows) {
        if (row.isDuplicate || row.error) {
          duplicates += row.isDuplicate ? 1 : 0;
          continue;
        }

        const doc = this.fyo.doc.getNewDoc('BankStatementEntry', {
          bankAccount: this.importBankAccount,
          transactionDate: row.transactionDate,
          description: row.description,
          amount: this.fyo.pesa(row.amount),
          debitCredit: row.debitCredit,
          transactionHash: row.hash,
          status: 'Unreconciled',
        });

        try {
          await doc.sync();
          imported += 1;
        } catch (err) {
          const dbErr = err instanceof Error ? getDbError(err) : null;
          if (dbErr === DuplicateEntryError) {
            duplicates += 1;
            continue;
          }

          failed += 1;
        }
      }

      this.isImporting = false;

      if (failed) {
        this.importMessage = this.t`Imported ${imported} entries. Skipped ${duplicates} duplicates. ${failed} failed.`;
        this.importMessageType = 'error';
      } else {
        this.importMessage = this.t`Imported ${imported} entries. Skipped ${duplicates} duplicates.`;
        this.importMessageType = 'success';
      }

      await this.refreshUnreconciled();
    },

    async refreshUnreconciled() {
      const rows = (await this.fyo.db.getAll('BankStatementEntry', {
        fields: [
          'name',
          'bankAccount',
          'transactionDate',
          'description',
          'amount',
          'debitCredit',
        ],
        filters: { status: 'Unreconciled' },
        orderBy: ['transactionDate', 'name'],
        order: 'desc',
        limit: 200,
      })) as StatementEntrySummary[];

      this.unreconciledEntries = rows;
      if (this.selectedEntry) {
        const updated = rows.find((r) => r.name === this.selectedEntry?.name);
        this.selectedEntry = updated ?? null;
      }
    },

    selectEntry(entry: StatementEntrySummary) {
      this.selectedEntry = entry;
      this.reconcileMode = 'create';
      this.reconcileMessage = '';
      this.reconcileMessageType = 'info';

      this.matchDocType = 'Payment';
      this.matchDocName = '';

      this.createDocType = entry.debitCredit === 'Credit' ? 'Receipt Entry' : 'Payment Entry';
      this.createParty = '';
      this.createPartyAccount = '';
      this.createLedgerAccount = '';
    },

    onCreateDocTypeChange(value: string) {
      this.createDocType = value as never;
      this.createParty = '';
      this.createPartyAccount = '';
      this.createLedgerAccount = '';
    },

    async onPartyChange(value: string) {
      this.createParty = value;
      this.createPartyAccount = '';
      if (!value) {
        return;
      }

      try {
        const partyDoc = await this.fyo.doc.getDoc('Party', value);
        const defaultAccount = partyDoc.defaultAccount as string | undefined;
        if (defaultAccount) {
          this.createPartyAccount = defaultAccount;
        }
      } catch {
        // ignore
      }
    },

    async markMatched(params: { docType: string; docName: string }) {
      if (!this.selectedEntry) {
        return;
      }

      const entryDoc = await this.fyo.doc.getDoc(
        'BankStatementEntry',
        this.selectedEntry.name
      );

      await entryDoc.setAndSync({
        status: 'Matched',
        matchedDocType: params.docType,
        matchedDocName: params.docName,
        matchedAt: new Date(),
      });

      this.reconcileMessage = this.t`Matched.`;
      this.reconcileMessageType = 'success';

      await this.refreshUnreconciled();
      this.selectedEntry = null;
    },

    async matchExisting() {
      if (this.isReconciling || !this.matchDocType || !this.matchDocName) {
        return;
      }

      this.isReconciling = true;
      this.reconcileMessage = '';

      try {
        await this.markMatched({
          docType: this.matchDocType,
          docName: this.matchDocName,
        });
      } catch (err) {
        this.reconcileMessage = err instanceof Error ? err.message : String(err);
        this.reconcileMessageType = 'error';
      } finally {
        this.isReconciling = false;
      }
    },

    async createNewAccountingDoc() {
      if (this.isReconciling || !this.selectedEntry) {
        return;
      }

      this.isReconciling = true;
      this.reconcileMessage = '';

      try {
        const bankAccount = this.selectedEntry.bankAccount;
        const amountNum =
          typeof this.selectedEntry.amount === 'number'
            ? this.selectedEntry.amount
            : Number.parseFloat(this.selectedEntry.amount);

        const transactionDate =
          this.selectedEntry.transactionDate instanceof Date
            ? this.selectedEntry.transactionDate
            : new Date(this.selectedEntry.transactionDate);

        if (Number.isNaN(transactionDate.getTime())) {
          throw new Error('Invalid transaction date');
        }

        if (this.createDocType === 'Journal Entry') {
          const ledgerAccount = this.createLedgerAccount;
          if (!ledgerAccount) {
            throw new Error('Ledger account is required');
          }

          const debitCredit = this.selectedEntry.debitCredit;

          const journal = this.fyo.doc.getNewDoc('JournalEntry', {
            entryType: 'Bank Entry',
            date: transactionDate,
            userRemark: this.selectedEntry.description,
            accounts: [],
          });

          if (debitCredit === 'Credit') {
            journal.push('accounts', {
              account: bankAccount,
              debit: this.fyo.pesa(amountNum),
              credit: this.fyo.pesa(0),
            });
            journal.push('accounts', {
              account: ledgerAccount,
              debit: this.fyo.pesa(0),
              credit: this.fyo.pesa(amountNum),
            });
          } else {
            journal.push('accounts', {
              account: ledgerAccount,
              debit: this.fyo.pesa(amountNum),
              credit: this.fyo.pesa(0),
            });
            journal.push('accounts', {
              account: bankAccount,
              debit: this.fyo.pesa(0),
              credit: this.fyo.pesa(amountNum),
            });
          }

          await journal.sync();
          await this.markMatched({ docType: 'JournalEntry', docName: journal.name! });
          return;
        }

        const party = this.createParty;
        const partyAccount = this.createPartyAccount;

        if (!party || !partyAccount) {
          throw new Error('Party and party account are required');
        }

        const paymentType =
          this.createDocType === 'Receipt Entry' ? 'Receive' : 'Pay';

        const paymentData: Record<string, unknown> = {
          party,
          date: transactionDate,
          paymentType,
          paymentMethod: 'Bank',
          amount: this.fyo.pesa(amountNum),
        };

        if (paymentType === 'Receive') {
          paymentData.account = partyAccount;
          paymentData.paymentAccount = bankAccount;
        } else {
          paymentData.account = bankAccount;
          paymentData.paymentAccount = partyAccount;
        }

        const payment = this.fyo.doc.getNewDoc('Payment', paymentData);
        await payment.sync();

        await this.markMatched({ docType: 'Payment', docName: payment.name! });
      } catch (err) {
        this.reconcileMessage = err instanceof Error ? err.message : String(err);
        this.reconcileMessageType = 'error';
      } finally {
        this.isReconciling = false;
      }
    },

    async ignoreSelected() {
      if (this.isReconciling || !this.selectedEntry) {
        return;
      }

      this.isReconciling = true;
      this.reconcileMessage = '';

      try {
        const entryDoc = await this.fyo.doc.getDoc(
          'BankStatementEntry',
          this.selectedEntry.name
        );

        await entryDoc.setAndSync({ status: 'Ignored' });
        this.reconcileMessage = this.t`Ignored.`;
        this.reconcileMessageType = 'success';
        await this.refreshUnreconciled();
        this.selectedEntry = null;
      } catch (err) {
        this.reconcileMessage = err instanceof Error ? err.message : String(err);
        this.reconcileMessageType = 'error';
      } finally {
        this.isReconciling = false;
      }
    },
  },
});
</script>
