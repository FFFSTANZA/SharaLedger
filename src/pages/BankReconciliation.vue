<template>
  <div class="flex flex-col overflow-hidden w-full h-full">
    <!-- Header Bar -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {{ t`Bank Reconciliation` }}
      </h2>
      <div class="flex space-x-2">
        <Button
          :title="t`Auto-categorize All`"
          type="secondary"
          @click="autoCategorizeAll"
          :loading="loading"
        >
          {{ t`Auto-categorize All` }}
        </Button>
        <Button
          v-if="selectedCount > 0"
          :title="t`Post Selected to GL`"
          type="primary"
          @click="postSelected"
          :loading="posting"
        >
          {{ t`Post to GL (${selectedCount})` }}
        </Button>
        <Button
          :title="t`Refresh`"
          @click="loadTransactions"
        >
          {{ t`Refresh` }}
        </Button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Filters Sidebar -->
      <div class="w-80 border-e border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        <!-- Bank Account Filter -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <feather-icon name="filter" class="w-4 h-4 mr-2 text-blue-600" />
            {{ t`Filters` }}
          </h3>
          <div class="space-y-4">
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-2">{{ t`Bank Account` }}</label>
              <AutoComplete
                :df="{
                  fieldname: 'bankAccount',
                  label: t`Bank Account`,
                  fieldtype: 'AutoComplete',
                  target: 'Account',
                  placeholder: t`All accounts`
                }"
                class="w-full"
                :border="true"
                :value="filters.bankAccount"
                size="small"
                @change="updateFilter('bankAccount', $event)"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-2">{{ t`Status` }}</label>
              <Select
                :df="{
                  fieldname: 'status',
                  label: t`Status`,
                  fieldtype: 'Select',
                  options: [
                    { value: '', label: t`All` },
                    { value: 'Imported', label: t`Imported` },
                    { value: 'Reconciled', label: t`Reconciled` }
                  ]
                }"
                :value="filters.status"
                :border="true"
                size="small"
                class="w-full"
                @change="updateFilter('status', $event)"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-2">{{ t`Date From` }}</label>
              <input
                type="date"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                :value="filters.dateFrom"
                @change="updateFilter('dateFrom', $event.target.value)"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-2">{{ t`Date To` }}</label>
              <input
                type="date"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                :value="filters.dateTo"
                @change="updateFilter('dateTo', $event.target.value)"
              />
            </div>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="p-6 flex-1 overflow-y-auto">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <feather-icon name="bar-chart-2" class="w-4 h-4 mr-2 text-violet-600" />
            {{ t`Summary` }}
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <span class="text-sm text-blue-700 dark:text-blue-400">{{ t`Total Imported` }}</span>
              <span class="text-sm font-semibold text-blue-700 dark:text-blue-400">{{ summary.imported }}</span>
            </div>
            <div class="flex justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <span class="text-sm text-green-700 dark:text-green-400">{{ t`Reconciled` }}</span>
              <span class="text-sm font-semibold text-green-700 dark:text-green-400">{{ summary.reconciled }}</span>
            </div>
            <div class="flex justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
              <span class="text-sm text-purple-700 dark:text-purple-400">{{ t`Pending` }}</span>
              <span class="text-sm font-semibold text-purple-700 dark:text-purple-400">{{ summary.pending }}</span>
            </div>
            <div class="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded mt-4">
              <span class="text-sm text-gray-700 dark:text-gray-300 font-medium">{{ t`Total` }}</span>
              <span class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ summary.total }}</span>
            </div>
          </div>

          <!-- Help Text -->
          <div class="mt-6 p-3 bg-blue-50 dark:bg-blue-900/10 rounded">
            <h4 class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">{{ t`How it works` }}</h4>
            <div class="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <p>{{ t`1. Import bank statements` }}</p>
              <p>{{ t`2. Auto-categorize transactions` }}</p>
              <p>{{ t`3. Review & edit suggestions` }}</p>
              <p>{{ t`4. Post to General Ledger` }}</p>
              <p>{{ t`5. Mark as Reconciled` }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="flex-1 overflow-auto">
        <div v-if="loading" class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-4 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p class="text-gray-600 dark:text-gray-400">{{ t`Loading transactions...` }}</p>
          </div>
        </div>

        <div v-else-if="transactions.length === 0" class="flex items-center justify-center h-full">
          <div class="text-center max-w-lg mx-auto p-8">
            <div class="w-20 h-20 mx-auto bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <feather-icon name="inbox" class="w-10 h-10 text-gray-400" />
            </div>
            <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {{ t`No Transactions Found` }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              {{ t`No bank transactions match your filter criteria.` }}
            </p>
            <Button type="primary" @click="clearFilters">{{ t`Clear Filters` }}</Button>
          </div>
        </div>

        <table v-else class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
            <tr>
              <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-8">
                <input
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-600"
                  :checked="allSelected"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-24">{{ t`Date` }}</th>
              <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400">{{ t`Description` }}</th>
              <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-20">{{ t`Ref No` }}</th>
              <th class="text-right p-3 font-medium text-gray-600 dark:text-gray-400 w-24">{{ t`Amount` }}</th>
              <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-32">{{ t`Ledger Account` }}</th>
              <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-32">{{ t`Voucher Type` }}</th>
              <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-24">{{ t`Party` }}</th>
              <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-24">{{ t`Status` }}</th>
              <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-20">{{ t`Actions` }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="txn in transactions"
              :key="txn.name"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td class="p-3">
                <input
                  v-if="txn.status !== 'Reconciled'"
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-600"
                  :checked="isSelected(txn.name)"
                  @change="toggleSelection(txn.name)"
                />
              </td>
              <td class="p-3 text-gray-800 dark:text-gray-200 font-medium">
                {{ formatDate(txn.date) }}
              </td>
              <td class="p-3">
                <div class="text-gray-800 dark:text-gray-200">{{ txn.description }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>{{ txn.bankName }}</span>
                  <span
                    v-if="txn.matchedDocument"
                    class="ml-2 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-400 font-mono text-[10px]"
                  >
                    {{ txn.matchedDocumentType }}: {{ txn.matchedDocument }}
                  </span>
                </div>
              </td>
              <td class="p-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                {{ txn.reference || txn.chequeNo || '-' }}
              </td>
              <td
                class="p-3 text-right font-mono font-medium"
                :class="txn.type === 'Credit' ? 'text-green-600' : 'text-red-600'"
              >
                {{ formatCurrency(txn.amount) }}
              </td>
              <td class="p-3">
                <input
                  v-if="txn.status !== 'Reconciled'"
                  type="text"
                  class="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  :value="txn.suggestedLedger || ''"
                  @change="updateTransaction(txn, 'suggestedLedger', $event.target.value)"
                  :placeholder="t`Account name`"
                />
                <span v-else class="text-gray-700 dark:text-gray-300">{{ txn.suggestedLedger || '-' }}</span>
              </td>
              <td class="p-3">
                <select
                  v-if="txn.status !== 'Reconciled'"
                  class="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  :value="txn.suggestedVoucherType || (txn.type === 'Credit' ? 'Receipt' : 'Payment')"
                  @change="updateTransaction(txn, 'suggestedVoucherType', $event.target.value)"
                >
                  <option value="Payment">{{ t`Payment` }}</option>
                  <option value="Receipt">{{ t`Receipt` }}</option>
                  <option value="Transfer">{{ t`Transfer` }}</option>
                  <option value="Journal Entry">{{ t`Journal Entry` }}</option>
                </select>
                <span v-else class="text-gray-700 dark:text-gray-300">{{ txn.suggestedVoucherType || '-' }}</span>
              </td>
              <td class="p-3">
                <input
                  v-if="txn.status !== 'Reconciled'"
                  type="text"
                  class="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  :value="txn.party || ''"
                  @change="updateTransaction(txn, 'party', $event.target.value)"
                  :placeholder="t`Party name`"
                />
                <span v-else class="text-gray-700 dark:text-gray-300">{{ txn.party || '-' }}</span>
              </td>
              <td class="p-3">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="getStatusClass(txn.status)"
                >
                  {{ txn.status }}
                </span>
              </td>
              <td class="p-3">
                <div class="flex space-x-2">
                  <Button
                    v-if="txn.status !== 'Reconciled' && !txn.suggestedLedger"
                    size="small"
                    type="secondary"
                    @click="autoCategorizeSingle(txn)"
                    :loading="loadingSingle === txn.name"
                  >
                    {{ t`Suggest` }}
                  </Button>
                  <Button
                    v-if="txn.status !== 'Reconciled' && txn.suggestedLedger"
                    size="small"
                    type="primary"
                    @click="postSingle(txn)"
                    :loading="postingSingle === txn.name"
                  >
                    {{ t`Post` }}
                  </Button>
                  <Button
                    v-if="txn.status === 'Reconciled'"
                    size="small"
                    type="secondary"
                    @click="unreconcileTransaction(txn)"
                  >
                    {{ t`Unreconcile` }}
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Post Confirmation Modal -->
    <Modal
      :open-modal="showPostModal"
      @closemodal="showPostModal = false"
    >
      <div class="w-form">
        <FormHeader :form-title="t`Post to General Ledger`" />
        <hr class="dark:border-gray-800" />
        <div class="p-6">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ t`Post ${selectedCount} transaction(s) to General Ledger?` }}
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-xs text-blue-700 dark:text-blue-400">
            {{ t`This will create Journal Entries and update your GL, Trial Balance, and P&L. Make sure all ledger accounts and parties exist.` }}
          </div>
        </div>
        <hr class="dark:border-gray-800" />
        <div class="flex justify-end p-4 space-x-2">
          <Button @click="showPostModal = false">{{ t`Cancel` }}</Button>
          <Button type="primary" @click="confirmPost" :loading="posting">{{ t`Post to GL` }}</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import Button from 'src/components/Button.vue';
import FormHeader from 'src/components/FormHeader.vue';
import Modal from 'src/components/Modal.vue';
import Select from 'src/components/Controls/Select.vue';
import AutoComplete from 'src/components/Controls/AutoComplete.vue';
import { fyo } from 'src/initFyo';
import { showToast } from 'src/utils/interactive';
import { DateTime } from 'luxon';
import { defineComponent } from 'vue';

interface BankTransaction {
  name: string;
  date: Date;
  description: string;
  type: string;
  amount: number;
  reference?: string;
  chequeNo?: string;
  bankName?: string;
  status: string;
  suggestedLedger?: string;
  suggestedVoucherType?: string;
  party?: string;
  matchedDocument?: string;
  matchedDocumentType?: string;
}

interface Filters {
  bankAccount?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export default defineComponent({
  name: 'BankReconciliation',
  components: {
    Button,
    FormHeader,
    Modal,
    Select,
    AutoComplete,
  },
  data() {
    return {
      transactions: [] as BankTransaction[],
      selectedTransactions: [] as string[],
      filters: {} as Filters,
      summary: {
        imported: 0,
        reconciled: 0,
        pending: 0,
        total: 0,
      },
      loading: false,
      loadingSingle: '',
      posting: false,
      postingSingle: '',
      showPostModal: false,
    };
  },
  computed: {
    allSelected(): boolean {
      const selectable = this.transactions.filter(t => t.status !== 'Reconciled');
      return selectable.length > 0 && selectable.every(t => this.selectedTransactions.includes(t.name));
    },
    selectedCount(): number {
      return this.selectedTransactions.length;
    },
  },
  async mounted() {
    await this.loadTransactions();
    await this.loadSummary();
  },
  methods: {
    async loadTransactions() {
      this.loading = true;
      try {
        let filters: any = {};
        
        if (this.filters.bankAccount) {
          filters.account = this.filters.bankAccount;
        }
        if (this.filters.status) {
          filters.status = this.filters.status;
        }
        if (this.filters.dateFrom) {
          filters.date = ['>=', this.filters.dateFrom];
        }
        if (this.filters.dateTo) {
          filters.date = [...(filters.date || []), '<=', this.filters.dateTo];
        }

        const transactions = await fyo.db.getAll('BankTransaction', {
          fields: [
            'name', 'date', 'description', 'amount', 'type', 'reference', 
            'chequeNo', 'bankName', 'status', 'suggestedLedger', 
            'suggestedVoucherType', 'party', 'matchedDocument', 'matchedDocumentType'
          ],
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          orderBy: 'date',
          order: 'desc',
        });

        this.transactions = transactions as BankTransaction[];
      } catch (error) {
        console.error('Failed to load transactions:', error);
        showToast({
          type: 'error',
          message: t`Failed to load transactions`,
        });
      } finally {
        this.loading = false;
      }
    },
    async loadSummary() {
      try {
        const summary = await fyo.db.getAll('BankTransaction', {
          fields: ['status'],
        });

        this.summary = {
          imported: summary.filter(s => s.status === 'Imported').length,
          reconciled: summary.filter(s => s.status === 'Reconciled').length,
          pending: summary.filter(s => s.status === 'Imported').length,
          total: summary.length,
        };
      } catch (error) {
        console.error('Failed to load summary:', error);
      }
    },
    async autoCategorizeAll() {
      if (this.transactions.length === 0) return;
      
      this.loading = true;
      let successCount = 0;
      const { autoCategorizeTransaction } = await import('src/banking/autoCategorize');

      for (const txn of this.transactions) {
        if (txn.status === 'Imported' && !txn.suggestedLedger) {
          try {
            await this.autoCategorizeSingle(txn);
            successCount++;
          } catch (error) {
            console.error(`Failed to categorize ${txn.name}:`, error);
          }
        }
      }

      showToast({
        type: 'success',
        message: t`Auto-categorized ${successCount} transactions`,
      });
      this.loading = false;
    },
    async autoCategorizeSingle(txn: BankTransaction) {
      try {
        this.loadingSingle = txn.name;
        const { autoCategorizeTransaction } = await import('src/banking/autoCategorize');
        const suggestion = await autoCategorizeTransaction(txn, fyo);

        // Get fresh doc instance
        const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
        
        doc.suggestedLedger = suggestion.account || '';
        doc.suggestedVoucherType = suggestion.voucherType || (txn.type === 'Credit' ? 'Receipt' : 'Payment');
        doc.party = suggestion.party || '';
        
        await doc.sync();

        // Update local transaction
        txn.suggestedLedger = suggestion.account;
        txn.suggestedVoucherType = suggestion.voucherType;
        txn.party = suggestion.party;
      } catch (error) {
        console.error('Failed to auto-categorize:', error);
        showToast({
          type: 'error',
          message: t`Failed to suggest: ${(error as Error).message}`,
        });
      } finally {
        this.loadingSingle = '';
      }
    },
    async updateTransaction(txn: BankTransaction, field: string, value: any) {
      try {
        const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
        (doc as any)[field] = value;
        await doc.sync();

        // Update local transaction
        (txn as any)[field] = value;
      } catch (error) {
        console.error('Failed to update transaction:', error);
        showToast({
          type: 'error',
          message: t`Failed to update transaction`,
        });
      }
    },
    async postSelected() {
      if (this.selectedCount === 0) return;
      this.showPostModal = true;
    },
    async postSingle(txn: BankTransaction) {
      if (!txn.suggestedLedger) {
        showToast({
          type: 'error',
          message: t`Please set a ledger account first`,
        });
        return;
      }
      this.postingSingle = txn.name;
      try {
        const result = await this.postTransactions([txn]);
        if (result.successCount > 0) {
          showToast({
            type: 'success',
            message: t`Transaction posted successfully`,
          });
          await this.loadTransactions();
          await this.loadSummary();
        }
      } catch (error) {
        console.error('Failed to post transaction:', error);
      } finally {
        this.postingSingle = '';
      }
    },
    async confirmPost() {
      this.showPostModal = false;
      this.posting = true;
      
      try {
        const selectedTxnList = this.transactions.filter(t => 
          this.selectedTransactions.includes(t.name) && 
          t.suggestedLedger &&
          t.status !== 'Reconciled'
        );

        const result = await this.postTransactions(selectedTxnList);
        
        if (result.successCount > 0) {
          showToast({
            type: 'success',
            message: t`${result.successCount} transaction(s) posted successfully`,
          });
          this.selectedTransactions = [];
          await this.loadTransactions();
          await this.loadSummary();
        }

        if (result.errorCount > 0) {
          showToast({
            type: 'error',
            message: t`${result.errorCount} transaction(s) failed to post`,
          });
        }
      } catch (error) {
        console.error('Failed to post transactions:', error);
        showToast({
          type: 'error',
          message: t`Failed to post transactions: ${(error as Error).message}`,
        });
      } finally {
        this.posting = false;
      }
    },
    async postTransactions(transactions: BankTransaction[]): Promise<{ successCount: number; errorCount: number }> {
      const { createGLVoucher } = await import('src/banking/glPosting');
      let successCount = 0;
      let errorCount = 0;

      for (const txn of transactions) {
        try {
          const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
          const result = await createGLVoucher(doc, fyo);

          if (result.success) {
            doc.status = 'Reconciled';
            doc.matchedDocument = result.voucherName;
            doc.matchedDocumentType = result.voucherType;
            await doc.sync();
            successCount++;
          } else {
            throw new Error(result.error || 'Unknown error during posting');
          }
        } catch (error) {
          console.error(`Failed to post transaction ${txn.name}:`, error);
          errorCount++;
        }
      }

      return { successCount, errorCount };
    },
    async unreconcileTransaction(txn: BankTransaction) {
      try {
        const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
        doc.status = 'Imported';
        doc.matchedDocument = '';
        doc.matchedDocumentType = '';
        await doc.sync();

        showToast({
          type: 'success',
          message: t`Transaction unreconciled`,
        });
        await this.loadTransactions();
        await this.loadSummary();
      } catch (error) {
        showToast({
          type: 'error',
          message: t`Failed to unreconcile transaction: ${(error as Error).message}`,
        });
      }
    },
    updateFilter(key: keyof Filters, value: any) {
      this.filters[key] = value;
      this.loadTransactions();
    },
    clearFilters() {
      this.filters = {};
      this.loadTransactions();
    },
    isSelected(name: string): boolean {
      return this.selectedTransactions.includes(name);
    },
    toggleSelection(name: string) {
      const index = this.selectedTransactions.indexOf(name);
      if (index > -1) {
        this.selectedTransactions.splice(index, 1);
      } else {
        this.selectedTransactions.push(name);
      }
    },
    toggleSelectAll() {
      const selectable = this.transactions.filter(t => t.status !== 'Reconciled');
      if (this.allSelected) {
        this.selectedTransactions = [];
      } else {
        this.selectedTransactions = selectable.map(t => t.name);
      }
    },
    getStatusClass(status: string): string {
      switch (status) {
        case 'Imported':
          return 'bg-blue-100 text-blue-700';
        case 'Reconciled':
          return 'bg-green-100 text-green-700';
        default:
          return 'bg-gray-100 text-gray-700';
      }
    },
    formatDate(date: Date | string): string {
      const dt = DateTime.fromJSDate(new Date(date));
      return dt.toFormat('dd/MM/yyyy');
    },
    formatCurrency(amount: number): string {
      return fyo.format(amount, 'Currency');
    },
  },
});
</script>