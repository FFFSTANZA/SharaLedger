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
        class="w-80 border-e border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-900/50"
      >
        <!-- Bank Selection / Info -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <feather-icon name="credit-card" class="w-4 h-4 mr-2 text-violet-600 dark:text-violet-400" />
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
          <div v-else class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t`Bank:` }}</span>
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ detectedBank || t`Unknown` }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t`Transactions:` }}</span>
              <span class="text-sm font-bold text-violet-600 dark:text-violet-400">{{ transactions.length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t`File:` }}</span>
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400 truncate ml-2" :title="fileName">{{ fileName }}</span>
            </div>
          </div>
        </div>

        <!-- Column Mapping -->
        <div
          v-if="transactions.length > 0"
          class="p-6 border-b border-gray-200 dark:border-gray-800 overflow-y-auto bg-white/50 dark:bg-gray-800/50"
          style="max-height: 300px"
        >
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <feather-icon name="settings" class="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
            {{ t`Column Mapping` }}
          </h3>
          <div class="space-y-4">
            <div v-for="field in mappingFields" :key="field.key" class="space-y-2">
              <label
                class="text-xs font-medium text-gray-600 dark:text-gray-400 block"
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
                class="w-full"
                @change="(value) => updateMapping(field.key, value)"
              />
            </div>
          </div>
        </div>

        <!-- Import Profile -->
        <div v-if="transactions.length > 0" class="p-6 flex-1 overflow-y-auto bg-white/30 dark:bg-gray-800/30">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <feather-icon name="bookmark" class="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
            {{ t`Saved Profiles` }}
          </h3>
          <div v-if="savedProfiles.length > 0" class="space-y-3">
            <div
              v-for="profile in savedProfiles"
              :key="profile.name"
              class="p-3 rounded-lg cursor-pointer text-sm transition-all duration-200 hover:shadow-md"
              :class="
                selectedProfile?.name === profile.name
                  ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700'
                  : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
              "
              @click="applyProfile(profile)"
            >
              <div class="font-semibold mb-1">{{ profile.bankName }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <feather-icon name="clock" class="w-3 h-3 mr-1" />
                {{ t`Used ${profile.useCount} times` }}
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <feather-icon name="bookmark" class="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t`No saved profiles` }}
            </p>
          </div>
        </div>
      </div>

      <!-- Transaction Preview -->
      <div class="flex-1 overflow-hidden flex flex-col">
        <div
          v-if="transactions.length === 0"
          class="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
        >
          <div class="text-center max-w-md mx-auto p-12">
            <!-- Enhanced Icon Container -->
            <div class="relative mb-8">
              <div class="w-24 h-24 mx-auto bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <feather-icon
                  name="upload-cloud"
                  class="w-12 h-12 text-violet-600 dark:text-violet-400"
                />
              </div>
              <div class="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <feather-icon name="plus" class="w-4 h-4 text-white" />
              </div>
            </div>
            
            <!-- Enhanced Typography -->
            <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
              {{ t`Import Bank Statement` }}
            </h3>
            <p class="text-base text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {{
                t`Upload your bank statement (CSV, XLSX, or XLS) to automatically import and categorize transactions`
              }}
            </p>
            
            <!-- Enhanced Button -->
            <div class="space-y-4">
              <Button 
                type="primary" 
                size="large"
                class="px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                @click="selectFile"
              >
                <template #icon>
                  <feather-icon name="file-text" class="w-5 h-5 mr-2" />
                </template>
                {{ t`Select File` }}
              </Button>
              
              <!-- Sample File Button -->
              <div class="text-center">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {{ t`Try with a sample file` }}
                </p>
                <Button 
                  variant="ghost" 
                  size="small"
                  class="text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  @click="loadSampleFile"
                >
                  <template #icon>
                    <feather-icon name="download" class="w-4 h-4 mr-1" />
                  </template>
                  {{ t`Download Sample CSV` }}
                </Button>
              </div>
            </div>
            
            <!-- File Format Info -->
            <div class="mt-8 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                {{ t`Supported formats` }}
              </p>
              <div class="flex justify-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                <span class="flex items-center">
                  <feather-icon name="file-text" class="w-3 h-3 mr-1" />
                  CSV
                </span>
                <span class="flex items-center">
                  <feather-icon name="file" class="w-3 h-3 mr-1" />
                  XLSX
                </span>
                <span class="flex items-center">
                  <feather-icon name="file" class="w-3 h-3 mr-1" />
                  XLS
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex-1 overflow-auto custom-scroll custom-scroll-thumb1"
        >
          <!-- Preview Header -->
          <div
            class="sticky top-0 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                  <feather-icon name="eye" class="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {{ t`Preview (${transactions.length} transactions)` }}
                </h3>
              </div>
              <div class="flex gap-2">
                <Button 
                  size="small" 
                  variant="outline"
                  class="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  @click="reparse"
                >
                  <template #icon>
                    <feather-icon name="refresh-cw" class="w-4 h-4 mr-1" />
                  </template>
                  {{ t`Reparse` }}
                </Button>
              </div>
            </div>
          </div>

          <!-- Transaction Table -->
          <table class="w-full text-sm">
            <thead class="bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <tr>
                <th
                  class="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 w-16"
                >
                  #
                </th>
                <th
                  class="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 w-32"
                >
                  {{ t`Date` }}
                </th>
                <th
                  class="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                >
                  {{ t`Description` }}
                </th>
                <th
                  class="text-right p-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 w-32"
                >
                  {{ t`Amount` }}
                </th>
                <th
                  class="text-right p-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 w-32"
                >
                  {{ t`Balance` }}
                </th>
                <th
                  class="text-center p-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 w-24"
                >
                  {{ t`Type` }}
                </th>
                <th
                  class="p-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 w-40"
                >
                  {{ t`Category` }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(txn, index) in displayTransactions"
                :key="index"
                class="hover:bg-violet-50/50 dark:hover:bg-gray-800/50 transition-colors duration-150"
              >
                <td
                  class="p-4 border-b border-gray-100 dark:border-gray-800 text-gray-500 font-medium"
                >
                  {{ index + 1 }}
                </td>
                <td class="p-4 border-b border-gray-100 dark:border-gray-800">
                  <span class="font-medium text-gray-800 dark:text-gray-200">
                    {{ txn.date }}
                  </span>
                </td>
                <td class="p-4 border-b border-gray-100 dark:border-gray-800">
                  <input
                    :value="txn.description"
                    class="w-full bg-transparent border-none focus:ring-2 focus:ring-violet-500/20 focus:outline-none p-2 rounded text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                    @input="updateDescription(index, $event)"
                  />
                </td>
                <td
                  class="p-4 border-b border-gray-100 dark:border-gray-800 text-right font-mono font-semibold"
                  :class="txn.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                >
                  {{ formatCurrency(txn.amount) }}
                </td>
                <td
                  class="p-4 border-b border-gray-100 dark:border-gray-800 text-right font-mono text-gray-500 dark:text-gray-400"
                >
                  {{ txn.balance ? formatCurrency(txn.balance) : '-' }}
                </td>
                <td
                  class="p-4 border-b border-gray-100 dark:border-gray-800 text-center"
                >
                  <span
                    class="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center"
                    :class="
                      txn.type === 'credit'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    "
                  >
                    <feather-icon 
                      :name="txn.type === 'credit' ? 'arrow-up-circle' : 'arrow-down-circle'" 
                      class="w-3 h-3 mr-1" 
                    />
                    {{ txn.type === 'credit' ? t`CR` : t`DR` }}
                  </span>
                </td>
                <td class="p-4 border-b border-gray-100 dark:border-gray-800">
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
    async loadSampleFile() {
      try {
        // Sample bank statement data (matching the CSV structure)
        const sampleData = `Date,Description,Amount,Balance,Type,Reference,Cheque No
01/01/2024,Opening Balance,50000.00,50000.00,Credit,,,
02/01/2024,UPI/501234567890@upi,5000.00,45000.00,Debit,UPI/501234567890,
03/01/2024,SALARY JAN 2024,25000.00,70000.00,Credit,TRF20240103001,
05/01/2024,UPI/987654321098@upi,1500.00,68500.00,Debit,UPI/987654321098,
08/01/2024,NEFT TRANSFER TO HDFC BANK 1234,5000.00,63500.00,Debit,NEFT230108123456,
10/01/2024,ELECTRICITY BILL PAYMENT,2500.00,61000.00,Debit,EB202401100123,
12/01/2024,RENT PAYMENT,15000.00,46000.00,Debit,RNT20240112001,
15/01/2024,UPI/555555555555@upi,750.00,45250.00,Debit,UPI/555555555555,
18/01/2024,INTEREST CREDIT,150.00,45400.00,Credit,INT20240118001,
20/01/2024,ATM WITHDRAWAL,2000.00,43400.00,Debit,ATM1234567890,
22/01/2024,FUEL STATION PAYMENT,3000.00,40400.00,Debit,FUEL20240122001,
25/01/2024,ONLINE SHOPPING,4500.00,35900.00,Debit,SHOP20240125001,
28/01/2024,UPI/111111111111@upi,2000.00,33900.00,Debit,UPI/111111111111,
30/01/2024,MOBILE RECHARGE,199.00,33701.00,Debit,REC20240130001,`;

        const encoder = new TextEncoder();
        const data = encoder.encode(sampleData);
        this.fileName = 'sample_bank_statement.csv';

        const result = parseStatementFile(this.fileName, data);
        this.transactions = result.transactions;
        this.detectedBank = 'HDFC Bank'; // Sample bank
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

        showToast({
          type: 'success',
          message: t`Loaded sample data with ${this.transactions.length} transactions`,
        });
      } catch (error) {
        showToast({
          type: 'error',
          message: t`Failed to load sample file: ${(error as Error).message}`,
        });
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
