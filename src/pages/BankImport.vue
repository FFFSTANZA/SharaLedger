<template>
  <div class="flex flex-col overflow-hidden w-full h-full bg-gray-50 dark:bg-gray-900">
    <!-- Header Bar -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between shadow-sm z-10">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ t`Import Bank Statement` }}
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ t`Upload and map your bank transactions` }}
        </p>
      </div>
      <div class="flex space-x-3">
        <Button
          v-if="transactions.length > 0"
          :title="t`Clear`"
          variant="secondary"
          @click="clearAll"
        >
          {{ t`Clear` }}
        </Button>
        <Button
          v-if="transactions.length > 0"
          :title="t`Import ${transactions.length} Transactions`"
          type="primary"
          :disabled="!canImport"
          :loading="isImporting"
          @click="importTransactions"
        >
          {{ t`Import` }}
        </Button>
        <Button
          v-if="transactions.length === 0"
          :title="t`Select Statement File`"
          type="primary"
          @click="selectFile"
        >
          <template #icon>
            <feather-icon name="file-plus" class="w-4 h-4 mr-2" />
          </template>
          {{ t`Select File` }}
        </Button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar: Configuration -->
      <div class="w-80 border-e border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-800 overflow-y-auto shadow-inner">
        <!-- 1. Bank Account Selection -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-800">
          <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">
            {{ t`1. Destination Bank Account` }}
          </label>
          <AutoComplete
            :df="{
              fieldname: 'bankAccount',
              label: t`Bank Account`,
              fieldtype: 'AutoComplete',
              placeholder: t`Select bank account`,
            }"
            :suggestions="bankAccountSuggestions"
            class="w-full"
            :border="true"
            :value="selectedBankAccount"
            size="small"
            @change="setBankAccount"
          />
          <p class="text-xs text-gray-400 mt-2 italic">
            {{ t`Transactions will be imported into this account.` }}
          </p>
        </div>

        <!-- 2. Column Mapping -->
        <div v-if="transactions.length > 0" class="p-6 border-b border-gray-200 dark:border-gray-800">
          <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 block">
            {{ t`2. Column Mapping` }}
          </label>
          <div class="space-y-4">
            <div v-for="field in mappingFields" :key="field.key" class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ field.label }}</label>
                <span v-if="field.required" class="text-[10px] bg-red-100 text-red-600 px-1 rounded">{{ t`Required` }}</span>
              </div>
              <Select
                :df="{
                  fieldname: field.key,
                  fieldtype: 'Select',
                  options: headerOptions,
                }"
                :value="columnMapping[field.key]"
                :border="true"
                size="small"
                class="w-full"
                @change="(value) => updateMapping(field.key, value)"
              />
            </div>
          </div>
        </div>

        <!-- 3. Summary -->
        <div v-if="transactions.length > 0" class="p-6 bg-gray-50 dark:bg-gray-900/50">
          <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 block">
            {{ t`3. Statement Summary` }}
          </label>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">{{ t`Total Records` }}</span>
              <span class="font-semibold">{{ transactions.length }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-green-600 font-medium">{{ t`Total Credits` }}</span>
              <span class="font-semibold text-green-600">{{ formatCurrency(totalCredits) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-red-600 font-medium">{{ t`Total Debits` }}</span>
              <span class="font-semibold text-red-600">{{ formatCurrency(totalDebits) }}</span>
            </div>
            <div class="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <span class="text-sm font-bold">{{ t`Net Change` }}</span>
              <span class="text-sm font-bold" :class="(totalCredits - totalDebits) >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(totalCredits - totalDebits) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side: Preview Table -->
      <div class="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
        <div v-if="transactions.length === 0" class="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div class="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
            <feather-icon name="upload-cloud" class="w-12 h-12 text-blue-500" />
          </div>
          <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {{ t`Ready to Import` }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
            {{ t`Upload your bank statement (CSV, XLS, XLSX) to begin. We'll help you map the columns and review before importing.` }}
          </p>
          <Button type="primary" size="large" @click="selectFile">
            {{ t`Select Bank Statement` }}
          </Button>
          <div class="mt-12 grid grid-cols-3 gap-8 text-left">
            <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <feather-icon name="check-circle" class="w-5 h-5 text-green-500 mb-2" />
              <h4 class="font-semibold text-sm">{{ t`Auto-Detection` }}</h4>
              <p class="text-xs text-gray-500">{{ t`Smart mapping of common bank formats.` }}</p>
            </div>
            <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <feather-icon name="shield" class="w-5 h-5 text-blue-500 mb-2" />
              <h4 class="font-semibold text-sm">{{ t`Deduplication` }}</h4>
              <p class="text-xs text-gray-500">{{ t`We skip transactions you've already imported.` }}</p>
            </div>
            <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <feather-icon name="zap" class="w-5 h-5 text-yellow-500 mb-2" />
              <h4 class="font-semibold text-sm">{{ t`Fast Processing` }}</h4>
              <p class="text-xs text-gray-500">{{ t`Import hundreds of records in seconds.` }}</p>
            </div>
          </div>
        </div>

        <div v-else class="flex-1 flex flex-col overflow-hidden">
          <!-- Table Header -->
          <div class="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span class="text-sm font-semibold text-gray-600 dark:text-gray-300">
              {{ t`Preview: ${transactions.length} Transactions` }}
            </span>
            <div class="flex items-center space-x-2">
              <span class="text-xs text-gray-500">{{ t`File:` }} {{ fileName }}</span>
            </div>
          </div>
          
          <!-- Table -->
          <div class="flex-1 overflow-auto">
            <table class="w-full text-sm">
              <thead class="bg-white dark:bg-gray-900 sticky top-0 border-b border-gray-200 dark:border-gray-700 z-10">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">#</th>
                  <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32">{{ t`Date` }}</th>
                  <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{{ t`Description` }}</th>
                  <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-32">{{ t`Credit` }}</th>
                  <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-32">{{ t`Debit` }}</th>
                  <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-32">{{ t`Balance` }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                <tr v-for="(txn, idx) in transactions" :key="idx" class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                  <td class="px-6 py-3 text-gray-400">{{ idx + 1 }}</td>
                  <td class="px-6 py-3 font-medium">{{ txn.date }}</td>
                  <td class="px-6 py-3">
                    <div class="truncate max-w-md" :title="txn.description">{{ txn.description }}</div>
                  </td>
                  <td class="px-6 py-3 text-right font-mono text-green-600 font-medium">
                    {{ txn.type === 'credit' ? formatCurrency(txn.amount) : '-' }}
                  </td>
                  <td class="px-6 py-3 text-right font-mono text-red-600 font-medium">
                    {{ txn.type === 'debit' ? formatCurrency(txn.amount) : '-' }}
                  </td>
                  <td class="px-6 py-3 text-right font-mono text-gray-500">
                    {{ txn.balance ? formatCurrency(txn.balance) : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Success Modal -->
    <Modal :open-modal="importComplete" @closemodal="resetImport">
      <div class="w-[450px]">
        <div class="p-8 text-center">
          <div class="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <feather-icon name="check" class="w-10 h-10 text-green-600" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{{ t`Import Successful!` }}</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-8">
            {{ t`We've imported ${importedCount} transactions. ${duplicateCount} duplicates were automatically skipped.` }}
          </p>
          
          <div class="grid grid-cols-2 gap-4 mb-8">
            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span class="block text-2xl font-bold text-gray-900 dark:text-gray-100">{{ importedCount }}</span>
              <span class="text-xs text-gray-500 uppercase font-semibold">{{ t`New Records` }}</span>
            </div>
            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span class="block text-2xl font-bold text-gray-900 dark:text-gray-100">{{ duplicateCount }}</span>
              <span class="text-xs text-gray-500 uppercase font-semibold">{{ t`Duplicates` }}</span>
            </div>
          </div>

          <Button type="primary" size="large" class="w-full" @click="goToReconciliation">
            {{ t`Continue to Reconciliation` }}
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { t } from 'fyo';
import { DateTime } from 'luxon';
import { parseStatementFile, detectBankType, ParsedTransaction } from 'src/banking/statementParser';
import { autoMapColumns, ColumnMapping } from 'src/banking/bankStatementMapping';
import Button from 'src/components/Button.vue';
import AutoComplete from 'src/components/Controls/AutoComplete.vue';
import Select from 'src/components/Controls/Select.vue';
import Modal from 'src/components/Modal.vue';
import { fyo } from 'src/initFyo';
import { showToast } from 'src/utils/interactive';

export default defineComponent({
  name: 'BankImport',
  components: {
    Button,
    AutoComplete,
    Select,
    Modal,
  },
  data() {
    return {
      fileName: '',
      transactions: [] as ParsedTransaction[],
      columnMapping: {} as ColumnMapping,
      selectedBankAccount: '',
      bankAccountSuggestions: [] as string[],
      isImporting: false,
      importComplete: false,
      importedCount: 0,
      duplicateCount: 0,
      mappingFields: [
        { key: 'date', label: 'Date Column', required: true },
        { key: 'description', label: 'Description Column', required: true },
        { key: 'amount', label: 'Amount Column', required: true },
        { key: 'balance', label: 'Balance Column' },
        { key: 'type', label: 'Type Column (CR/DR)' },
        { key: 'reference', label: 'Reference Column' },
      ],
      parsedHeaders: [] as string[],
    };
  },
  computed: {
    canImport(): boolean {
      return this.transactions.length > 0 && !!this.selectedBankAccount;
    },
    headerOptions(): { value: string; label: string }[] {
      return this.parsedHeaders.map((h, i) => ({
        value: String(i),
        label: h,
      }));
    },
    totalCredits(): number {
      return this.transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    },
    totalDebits(): number {
      return this.transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    },
  },
  async mounted() {
    await this.loadBankAccounts();
  },
  methods: {
    t,
    async loadBankAccounts() {
      try {
        const accounts = await fyo.db.getAllRaw('Account', {
          filters: { accountType: 'Bank', isGroup: false },
          fields: ['name'],
        });
        this.bankAccountSuggestions = accounts.map((a: any) => a.name as string);
        if (this.bankAccountSuggestions.length > 0) {
          this.selectedBankAccount = this.bankAccountSuggestions[0];
        }
      } catch (e) {
        console.error('Failed to load bank accounts', e);
      }
    },
    setBankAccount(val: string) {
      this.selectedBankAccount = val;
    },
    updateMapping(key: string, value: string | null) {
      if (value === null) {
        delete this.columnMapping[key as keyof ColumnMapping];
      } else {
        this.columnMapping[key as keyof ColumnMapping] = parseInt(value);
      }
    },
    async selectFile() {
      const { success, canceled, data, name } = await ipc.selectFile({
        title: t`Select Bank Statement`,
        filters: [
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
        ],
      });

      if (canceled || !success || !data) return;

      this.fileName = name;
      try {
        const result = parseStatementFile(name, data);
        this.parsedHeaders = result.headers;
        this.transactions = result.transactions;
        this.columnMapping = autoMapColumns(result.headers);
        showToast({ type: 'success', message: t`Loaded ${this.transactions.length} transactions` });
      } catch (error: any) {
        showToast({ type: 'error', message: t`Failed to parse: ${error.message}` });
      }
    },
    async importTransactions() {
      if (!this.selectedBankAccount) {
        showToast({ type: 'error', message: t`Please select a bank account` });
        return;
      }

      this.isImporting = true;
      this.importedCount = 0;
      this.duplicateCount = 0;

      try {
        const batch = fyo.doc.getNewDoc('BankImportBatch');
        batch.fileName = this.fileName;
        batch.importDate = new Date();
        batch.totalTransactions = this.transactions.length;
        await batch.sync();

        for (const txn of this.transactions) {
          // Dedupe check
          const dateValue = this.parseDate(txn.date);
          const isoDate = dateValue.toISOString().split('T')[0];
          const dedupeKey = `${isoDate}-${txn.amount}-${txn.description.slice(0, 50)}-${txn.reference || ''}`;
          
          const existing = await fyo.db.getAll('BankTransaction', { filters: { dedupeKey }, limit: 1 });
          if (existing.length > 0) {
            this.duplicateCount++;
            continue;
          }

          const doc = fyo.doc.getNewDoc('BankTransaction');
          doc.date = dateValue;
          doc.description = txn.description;
          doc.amount = fyo.pesa(txn.amount);
          doc.type = txn.type === 'credit' ? 'Credit' : 'Debit';
          doc.bankAccount = this.selectedBankAccount;
          doc.status = 'Unreconciled';
          doc.dedupeKey = dedupeKey;
          doc.batch = batch.name;
          doc.reference = txn.reference;
          await doc.sync();
          this.importedCount++;
        }

        this.importComplete = true;
      } catch (e: any) {
        showToast({ type: 'error', message: t`Import failed: ${e.message}` });
      } finally {
        this.isImporting = false;
      }
    },
    parseDate(dateStr: string): Date {
      // Basic parser, can be improved
      const d = DateTime.fromISO(dateStr);
      if (d.isValid) return d.toJSDate();
      
      const formats = ['dd/MM/yyyy', 'dd-MM-yyyy', 'dd.MM.yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'];
      for (const f of formats) {
        const parsed = DateTime.fromFormat(dateStr, f);
        if (parsed.isValid) return parsed.toJSDate();
      }
      return new Date(dateStr);
    },
    formatCurrency(val: number) {
      return fyo.format(val, 'Currency');
    },
    clearAll() {
      this.transactions = [];
      this.fileName = '';
    },
    resetImport() {
      this.importComplete = false;
      this.clearAll();
    },
    goToReconciliation() {
      this.importComplete = false;
      this.$router.push('/bank-reconciliation');
    }
  }
});
</script>
