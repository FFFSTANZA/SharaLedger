<template>
  <div class="flex flex-col overflow-hidden w-full h-full">
    <!-- Header -->
    <PageHeader :title="t`Bank Statement Import`">
      <Button
        v-if="transactions.length > 0"
        :title="t`Import`"
        type="primary"
        :disabled="!canImport"
        @click="importTransactions"
      >
        {{ t`Import` }}
      </Button>
      <Button
        v-if="transactions.length > 0"
        :title="t`Clear`"
        @click="clearAll"
      >
        {{ t`Clear` }}
      </Button>
      <Button
        v-if="transactions.length === 0"
        :title="t`Import Statement`"
        type="primary"
        @click="selectFile"
      >
        {{ t`Import Statement` }}
      </Button>
    </PageHeader>

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar for mapping and profiles -->
      <div
        class="w-72 border-e border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900"
      >
        <!-- Bank Selection / Info -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <feather-icon name="credit-card" class="w-4 h-4 mr-2 text-blue-600" />
            {{ t`Bank Details` }}
          </h3>
          <AutoComplete
            v-if="transactions.length === 0"
            :df="{
              fieldname: 'bankName',
              label: t`Bank Name`,
              fieldtype: 'AutoComplete',
              placeholder: t`Select bank`,
              options: bankOptions,
            }"
            class="w-full"
            :border="true"
            :value="selectedBank"
            size="small"
            @change="setBank"
          />
          <div v-else class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ t`Bank:` }}</span>
              <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ detectedBank || t`Unknown` }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ t`Transactions:` }}</span>
              <span class="text-sm font-bold text-blue-600">{{ transactions.length }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ t`File:` }}</span>
              <span class="text-sm text-gray-600 dark:text-gray-400 truncate" :title="fileName">{{ fileName }}</span>
            </div>
          </div>
        </div>

        <!-- Column Mapping -->
        <div
          v-if="transactions.length > 0"
          class="p-6 border-b border-gray-200 dark:border-gray-800 overflow-y-auto bg-white dark:bg-gray-800"
          style="max-height: 280px"
        >
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <feather-icon name="columns" class="w-4 h-4 mr-2 text-green-600" />
            {{ t`Column Mapping` }}
          </h3>
          <div class="space-y-3">
            <div v-for="field in mappingFields" :key="field.key" class="space-y-1">
              <label class="text-xs text-gray-500 dark:text-gray-400 block">{{ field.label }}</label>
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

        <!-- Import Summary -->
        <div v-if="transactions.length > 0" class="p-6 flex-1 overflow-y-auto">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <feather-icon name="trending-up" class="w-4 h-4 mr-2 text-violet-600" />
            {{ t`Summary` }}
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <span class="text-sm text-green-700 dark:text-green-400">{{ t`Total Credits` }}</span>
              <span class="text-sm font-semibold text-green-700 dark:text-green-400">{{ formatCurrency(totalCredits) }}</span>
            </div>
            <div class="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
              <span class="text-sm text-red-700 dark:text-red-400">{{ t`Total Debits` }}</span>
              <span class="text-sm font-semibold text-red-700 dark:text-red-400">{{ formatCurrency(totalDebits) }}</span>
            </div>
            <div class="flex justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ t`Net Amount` }}</span>
              <span class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ formatCurrency(totalCredits - totalDebits) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Transaction Preview -->
      <div class="flex-1 overflow-hidden flex flex-col">
        <div
          v-if="transactions.length === 0"
          class="flex-1 flex items-center justify-center"
        >
          <div class="text-center max-w-lg mx-auto p-8">
            <div class="w-20 h-20 mx-auto bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
              <feather-icon name="upload" class="w-10 h-10 text-blue-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {{ t`Import Bank Statement` }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              {{ t`Upload your bank statement (CSV or Excel) to import transactions directly into your accounting` }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
              {{ t`Supports CSV, XLSX and XLS formats` }}
            </p>
          </div>
        </div>

        <div
          v-else
          class="flex-1 overflow-auto custom-scroll"
        >
          <!-- Preview Header -->
          <div class="sticky top-0 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div class="flex justify-between items-center">
              <h3 class="text-base font-semibold text-gray-800 dark:text-gray-200">
                {{ t`${transactions.length} Transactions` }}
              </h3>
              <Button size="small" variant="ghost" @click="reparse">
                <template #icon>
                  <feather-icon name="refresh-cw" class="w-4 h-4" />
                </template>
              </Button>
            </div>
          </div>

          <!-- Transaction Table -->
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-12">#</th>
                <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-28">{{ t`Date` }}</th>
                <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400">{{ t`Description` }}</th>
                <th class="text-right p-3 font-medium text-gray-600 dark:text-gray-400 w-28">{{ t`Amount` }}</th>
                <th class="text-right p-3 font-medium text-gray-600 dark:text-gray-400 w-28">{{ t`Balance` }}</th>
                <th class="text-center p-3 font-medium text-gray-600 dark:text-gray-400 w-20">{{ t`Type` }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(txn, index) in displayTransactions"
                :key="index"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td class="p-3 text-gray-500">{{ index + 1 }}</td>
                <td class="p-3 text-gray-800 dark:text-gray-200 font-medium">{{ txn.date }}</td>
                <td class="p-3">
                  <input
                    :value="txn.description"
                    class="w-full bg-transparent border-none focus:ring-0 p-0 text-gray-800 dark:text-gray-200 text-sm"
                    @input="updateDescription(index, $event)"
                  />
                </td>
                <td
                  class="p-3 text-right font-mono font-medium"
                  :class="txn.type === 'credit' ? 'text-green-600' : 'text-red-600'"
                >
                  {{ formatCurrency(txn.amount) }}
                </td>
                <td class="p-3 text-right font-mono text-gray-500">
                  {{ txn.balance ? formatCurrency(txn.balance) : '-' }}
                </td>
                <td class="p-3 text-center">
                  <span
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="txn.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                  >
                    {{ txn.type === 'credit' ? 'CR' : 'DR' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Import Progress Modal -->
    <Modal
      :open-modal="isImporting"
      :close-on-outside-click="false"
      @closemodal="() => {}"
    >
      <div class="w-form">
        <FormHeader :form-title="t`Importing Transactions`" />
        <hr class="dark:border-gray-800" />
        <div class="p-6">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ t`Importing ${importProgress} of ${transactions.length} transactions...` }}
          </p>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(importProgress / transactions.length) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Import Complete Modal -->
    <Modal :open-modal="importComplete" @closemodal="resetImport">
      <div class="w-form">
        <FormHeader :form-title="t`Import Complete`" />
        <hr class="dark:border-gray-800" />
        <div class="p-6 text-center">
          <feather-icon name="check-circle" class="w-12 h-12 mx-auto text-green-500 mb-3" />
          <p class="text-lg font-medium text-gray-900 dark:text-gray-100">
            {{ t`${importedCount} transactions imported` }}
          </p>
          <p v-if="importErrors.length > 0" class="text-sm text-red-600 mt-2">
            {{ t`${importErrors.length} transactions failed` }}
          </p>
        </div>
        <hr class="dark:border-gray-800" />
        <div class="flex justify-end p-4">
          <Button type="primary" @click="resetImport">{{ t`Done` }}</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import {
  ParsedTransaction,
  parseStatementFile,
  detectBankType,
} from 'src/banking/statementParser';
import {
  autoMapColumns,
  ColumnMapping,
} from 'src/banking/bankStatementMapping';
import Button from 'src/components/Button.vue';
import AutoComplete from 'src/components/Controls/AutoComplete.vue';
import Select from 'src/components/Controls/Select.vue';
import FormHeader from 'src/components/FormHeader.vue';
import Modal from 'src/components/Modal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { fyo } from 'src/initFyo';
import { showToast } from 'src/utils/interactive';
import { defineComponent } from 'vue';

interface DisplayTransaction extends ParsedTransaction {
  category?: string;
}

export default defineComponent({
  name: 'BankImport',
  components: {
    Button,
    AutoComplete,
    Select,
    FormHeader,
    Modal,
    PageHeader,
  },
  data() {
    return {
      fileName: '',
      transactions: [] as ParsedTransaction[],
      displayTransactions: [] as DisplayTransaction[],
      columnMapping: {} as ColumnMapping,
      selectedBank: '',
      detectedBank: '',
      categories: {} as Record<number, string>,
      parsedHeaders: [] as string[],
      isImporting: false,
      importProgress: 0,
      importedCount: 0,
      importErrors: [] as Error[],
      importComplete: false,
      bankOptions: [
        { value: 'HDFC Bank', label: 'HDFC Bank' },
        { value: 'State Bank of India', label: 'State Bank of India' },
        { value: 'ICICI Bank', label: 'ICICI Bank' },
        { value: 'Axis Bank', label: 'Axis Bank' },
        { value: 'Yes Bank', label: 'Yes Bank' },
        { value: 'Punjab National Bank', label: 'Punjab National Bank' },
        { value: 'Bank of Baroda', label: 'Bank of Baroda' },
        { value: 'Canara Bank', label: 'Canara Bank' },
        { value: 'Union Bank of India', label: 'Union Bank of India' },
        { value: 'Indian Bank', label: 'Indian Bank' },
        { value: 'IDFC First Bank', label: 'IDFC First Bank' },
        { value: 'Kotak Mahindra Bank', label: 'Kotak Mahindra Bank' },
        { value: 'Bandhan Bank', label: 'Bandhan Bank' },
        { value: 'Standard Chartered', label: 'Standard Chartered' },
        { value: 'HSBC Bank', label: 'HSBC Bank' },
        { value: 'Other', label: 'Other' },
      ],
      mappingFields: [
        { key: 'date', label: 'Date Column' },
        { key: 'description', label: 'Description Column' },
        { key: 'amount', label: 'Amount Column' },
        { key: 'balance', label: 'Balance Column' },
        { key: 'type', label: 'Type Column (CR/DR)' },
        { key: 'reference', label: 'Reference Column' },
        { key: 'chequeNo', label: 'Cheque No Column' },
      ],
    };
  },
  computed: {
    headerOptions(): { value: string; label: string }[] {
      return this.parsedHeaders.map((h, i) => ({
        value: String(i),
        label: h,
      }));
    },
    canImport(): boolean {
      return this.transactions.length > 0;
    },
    totalCredits(): number {
      return this.transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
    },
    totalDebits(): number {
      return this.transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
    },
  },
  methods: {
    async selectFile() {
      const { success, canceled, data, name } = await ipc.selectFile({
        title: t`Select Bank Statement`,
        filters: [
          { name: 'CSV Files', extensions: ['csv', 'txt'] },
          { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (canceled || !success || !data) {
        return;
      }

      this.fileName = name;

      try {
        const result = parseStatementFile(name, data);
        this.parsedHeaders = result.headers;
        this.transactions = result.transactions;
        this.detectedBank =
          result.bankName || detectBankType(result.headers, result.rawRows);
        this.selectedBank = this.detectedBank;

        const autoMapped = autoMapColumns(result.headers);
        this.columnMapping = autoMapped;

        this.displayTransactions = this.transactions.map((txn) => ({
          ...txn,
          category: '',
        }));

        showToast({
          type: 'success',
          message: t`Loaded ${this.transactions.length} transactions`,
        });
      } catch (error) {
        showToast({
          type: 'error',
          message: t`Failed to parse file: ${(error as Error).message}`,
        });
      }
    },
    setBank(value: string) {
      this.selectedBank = value;
    },
    updateMapping(key: string, value: string | null) {
      if (value === null) {
        delete this.columnMapping[key as keyof ColumnMapping];
      } else {
        this.columnMapping[key as keyof ColumnMapping] =
          value as unknown as number;
      }
    },
    updateDescription(index: number, event: Event) {
      const value = (event.target as HTMLInputElement).value;
      this.displayTransactions[index].description = value;
    },
    reparse() {
      showToast({
        type: 'info',
        message: t`Re-parse with updated mapping`,
      });
    },
    clearAll() {
      this.transactions = [];
      this.displayTransactions = [];
      this.columnMapping = {};
      this.fileName = '';
      this.selectedBank = '';
      this.detectedBank = '';
      this.categories = {};
      this.parsedHeaders = [];
    },
    async importTransactions() {
      this.isImporting = true;
      this.importProgress = 0;
      this.importedCount = 0;
      this.importErrors = [];

      try {
        const batch = fyo.doc.getNewDoc('BankImportBatch');
        batch.fileName = this.fileName;
        batch.bankName = this.selectedBank || this.detectedBank;
        batch.importDate = new Date();
        batch.totalTransactions = this.transactions.length;
        batch.status = 'In Progress';
        await batch.sync();

        for (let i = 0; i < this.displayTransactions.length; i++) {
          const txn = this.displayTransactions[i];
          this.importProgress = i + 1;

          try {
            const dedupeKey = `${txn.date}-${txn.description.slice(0, 50)}-${
              txn.amount
            }`;

            const existing = await fyo.db.exists('BankTransaction', {
              dedupeKey,
            });
            if (existing) {
              continue;
            }

            const doc = fyo.doc.getNewDoc('BankTransaction');
            doc.date = txn.date;
            doc.description = txn.description;
            doc.amount = txn.amount;
            doc.type = txn.type === 'credit' ? 'Credit' : 'Debit';
            doc.balance = txn.balance;
            doc.bankName = this.selectedBank || this.detectedBank;
            doc.reference = txn.reference;
            doc.chequeNo = txn.chequeNo;
            doc.category = this.categories[i] || undefined;
            doc.dedupeKey = dedupeKey;
            doc.batch = batch.name;
            doc.importOrder = i + 1;
            doc.status = 'Unmatched';

            await doc.sync();
            this.importedCount++;
          } catch (error) {
            this.importErrors.push(error as Error);
          }
        }

        batch.status = this.importErrors.length > 0 ? 'Failed' : 'Completed';
        batch.matchedCount = 0;
        batch.unmatchedCount = this.importedCount;
        await batch.sync();

        this.isImporting = false;
        this.importComplete = true;
      } catch (error) {
        this.isImporting = false;
        showToast({
          type: 'error',
          message: t`Import failed: ${(error as Error).message}`,
        });
      }
    },
    resetImport() {
      this.importComplete = false;
      this.clearAll();
    },
    formatCurrency(amount: number): string {
      return fyo.format(amount, 'Currency');
    },
  },
});
</script>
