<template>
  <div class="flex flex-col overflow-hidden w-full h-full">
    <!-- Header -->
    <PageHeader :title="t`Bank Statement Import`">
      <Button
        v-if="transactions.length > 0"
        :title="t`Import Transactions`"
        type="primary"
        :disabled="!canImport"
        @click="importTransactions"
      >
        {{ t`Import Transactions` }}
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
        :title="t`Select File`"
        type="primary"
        @click="selectFile"
      >
        {{ t`Select File` }}
      </Button>
    </PageHeader>

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar for mapping and profiles -->
      <div
        class="w-80 border-e border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden"
      >
        <!-- Bank Selection / Info -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t`Bank Information` }}
          </h3>
          <AutoComplete
            v-if="transactions.length === 0"
            :df="{
              fieldname: 'bankName',
              label: t`Bank Name`,
              fieldtype: 'AutoComplete',
              placeholder: t`Select or type bank name`,
              options: bankOptions,
            }"
            class="w-full"
            :border="true"
            :value="selectedBank"
            size="small"
            @change="setBank"
          />
          <div v-else class="text-sm text-gray-600 dark:text-gray-400">
            <p>
              <span class="font-medium">{{ t`Bank:` }}</span>
              {{ detectedBank || t`Unknown` }}
            </p>
            <p>
              <span class="font-medium">{{ t`Transactions:` }}</span>
              {{ transactions.length }}
            </p>
            <p>
              <span class="font-medium">{{ t`File:` }}</span> {{ fileName }}
            </p>
          </div>
        </div>

        <!-- Column Mapping -->
        <div
          v-if="transactions.length > 0"
          class="p-4 border-b border-gray-200 dark:border-gray-800 overflow-y-auto"
          style="max-height: 300px"
        >
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {{ t`Column Mapping` }}
          </h3>
          <div class="space-y-3">
            <div v-for="field in mappingFields" :key="field.key">
              <label
                class="text-xs text-gray-500 dark:text-gray-400 block mb-1"
              >
                {{ field.label }}
              </label>
              <Select
                :df="{
                  fieldname: field.key,
                  fieldtype: 'Select',
                  options: headerOptions,
                }"
                :value="columnMapping[field.key]"
                :border="true"
                size="small"
                @change="(value) => updateMapping(field.key, value)"
              />
            </div>
          </div>
        </div>

        <!-- Import Profile -->
        <div v-if="transactions.length > 0" class="p-4 flex-1 overflow-y-auto">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {{ t`Saved Profiles` }}
          </h3>
          <div v-if="savedProfiles.length > 0" class="space-y-2">
            <div
              v-for="profile in savedProfiles"
              :key="profile.name"
              class="p-2 rounded cursor-pointer text-sm"
              :class="
                selectedProfile?.name === profile.name
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              "
              @click="applyProfile(profile)"
            >
              <div class="font-medium">{{ profile.bankName }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ t`Used ${profile.useCount} times` }}
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-gray-500 dark:text-gray-400">
            {{ t`No saved profiles` }}
          </p>
        </div>
      </div>

      <!-- Transaction Preview -->
      <div class="flex-1 overflow-hidden flex flex-col">
        <div
          v-if="transactions.length === 0"
          class="flex-1 flex items-center justify-center"
        >
          <div class="text-center p-8">
            <feather-icon
              name="upload-cloud"
              class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
            />
            <h3
              class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {{ t`Import Bank Statement` }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {{
                t`Upload your bank statement (CSV, XLSX, or XLS) to import transactions`
              }}
            </p>
            <Button type="primary" @click="selectFile">
              {{ t`Select File` }}
            </Button>
          </div>
        </div>

        <div
          v-else
          class="flex-1 overflow-auto custom-scroll custom-scroll-thumb1"
        >
          <!-- Preview Header -->
          <div
            class="sticky top-0 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4"
          >
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t`Preview (${transactions.length} transactions)` }}
              </h3>
              <div class="flex gap-2">
                <Button size="small" @click="reparse">
                  {{ t`Reparse` }}
                </Button>
              </div>
            </div>
          </div>

          <!-- Transaction Table -->
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th
                  class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-16"
                >
                  #
                </th>
                <th
                  class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-28"
                >
                  {{ t`Date` }}
                </th>
                <th
                  class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
                >
                  {{ t`Description` }}
                </th>
                <th
                  class="text-right p-3 font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-28"
                >
                  {{ t`Amount` }}
                </th>
                <th
                  class="text-right p-3 font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-28"
                >
                  {{ t`Balance` }}
                </th>
                <th
                  class="text-center p-3 font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-24"
                >
                  {{ t`Type` }}
                </th>
                <th
                  class="p-3 font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-32"
                >
                  {{ t`Category` }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(txn, index) in displayTransactions"
                :key="index"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td
                  class="p-3 border-b border-gray-200 dark:border-gray-700 text-gray-500"
                >
                  {{ index + 1 }}
                </td>
                <td class="p-3 border-b border-gray-200 dark:border-gray-700">
                  {{ txn.date }}
                </td>
                <td class="p-3 border-b border-gray-200 dark:border-gray-700">
                  <input
                    :value="txn.description"
                    class="w-full bg-transparent border-none focus:ring-0 p-0 text-sm"
                    @input="updateDescription(index, $event)"
                  />
                </td>
                <td
                  class="p-3 border-b border-gray-200 dark:border-gray-700 text-right font-mono"
                >
                  {{ formatCurrency(txn.amount) }}
                </td>
                <td
                  class="p-3 border-b border-gray-200 dark:border-gray-700 text-right font-mono text-gray-500"
                >
                  {{ txn.balance ? formatCurrency(txn.balance) : '-' }}
                </td>
                <td
                  class="p-3 border-b border-gray-200 dark:border-gray-700 text-center"
                >
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="
                      txn.type === 'credit'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    "
                  >
                    {{ txn.type === 'credit' ? t`CR` : t`DR` }}
                  </span>
                </td>
                <td class="p-3 border-b border-gray-200 dark:border-gray-700">
                  <Select
                    :df="{
                      fieldname: `category-${index}`,
                      fieldtype: 'Select',
                      options: categoryOptions,
                    }"
                    :value="txn.category"
                    :border="true"
                    size="small"
                    class="w-full"
                    @change="(value) => updateCategory(index, value)"
                  />
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
        <div class="p-4">
          <div class="mb-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{
                t`Importing ${importProgress} of ${transactions.length} transactions...`
              }}
            </p>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              class="bg-violet-600 h-2.5 rounded-full transition-all duration-300"
              :style="{
                width: `${(importProgress / transactions.length) * 100}%`,
              }"
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
        <div class="p-4">
          <div class="mb-4 text-center">
            <feather-icon
              name="check-circle"
              class="w-12 h-12 mx-auto text-green-500 mb-2"
            />
            <p class="text-lg font-medium text-gray-900 dark:text-gray-100">
              {{ t`${importedCount} transactions imported successfully` }}
            </p>
          </div>
          <div v="importErrors.length > 0" class="mb-4">
            <p class="text-sm text-red-600 dark:text-red-400">
              {{ t`${importErrors.length} transactions failed to import` }}
            </p>
          </div>
        </div>
        <hr class="dark:border-gray-800" />
        <div class="flex justify-end p-4">
          <Button type="primary" @click="resetImport">
            {{ t`Done` }}
          </Button>
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
  getFileExtension,
} from 'src/banking/statementParser';
import {
  autoMapColumns,
  ColumnMapping,
  getAllMappingHeaders,
  BankMapping,
  detectBankMapping,
} from 'src/banking/bankStatementMapping';
import {
  CategorySuggestion,
  getCategorizedSuggestions,
} from 'src/banking/autoCategorize';
import Button from 'src/components/Button.vue';
import AutoComplete from 'src/components/Controls/AutoComplete.vue';
import Select from 'src/components/Controls/Select.vue';
import FormHeader from 'src/components/FormHeader.vue';
import Modal from 'src/components/Modal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { fyo } from 'src/initFyo';
import { showToast } from 'src/utils/interactive';
import { selectTextFile } from 'src/utils/ui';
import { defineComponent } from 'vue';

interface DisplayTransaction extends ParsedTransaction {
  category?: string;
}

interface SavedProfile {
  name: string;
  bankName: string;
  columnMapping: ColumnMapping;
  useCount: number;
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
      savedProfiles: [] as SavedProfile[],
      selectedProfile: null as SavedProfile | null,
      categories: {} as Record<number, string>,
      suggestions: [] as CategorySuggestion[],
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
      categoryOptions: [
        { value: 'Income', label: 'Income' },
        { value: 'Expense', label: 'Expense' },
        { value: 'Transfer', label: 'Transfer' },
        { value: '', label: 'Uncategorized' },
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
      if (this.transactions.length === 0) return [];
      // Get headers from the parsed result
      return [];
    },
    canImport(): boolean {
      return this.transactions.length > 0;
    },
  },
  async mounted() {
    await this.loadSavedProfiles();
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
        this.transactions = result.transactions;
        this.detectedBank =
          result.bankName || detectBankType(result.headers, result.rawRows);
        this.selectedBank = this.detectedBank;

        // Auto-map columns
        const autoMapped = autoMapColumns(result.headers);
        this.columnMapping = autoMapped;

        // Get category suggestions
        this.suggestions = await getCategorizedSuggestions(
          this.transactions,
          fyo
        );

        // Update display transactions with suggestions
        this.displayTransactions = this.transactions.map((txn, index) => ({
          ...txn,
          category: this.suggestions[index]?.category || '',
        }));

        // Check for saved profile
        this.checkForSavedProfile(result.headers);

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
    async loadSavedProfiles() {
      try {
        const profiles = await fyo.db.getAll('BankImportProfile', {
          fields: ['name', 'bankName', 'columnMapping', 'useCount'],
          filters: { isActive: true },
        });

        this.savedProfiles = profiles.map((p) => ({
          name: p.name,
          bankName: p.bankName,
          columnMapping: JSON.parse(p.columnMapping || '{}'),
          useCount: p.useCount || 0,
        }));
      } catch {
        // Ignore errors
      }
    },
    checkForSavedProfile(headers: string[]) {
      const headerSignature = headers.join('|').toLowerCase();
      void headerSignature;

      for (const profile of this.savedProfiles) {
        if (
          profile.bankName.toLowerCase() === this.selectedBank.toLowerCase() ||
          (this.detectedBank &&
            this.detectedBank
              .toLowerCase()
              .includes(profile.bankName.toLowerCase()))
        ) {
          this.columnMapping = { ...profile.columnMapping };
          this.selectedProfile = profile;
          return;
        }
      }
    },
    applyProfile(profile: SavedProfile) {
      this.columnMapping = { ...profile.columnMapping };
      this.selectedProfile = profile;
    },
    setBank(value: string) {
      this.selectedBank = value;
      this.checkForSavedProfile([]);
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
    updateCategory(index: number, value: string | null) {
      this.categories[index] = value || '';
      this.displayTransactions[index].category = value || '';
    },
    reparse() {
      // Re-parse with current mapping
      showToast({
        type: 'info',
        message: t`Reparse with updated mapping`,
      });
    },
    clearAll() {
      this.transactions = [];
      this.displayTransactions = [];
      this.columnMapping = {};
      this.fileName = '';
      this.selectedBank = '';
      this.detectedBank = '';
      this.selectedProfile = null;
      this.categories = {};
    },
    async importTransactions() {
      this.isImporting = true;
      this.importProgress = 0;
      this.importedCount = 0;
      this.importErrors = [];

      try {
        // Create import batch
        const batch = fyo.doc.getNewDoc('BankImportBatch');
        batch.fileName = this.fileName;
        batch.bankName = this.selectedBank || this.detectedBank;
        batch.totalTransactions = this.transactions.length;
        batch.status = 'In Progress';
        await batch.insert();

        // Import each transaction
        for (let i = 0; i < this.displayTransactions.length; i++) {
          const txn = this.displayTransactions[i];
          this.importProgress = i + 1;

          try {
            const dedupeKey = `${txn.date}-${txn.description.slice(0, 50)}-${
              txn.amount
            }`;

            // Check for duplicates
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
            doc.category = this.categories[i] || txn.category || undefined;
            doc.dedupeKey = dedupeKey;
            doc.batch = batch.name;
            doc.importOrder = i + 1;
            doc.status = 'Unmatched';

            await doc.insert();
            this.importedCount++;
          } catch (error) {
            this.importErrors.push(error as Error);
          }
        }

        // Update batch status
        batch.status = this.importErrors.length > 0 ? 'Failed' : 'Completed';
        batch.matchedCount = 0;
        batch.unmatchedCount = this.importedCount;
        await batch.update();

        this.isImporting = false;
        this.importComplete = true;

        // Save profile for future use
        if (this.importedCount > 0) {
          await this.saveProfile();
        }
      } catch (error) {
        this.isImporting = false;
        showToast({
          type: 'error',
          message: t`Import failed: ${(error as Error).message}`,
        });
      }
    },
    async saveProfile() {
      if (!this.selectedBank) return;

      try {
        let profile;
        try {
          profile = await fyo.doc.getDoc(
            'BankImportProfile',
            this.selectedBank
          );
        } catch {
          profile = fyo.doc.getNewDoc('BankImportProfile');
          profile.name = this.selectedBank;
        }

        profile.bankName = this.selectedBank;
        profile.columnMapping = JSON.stringify(this.columnMapping);
        profile.dateFormat = 'dd/MM/yyyy';
        profile.useCount = Number(profile.useCount || 0) + 1;
        profile.isActive = true;

        await profile.save();
      } catch {
        // Ignore profile save errors
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
