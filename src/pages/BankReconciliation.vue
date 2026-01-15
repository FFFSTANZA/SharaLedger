<template>
  <div class="flex flex-col overflow-hidden w-full h-full">
    <!-- Header Bar -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {{ t`Bank Reconciliation` }}
      </h2>
      <div class="flex space-x-2">
        <Button
          v-if="availableMatchesCount > 0"
          :title="t`Auto-match All`"
          type="secondary"
          @click="autoMatchAll"
        >
          {{ t`Auto-match All` }}
        </Button>
        <Button
          v-if="postableSelectedCount > 0"
          :title="t`Post Selected`"
          type="primary"
          @click="postSelected"
        >
          {{ t`Post Selected (${postableSelectedCount})` }}
        </Button>
        <Button
          v-if="reconcilableSelectedCount > 0"
          :title="t`Reconcile Selected`"
          type="secondary"
          @click="reconcileSelected"
        >
          {{ t`Reconcile (${reconcilableSelectedCount})` }}
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
                    { value: 'Suggested', label: t`Suggested` },
                    { value: 'Posted', label: t`Posted` },
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
              <span class="text-sm text-blue-700 dark:text-blue-400">{{ t`Imported` }}</span>
              <span class="text-sm font-semibold text-blue-700 dark:text-blue-400">{{ summary.imported }}</span>
            </div>
            <div class="flex justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <span class="text-sm text-yellow-700 dark:text-yellow-400">{{ t`Suggested` }}</span>
              <span class="text-sm font-semibold text-yellow-700 dark:text-yellow-400">{{ summary.suggested }}</span>
            </div>
            <div class="flex justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <span class="text-sm text-orange-700 dark:text-orange-400">{{ t`Posted` }}</span>
              <span class="text-sm font-semibold text-orange-700 dark:text-orange-400">{{ summary.posted }}</span>
            </div>
            <div class="flex justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <span class="text-sm text-green-700 dark:text-green-400">{{ t`Reconciled` }}</span>
              <span class="text-sm font-semibold text-green-700 dark:text-green-400">{{ summary.reconciled }}</span>
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
              <p>{{ t`1. Transactions are Imported` }}</p>
              <p>{{ t`2. System Suggests ledgers` }}</p>
              <p>{{ t`3. Confirm to Post to GL` }}</p>
              <p>{{ t`4. Mark as Reconciled` }}</p>
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
              <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-32">{{ t`Status` }}</th>
              <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-32">{{ t`Suggested Ledger` }}</th>
              <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-32">{{ t`Voucher Type` }}</th>
              <th class="text-left p-3 font-medium text-gray-600 dark:text-gray-400 w-32">{{ t`Actions` }}</th>
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
                  v-if="txn.status === 'Imported' || txn.status === 'Posted'"
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-600"
                  :checked="isSelected(txn.name)"
                  @change="toggleSelection(txn.name, txn.status)"
                />
              </td>
              <td class="p-3 text-gray-800 dark:text-gray-200 font-medium">
                {{ formatDate(txn.date) }}
              </td>
              <td class="p-3">
                <div class="text-gray-800 dark:text-gray-200">{{ txn.description }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                  <span>{{ txn.bankName }}</span>
                  <span
                    v-if="txn.matchedDocument"
                    class="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-400 font-mono text-[10px] flex items-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    @click="viewMatchedDocument(txn)"
                  >
                    <feather-icon name="link" class="w-2.5 h-2.5 mr-1" />
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
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="getStatusClass(txn.status)"
                >
                  {{ txn.status }}
                </span>
              </td>
              <td class="p-3 text-gray-700 dark:text-gray-300">
                {{ txn.suggestedLedgerName || '-' }}
              </td>
              <td class="p-3 text-gray-700 dark:text-gray-300">
                {{ txn.suggestedVoucherType || '-' }}
              </td>
              <td class="p-3">
                <div class="flex space-x-2">
                  <Button
                    v-if="(txn.status === 'Imported' || txn.status === 'Suggested') && txn.potentialMatches?.length"
                    size="small"
                    type="secondary"
                    class="!bg-green-50 !text-green-700 !border-green-200"
                    @click="showMatch(txn)"
                  >
                    {{ t`Match` }}
                  </Button>
                  <Button
                    v-if="txn.status === 'Imported'"
                    size="small"
                    type="secondary"
                    @click="suggestSingle(txn)"
                  >
                    {{ t`Suggest` }}
                  </Button>
                  <Button
                    v-if="txn.status === 'Suggested'"
                    size="small"
                    type="primary"
                    @click="postTransaction(txn)"
                  >
                    {{ t`Post` }}
                  </Button>
                  <Button
                    v-if="txn.status === 'Posted'"
                    size="small"
                    type="secondary"
                    @click="reconcileTransaction(txn)"
                  >
                    {{ t`Reconcile` }}
                  </Button>
                  <Button
                    v-if="txn.status === 'Reconciled'"
                    size="small"
                    type="secondary"
                    @click="unreconcileTransaction(txn)"
                  >
                    {{ t`Unreconcile` }}
                  </Button>
                  <Button
                    v-if="txn.status === 'Posted'"
                    size="small"
                    variant="ghost"
                    class="text-red-600 hover:text-red-700 hover:bg-red-50"
                    @click="unmatchTransaction(txn)"
                  >
                    <feather-icon name="link-2" class="w-3 h-3 mr-1" />
                    {{ t`Unmatch` }}
                  </Button>
                  <Button
                    v-if="txn.status === 'Imported' || txn.status === 'Suggested'"
                    size="small"
                    variant="ghost"
                    @click="editSuggestion(txn)"
                  >
                    <feather-icon name="edit-2" class="w-3 h-3" />
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
        <FormHeader :form-title="t`Confirm Posting`" />
        <hr class="dark:border-gray-800" />
        <div class="p-6">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ t`Post ${selectedCount} transaction(s) to General Ledger?` }}
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-xs text-blue-700 dark:text-blue-400">
            {{ t`This will create Journal Entries and update your GL, Trial Balance, and P&L.` }}
          </div>
        </div>
        <hr class="dark:border-gray-800" />
        <div class="flex justify-end p-4 space-x-2">
          <Button @click="showPostModal = false">{{ t`Cancel` }}</Button>
          <Button type="primary" @click="confirmPost">{{ t`Post to GL` }}</Button>
        </div>
      </div>
    </Modal>

    <!-- Reconcile Confirmation Modal -->
    <Modal
      :open-modal="showReconcileModal"
      @closemodal="showReconcileModal = false"
    >
      <div class="w-form">
        <FormHeader :form-title="t`Confirm Reconciliation`" />
        <hr class="dark:border-gray-800" />
        <div class="p-6">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ t`Mark ${reconcileCount} transaction(s) as reconciled with bank statement?` }}
          </p>
        </div>
        <hr class="dark:border-gray-800" />
        <div class="flex justify-end p-4 space-x-2">
          <Button @click="showReconcileModal = false">{{ t`Cancel` }}</Button>
          <Button type="primary" @click="confirmReconcile">{{ t`Reconcile` }}</Button>
        </div>
      </div>
    </Modal>

    <!-- Edit Suggestion Modal -->
    <Modal
      :open-modal="showEditModal"
      @closemodal="showEditModal = false"
    >
      <div class="w-[500px]">
        <FormHeader :form-title="t`Edit Suggestion`" />
        <hr class="dark:border-gray-800" />
        <div class="p-6 space-y-4">
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 block mb-2">{{ t`Ledger` }}</label>
            <AutoComplete
              :df="{
                fieldname: 'suggestedLedger',
                label: t`Ledger`,
                fieldtype: 'Link',
                target: 'Account'
              }"
              :value="editForm.suggestedLedger"
              @change="editForm.suggestedLedger = $event"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 block mb-2">{{ t`Voucher Type` }}</label>
            <Select
              :df="{
                fieldname: 'suggestedVoucherType',
                label: t`Voucher Type`,
                fieldtype: 'Select',
                options: [
                  { value: 'Payment', label: t`Payment` },
                  { value: 'Receipt', label: t`Receipt` },
                  { value: 'Journal Entry', label: t`Journal Entry` },
                  { value: 'Transfer', label: t`Transfer` }
                ]
              }"
              :value="editForm.suggestedVoucherType"
              @change="editForm.suggestedVoucherType = $event"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 block mb-2">{{ t`Party (Optional)` }}</label>
            <AutoComplete
              :df="{
                fieldname: 'party',
                label: t`Party`,
                fieldtype: 'Link',
                target: 'Party'
              }"
              :value="editForm.party"
              @change="editForm.party = $event"
            />
          </div>
        </div>
        <hr class="dark:border-gray-800" />
        <div class="flex justify-end p-4 space-x-2">
          <Button @click="showEditModal = false">{{ t`Cancel` }}</Button>
          <Button type="primary" @click="saveSuggestion">{{ t`Save` }}</Button>
        </div>
      </div>
    </Modal>

    <!-- Match Modal -->
    <Modal
      :open-modal="showMatchModal"
      @closemodal="showMatchModal = false"
    >
      <div class="w-[600px]">
        <FormHeader :form-title="t`Potential Matches Found`" />
        <hr class="dark:border-gray-800" />
        <div class="p-6">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ t`We found existing transactions that match this bank entry.` }}
          </p>
          <div class="space-y-2 max-h-60 overflow-y-auto">
            <div
              v-for="m in matchingTransactions"
              :key="m.name"
              class="p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-between"
              @click="confirmMatch(m)"
            >
              <div>
                <div class="font-medium text-gray-900 dark:text-gray-100">{{ m.name }}</div>
                <div class="text-xs text-gray-500">{{ formatDate(m.date) }} • {{ m.type }}</div>
              </div>
              <div class="text-right">
                <div class="font-mono font-medium">{{ formatCurrency(m.amount) }}</div>
                <div class="text-xs text-blue-600">{{ t`Select to Match` }}</div>
              </div>
            </div>
          </div>
        </div>
        <hr class="dark:border-gray-800" />
        <div class="flex justify-end p-4">
          <Button @click="showMatchModal = false">{{ t`Cancel` }}</Button>
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
  suggestedLedgerName?: string;
  account?: string;
  party?: string;
  matchedDocument?: string;
  matchedDocumentType?: string;
  potentialMatches?: any[];
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
      loading: true,
      filters: {
        status: 'Imported',
      } as Filters,
      selectedTransactions: [] as string[],
      summary: {
        imported: 0,
        suggested: 0,
        posted: 0,
        reconciled: 0,
        total: 0,
      },
      showPostModal: false,
      showReconcileModal: false,
      showEditModal: false,
      showMatchModal: false,
      postAction: '' as 'selected' | 'single',
      reconcileAction: '' as 'selected' | 'single',
      currentTransaction: null as BankTransaction | null,
      matchingTransactions: [] as any[],
      editForm: {
        suggestedLedger: '',
        suggestedVoucherType: '',
        party: '',
      },
    };
  },
  computed: {
    allSelected(): boolean {
      const selectable = this.transactions.filter(
        t => t.status === 'Imported' || t.status === 'Suggested' || t.status === 'Posted'
      );
      return (
        selectable.length > 0 &&
        selectable.every(t => this.selectedTransactions.includes(t.name))
      );
    },
    selectedCount(): number {
      return this.selectedTransactions.length;
    },
    postableSelectedCount(): number {
      return this.transactions.filter(
        t => (t.status === 'Imported' || t.status === 'Suggested') && this.selectedTransactions.includes(t.name)
      ).length;
    },
    reconcilableSelectedCount(): number {
      return this.postedSelectedTransactions.length;
    },
    postedSelectedTransactions(): BankTransaction[] {
      return this.transactions.filter(
        t => t.status === 'Posted' && this.selectedTransactions.includes(t.name)
      );
    },
    availableMatchesCount(): number {
      return this.transactions.filter(
        t => (t.status === 'Imported' || t.status === 'Suggested') && t.potentialMatches?.length === 1
      ).length;
    },
    matchableTransactions(): BankTransaction[] {
      return this.transactions.filter(
        t => (t.status === 'Imported' || t.status === 'Suggested')
      );
    },
    reconcileCount(): number {
      return this.postedSelectedTransactions.length;
    },
  },
  mounted() {
    this.loadTransactions();
    this.loadSummary();
  },
  methods: {
    async loadTransactions() {
      this.loading = true;
      try {
        const filters: Record<string, any> = {};
        
        if (this.filters.bankAccount) {
          filters.account = this.filters.bankAccount;
        }
        if (this.filters.status) {
          filters.status = this.filters.status;
        }
        if (this.filters.dateFrom || this.filters.dateTo) {
          const dateFilter: any = {};
          if (this.filters.dateFrom) {
            dateFilter['>='] = this.filters.dateFrom;
          }
          if (this.filters.dateTo) {
            dateFilter['<='] = this.filters.dateTo;
          }
          filters.date = dateFilter;
        }

        const results = await fyo.db.getAll('BankTransaction', {
          filters,
          fields: [
            'name',
            'date',
            'description',
            'type',
            'amount',
            'reference',
            'chequeNo',
            'bankName',
            'status',
            'suggestedLedger',
            'suggestedVoucherType',
            'account',
            'party',
            'matchedDocument',
            'matchedDocumentType',
          ],
          orderBy: ['date', 'importOrder'],
          order: 'desc'
        });

        // Get suggested ledger names and find matches
        for (const txn of results) {
          if (txn.suggestedLedger) {
            const account = await fyo.db.get('Account', txn.suggestedLedger, 'name, accountName');
            txn.suggestedLedgerName = account?.accountName || txn.suggestedLedger;
          }
          
          if (txn.status === 'Imported' || txn.status === 'Suggested') {
            txn.potentialMatches = await this.findMatches(txn);
          }
        }

        this.transactions = results;
      } catch (error) {
        showToast({
          type: 'error',
          message: t`Failed to load transactions: ${(error as Error).message}`,
        });
      } finally {
        this.loading = false;
      }
    },
    async findMatches(txn: BankTransaction) {
      if (!txn.account) return [];
      try {
        const amount = Math.abs(txn.amount);
        const results = await fyo.db.getAll('Payment', {
          filters: {
            amount: amount,
          },
        });
        
        return results
          .filter(p => p.account === txn.account || p.paymentAccount === txn.account)
          .map(p => ({
            name: p.name,
            date: p.date,
            amount: p.amount,
            type: 'Payment',
          }));
      } catch (e) {
        console.error('Match search failed', e);
        return [];
      }
    },
    showMatch(txn: BankTransaction) {
      this.currentTransaction = txn;
      this.matchingTransactions = txn.potentialMatches || [];
      this.showMatchModal = true;
    },
    async confirmMatch(match: any) {
      if (!this.currentTransaction) return;
      await this.confirmMatchInternal(this.currentTransaction, match);
      this.showMatchModal = false;
      this.loadTransactions();
      this.loadSummary();
    },
    async confirmMatchInternal(txn: BankTransaction, match: any) {
      try {
        const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
        doc.status = 'Posted';
        doc.matchedDocument = match.name;
        doc.matchedDocumentType = match.type;
        await doc.sync();

        showToast({
          type: 'success',
          message: t`Transaction matched with ${match.name}`,
        });
      } catch (error) {
        showToast({
          type: 'error',
          message: t`Failed to match transaction ${txn.name}: ${(error as Error).message}`,
        });
      }
    },
    async autoMatchAll() {
      let matchedCount = 0;
      for (const txn of this.matchableTransactions) {
        if (txn.potentialMatches?.length === 1) {
          const match = txn.potentialMatches[0];
          await this.confirmMatchInternal(txn, match);
          matchedCount++;
        }
      }
      if (matchedCount > 0) {
        this.loadTransactions();
        this.loadSummary();
      } else {
        showToast({
          type: 'info',
          message: t`No definite matches found`,
        });
      }
    },
    async loadSummary() {
      try {
        const summary = await fyo.db.getAll('BankTransaction', {
          fields: ['status'],
        });

        this.summary = {
          imported: summary.filter(s => s.status === 'Imported').length,
          suggested: summary.filter(s => s.status === 'Suggested').length,
          posted: summary.filter(s => s.status === 'Posted').length,
          reconciled: summary.filter(s => s.status === 'Reconciled').length,
          total: summary.length,
        };
      } catch (error) {
        console.error('Failed to load summary:', error);
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
    toggleSelection(name: string, status: string) {
      if (status === 'Imported' || status === 'Suggested') {
        this.postAction = 'selected';
      } else if (status === 'Posted') {
        this.reconcileAction = 'selected';
      }

      const index = this.selectedTransactions.indexOf(name);
      if (index > -1) {
        this.selectedTransactions.splice(index, 1);
      } else {
        this.selectedTransactions.push(name);
      }
    },
    toggleSelectAll() {
      const selectable = this.transactions.filter(
        t => t.status === 'Imported' || t.status === 'Suggested' || t.status === 'Posted'
      );
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
        case 'Suggested':
          return 'bg-yellow-100 text-yellow-700';
        case 'Posted':
          return 'bg-orange-100 text-orange-700';
        case 'Reconciled':
          return 'bg-green-100 text-green-700';
        default:
          return 'bg-gray-100 text-gray-700';
      }
    },
    postSelected() {
      if (this.selectedTransactions.length === 0) return;
      this.postAction = 'selected';
      this.showPostModal = true;
    },
    async suggestSingle(txn: BankTransaction) {
      try {
        const { autoCategorizeTransaction } = await import('src/banking/autoCategorize');
        const suggestion = await autoCategorizeTransaction(txn, fyo);
        const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
        doc.status = 'Suggested';
        doc.suggestedLedger = suggestion.account;
        doc.suggestedVoucherType = suggestion.voucherType;
        await doc.sync();
        
        showToast({
          type: 'success',
          message: t`Suggestion generated for ${txn.name}`,
        });
        this.loadTransactions();
      } catch (error) {
        showToast({
          type: 'error',
          message: t`Failed to suggest: ${(error as Error).message}`,
        });
      }
    },
    async postTransaction(txn: BankTransaction) {
      this.postAction = 'single';
      this.currentTransaction = txn;
      this.showPostModal = true;
    },
    async unmatchTransaction(txn: BankTransaction) {
      try {
        const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
        doc.status = 'Imported';
        doc.matchedDocument = '';
        doc.matchedDocumentType = '';
        await doc.sync();

        showToast({
          type: 'success',
          message: t`Transaction unmatched`,
        });
        this.loadTransactions();
        this.loadSummary();
      } catch (error) {
        showToast({
          type: 'error',
          message: t`Failed to unmatch transaction: ${(error as Error).message}`,
        });
      }
    },
    async confirmPost() {
      this.showPostModal = false;
      try {
        let transactionsToProcess: BankTransaction[] = [];
        
        if (this.postAction === 'selected') {
          transactionsToProcess = this.transactions.filter(
            t => (t.status === 'Imported' || t.status === 'Suggested') && this.selectedTransactions.includes(t.name)
          );
        } else if (this.postAction === 'single' && this.currentTransaction) {
          transactionsToProcess = [this.currentTransaction];
        }

        let successCount = 0;
        const { autoCategorizeTransaction } = await import('src/banking/autoCategorize');
        const { createGLVoucher } = await import('src/banking/glPosting');

        for (const txn of transactionsToProcess) {
          try {
            if (txn.status === 'Imported') {
              // Step 1: Suggest
              const suggestion = await autoCategorizeTransaction(txn, fyo);
              const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
              doc.status = 'Suggested';
              doc.suggestedLedger = suggestion.account;
              doc.suggestedVoucherType = suggestion.voucherType;
              await doc.sync();
              successCount++;
            } else if (txn.status === 'Suggested') {
              // Step 2: Post to GL
              const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
              const result = await createGLVoucher(doc, fyo);
              
              if (result.success) {
                doc.status = 'Posted';
                doc.matchedDocument = result.voucherName;
                doc.matchedDocumentType = result.voucherType;
                await doc.sync();
                successCount++;
              } else {
                throw new Error(result.error);
              }
            }
          } catch (error) {
            console.error(`Failed to process transaction ${txn.name}:`, error);
          }
        }

        if (successCount > 0) {
          showToast({
            type: 'success',
            message: t`${successCount} transaction(s) processed.`,
          });
          this.selectedTransactions = [];
          this.loadTransactions();
          this.loadSummary();
        }
      } catch (error) {
        showToast({
          type: 'error',
          message: t`Failed to post transactions: ${(error as Error).message}`,
        });
      }
    },
    reconcileSelected() {
      if (this.postedSelectedTransactions.length === 0) return;
      this.reconcileAction = 'selected';
      this.showReconcileModal = true;
    },
    async reconcileTransaction(txn: BankTransaction) {
      this.reconcileAction = 'single';
      this.currentTransaction = txn;
      this.showReconcileModal = true;
    },
    async unreconcileTransaction(txn: BankTransaction) {
      try {
        const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
        doc.status = 'Posted';
        await doc.sync();

        showToast({
          type: 'success',
          message: t`Transaction unreconciled`,
        });
        this.loadTransactions();
        this.loadSummary();
      } catch (error) {
        showToast({
          type: 'error',
          message: t`Failed to unreconcile transaction: ${(error as Error).message}`,
        });
      }
    },
    async confirmReconcile() {
      this.showReconcileModal = false;
      try {
        let transactionsToReconcile: BankTransaction[] = [];
        
        if (this.reconcileAction === 'selected') {
          transactionsToReconcile = this.postedSelectedTransactions;
        } else if (this.reconcileAction === 'single' && this.currentTransaction) {
          transactionsToReconcile = [this.currentTransaction];
        }

        let successCount = 0;
        for (const txn of transactionsToReconcile) {
          try {
            const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
            doc.status = 'Reconciled';
            await doc.sync();
            successCount++;
          } catch (error) {
            console.error(`Failed to reconcile transaction ${txn.name}:`, error);
          }
        }

        if (successCount > 0) {
          showToast({
            type: 'success',
            message: t`${successCount} transaction(s) marked as reconciled.`,
          });
          this.selectedTransactions = [];
          this.loadTransactions();
          this.loadSummary();
        }
      } catch (error) {
        showToast({
          type: 'error',
          message: t`Failed to reconcile transactions: ${(error as Error).message}`,
        });
      }
    },
    async editSuggestion(txn: BankTransaction) {
      this.currentTransaction = txn;
      this.editForm = {
        suggestedLedger: txn.suggestedLedger || '',
        suggestedVoucherType: txn.suggestedVoucherType || (txn.type === 'Credit' ? 'Receipt' : 'Payment'),
        party: txn.party || '',
      };
      this.showEditModal = true;
    },
    async saveSuggestion() {
      if (!this.currentTransaction) return;
      try {
        const doc = await fyo.doc.getDoc('BankTransaction', this.currentTransaction.name);
        doc.suggestedLedger = this.editForm.suggestedLedger;
        doc.suggestedVoucherType = this.editForm.suggestedVoucherType;
        doc.party = this.editForm.party;
        doc.status = 'Suggested';
        await doc.sync();

        showToast({
          type: 'success',
          message: t`Suggestion updated successfully`,
        });
        this.showEditModal = false;
        this.loadTransactions();
      } catch (error) {
        showToast({
          type: 'error',
          message: t`Failed to update suggestion: ${(error as Error).message}`,
        });
      }
    },
    viewMatchedDocument(txn: BankTransaction) {
      if (txn.matchedDocument && txn.matchedDocumentType) {
        window.location.href = `/edit/${txn.matchedDocumentType}/${txn.matchedDocument}`;
      }
    },
    viewTransaction(txn: BankTransaction) {
      // Navigate to the transaction form
      const link = `/edit/BankTransaction/${txn.name}`;
      window.location.href = link;
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