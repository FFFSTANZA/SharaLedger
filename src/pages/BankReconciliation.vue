<template>
  <div class="flex flex-col overflow-hidden w-full h-full bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ t`Bank Reconciliation` }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ t`Categorize and post bank transactions to General Ledger` }}
          </p>
        </div>
        <div class="flex space-x-3">
          <Button
            :title="t`Auto-categorize`"
            type="secondary"
            @click="autoCategorizeAll"
            :loading="autoCategorizing"
          >
            {{ t`Auto-categorize` }}
          </Button>
          <Button
            v-if="selectedTransactions.length > 0"
            :title="t`Post ${selectedTransactions.length} to GL`"
            type="primary"
            @click="postSelectedToGL"
            :loading="posting"
          >
            {{ t`Post ${selectedTransactions.length} to GL` }}
          </Button>
          <Button
            :title="t`Refresh`"
            @click="loadTransactions"
          >
            <feather-icon name="refresh-cw" class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Bank Account Selector -->
    <div class="px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div class="flex items-center space-x-4">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t`Bank Account:` }}
        </label>
        <AutoComplete
          :df="{
            fieldname: 'bankAccount',
            label: t`Bank Account`,
            fieldtype: 'AutoComplete',
          }"
          :value="selectedBankAccount"
          @change="onBankAccountChange"
          :suggestions="bankAccountSuggestions"
          :border="true"
          size="small"
          class="w-80"
        />
        <div class="flex items-center space-x-4 text-sm">
          <div class="flex items-center space-x-2">
            <span class="text-gray-500 dark:text-gray-400">{{ t`Unreconciled:` }}</span>
            <span class="font-semibold text-gray-900 dark:text-gray-100">{{ unreconciledCount }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-gray-500 dark:text-gray-400">{{ t`Total:` }}</span>
            <span class="font-semibold text-gray-900 dark:text-gray-100">{{ transactions.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="flex-1 overflow-auto">
      <table class="w-full">
        <thead class="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
          <tr>
            <th class="px-4 py-3 text-left">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
                class="w-4 h-4 rounded border-gray-300"
              />
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              {{ t`Date` }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              {{ t`Description` }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              {{ t`Account` }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              {{ t`Party` }}
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              {{ t`Debit` }}
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              {{ t`Credit` }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              {{ t`Status` }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              {{ t`Voucher` }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          <tr
            v-for="txn in transactions"
            :key="txn.name"
            :class="{
              'bg-blue-50 dark:bg-blue-900/20': selectedTransactions.includes(txn.name),
              'hover:bg-gray-50 dark:hover:bg-gray-800': true
            }"
          >
            <!-- Checkbox -->
            <td class="px-4 py-3">
              <input
                type="checkbox"
                v-if="txn.status === 'Unreconciled'"
                :checked="selectedTransactions.includes(txn.name)"
                @change="toggleSelect(txn.name)"
                class="w-4 h-4 rounded border-gray-300"
              />
            </td>

            <!-- Date -->
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
              {{ formatDate(txn.date) }}
            </td>

            <!-- Description -->
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
              <div class="max-w-xs truncate" :title="txn.description">
                {{ txn.description }}
              </div>
            </td>

            <!-- Account (Editable) -->
            <td class="px-4 py-3">
              <AutoComplete
                v-if="txn.status === 'Unreconciled'"
                :df="{
                  fieldname: 'account',
                  label: t`Account`,
                  fieldtype: 'AutoComplete',
                }"
                :value="txn.account || ''"
                @change="(value) => updateTransaction(txn.name, 'account', value)"
                :suggestions="accountSuggestions"
                :border="true"
                size="small"
                class="min-w-[200px]"
              />
              <span v-else class="text-sm text-gray-700 dark:text-gray-300">
                {{ txn.account }}
              </span>
            </td>

            <!-- Party (Editable) -->
            <td class="px-4 py-3">
              <input
                v-if="txn.status === 'Unreconciled'"
                type="text"
                :value="txn.party || ''"
                @input="(e) => updateTransaction(txn.name, 'party', e.target.value)"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                :placeholder="t`Optional`"
              />
              <span v-else class="text-sm text-gray-700 dark:text-gray-300">
                {{ txn.party || '-' }}
              </span>
            </td>

            <!-- Debit -->
            <td class="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100 whitespace-nowrap">
              {{ txn.type === 'Debit' ? formatCurrency(txn.amount) : '-' }}
            </td>

            <!-- Credit -->
            <td class="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100 whitespace-nowrap">
              {{ txn.type === 'Credit' ? formatCurrency(txn.amount) : '-' }}
            </td>

            <!-- Status -->
            <td class="px-4 py-3">
              <span
                :class="{
                  'px-2 py-1 text-xs rounded-full': true,
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': txn.status === 'Unreconciled',
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': txn.status === 'Reconciled'
                }"
              >
                {{ txn.status }}
              </span>
            </td>

            <!-- Voucher -->
            <td class="px-4 py-3">
              <a
                v-if="txn.postedVoucher"
                @click="openVoucher(txn.postedVoucherType, txn.postedVoucher)"
                class="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {{ txn.postedVoucher }}
              </a>
              <span v-else class="text-sm text-gray-400">-</span>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="transactions.length === 0 && !loading">
            <td colspan="9" class="px-4 py-12 text-center">
              <div class="flex flex-col items-center justify-center">
                <feather-icon name="inbox" class="w-12 h-12 text-gray-400 mb-3" />
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  {{ t`No bank transactions found` }}
                </p>
                <p class="text-gray-500 dark:text-gray-500 text-xs mt-1">
                  {{ t`Import bank statements to get started` }}
                </p>
              </div>
            </td>
          </tr>

          <!-- Loading State -->
          <tr v-if="loading">
            <td colspan="9" class="px-4 py-12 text-center">
              <div class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-gray-600 dark:text-gray-400">{{ t`Loading...` }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { t } from 'fyo';
import { DateTime } from 'luxon';
import Button from 'src/components/Button.vue';
import AutoComplete from 'src/components/Controls/AutoComplete.vue';
import { autoCategorizeMultiple, applyCategorization } from 'src/banking/autoCategorize';
import { postMultipleBankTransactions } from 'src/banking/postToGL';
import { fyo } from 'src/initFyo';
import { showToast } from 'src/utils/interactive';

interface BankTransaction {
  name: string;
  date: string;
  description: string;
  amount: number;
  type: 'Credit' | 'Debit';
  bankAccount: string;
  account?: string;
  party?: string;
  status: 'Unreconciled' | 'Reconciled';
  postedVoucher?: string;
  postedVoucherType?: string;
  notes?: string;
  reference?: string;
}

export default defineComponent({
  name: 'BankReconciliation',
  components: {
    Button,
    AutoComplete,
  },
  data() {
    return {
      transactions: [] as BankTransaction[],
      selectedTransactions: [] as string[],
      selectedBankAccount: '',
      bankAccountSuggestions: [] as string[],
      accountSuggestions: [] as string[],
      loading: false,
      autoCategorizing: false,
      posting: false,
      updateTimeout: null as any,
    };
  },
  computed: {
    unreconciledCount(): number {
      return this.transactions.filter(t => t.status === 'Unreconciled').length;
    },
    allSelected(): boolean {
      const unreconciled = this.transactions.filter(t => t.status === 'Unreconciled');
      return unreconciled.length > 0 && this.selectedTransactions.length === unreconciled.length;
    },
  },
  async mounted() {
    await this.loadBankAccounts();
    await this.loadAccounts();
    await this.loadTransactions();
  },
  methods: {
    t,
    
    async loadBankAccounts() {
      try {
        const accounts = await fyo.db.getAllRaw('Account', {
          filters: { accountType: 'Bank' },
          fields: ['name'],
        });
        this.bankAccountSuggestions = accounts.map((a: any) => a.name as string);
        
        if (this.bankAccountSuggestions.length > 0 && !this.selectedBankAccount) {
          this.selectedBankAccount = this.bankAccountSuggestions[0];
        }
      } catch (error) {
        console.error('Error loading bank accounts:', error);
      }
    },

    async loadAccounts() {
      try {
        const accounts = await fyo.db.getAllRaw('Account', {
          filters: { isGroup: false },
          fields: ['name'],
        });
        this.accountSuggestions = accounts.map((a: any) => a.name as string);
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    },

    async loadTransactions() {
      this.loading = true;
      try {
        const filters: any = {};
        
        if (this.selectedBankAccount) {
          filters.bankAccount = this.selectedBankAccount;
        }

        const txns = await fyo.db.getAllRaw('BankTransaction', {
          filters,
          fields: ['*'],
          orderBy: 'date',
          order: 'desc',
        });

        this.transactions = txns as BankTransaction[];
      } catch (error: any) {
        console.error('Error loading transactions:', error);
        showToast({
          type: 'error',
          message: t`Failed to load transactions: ${error.message}`,
        });
      } finally {
        this.loading = false;
      }
    },

    async onBankAccountChange(value: string) {
      this.selectedBankAccount = value;
      this.selectedTransactions = [];
      await this.loadTransactions();
    },

    toggleSelect(name: string) {
      const index = this.selectedTransactions.indexOf(name);
      if (index > -1) {
        this.selectedTransactions.splice(index, 1);
      } else {
        this.selectedTransactions.push(name);
      }
    },

    toggleSelectAll() {
      if (this.allSelected) {
        this.selectedTransactions = [];
      } else {
        this.selectedTransactions = this.transactions
          .filter(t => t.status === 'Unreconciled')
          .map(t => t.name);
      }
    },

    async updateTransaction(name: string, field: string, value: any) {
      try {
        const txn = this.transactions.find(t => t.name === name);
        if (!txn) return;

        // Update local state immediately
        (txn as any)[field] = value;

        // Debounce the database update
        if (this.updateTimeout) {
          clearTimeout(this.updateTimeout);
        }

        this.updateTimeout = setTimeout(async () => {
          try {
            const doc = await fyo.doc.getDoc('BankTransaction', name);
            await doc.setAndSync({ [field]: value });
          } catch (error: any) {
            console.error('Error updating transaction:', error);
            showToast({
              type: 'error',
              message: t`Failed to update: ${error.message}`,
            });
          }
        }, 500);
      } catch (error) {
        console.error('Error updating transaction:', error);
      }
    },

    async autoCategorizeAll() {
      this.autoCategorizing = true;
      try {
        const uncategorized = this.transactions.filter(
          t => t.status === 'Unreconciled' && !t.account
        );

        if (uncategorized.length === 0) {
          showToast({
            type: 'info',
            message: t`All transactions are already categorized`,
          });
          return;
        }

        const suggestions = await autoCategorizeMultiple(fyo, uncategorized);
        
        let count = 0;
        for (const [name, suggestion] of suggestions) {
          await applyCategorization(fyo, name, suggestion);
          count++;
        }

        await this.loadTransactions();
        
        showToast({
          type: 'success',
          message: t`Auto-categorized ${count} transactions`,
        });
      } catch (error: any) {
        console.error('Error auto-categorizing:', error);
        showToast({
          type: 'error',
          message: t`Failed to auto-categorize: ${error.message}`,
        });
      } finally {
        this.autoCategorizing = false;
      }
    },

    async postSelectedToGL() {
      this.posting = true;
      try {
        const selectedTxns = this.transactions.filter(
          t => this.selectedTransactions.includes(t.name)
        );

        // Validate all have accounts
        const missingAccount = selectedTxns.find(t => !t.account);
        if (missingAccount) {
          showToast({
            type: 'error',
            message: t`Please categorize all selected transactions before posting`,
          });
          return;
        }

        const results = await postMultipleBankTransactions(fyo, selectedTxns);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const [name, result] of results) {
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to post ${name}:`, result.error);
          }
        }

        await this.loadTransactions();
        this.selectedTransactions = [];

        if (errorCount === 0) {
          showToast({
            type: 'success',
            message: t`Posted ${successCount} transactions to GL`,
          });
        } else {
          showToast({
            type: 'warning',
            message: t`Posted ${successCount} transactions, ${errorCount} failed`,
          });
        }
      } catch (error: any) {
        console.error('Error posting to GL:', error);
        showToast({
          type: 'error',
          message: t`Failed to post to GL: ${error.message}`,
        });
      } finally {
        this.posting = false;
      }
    },

    formatDate(date: string): string {
      return DateTime.fromISO(date).toFormat('dd MMM yyyy');
    },

    formatCurrency(amount: number): string {
      return fyo.format(amount, 'Currency');
    },

    async openVoucher(voucherType: string, voucherName: string) {
      if (!voucherType || !voucherName) return;
      
      try {
        const doc = await fyo.doc.getDoc(voucherType, voucherName);
        await this.$router.push(`/edit/${voucherType}/${voucherName}`);
      } catch (error: any) {
        console.error('Error opening voucher:', error);
        showToast({
          type: 'error',
          message: t`Failed to open voucher: ${error.message}`,
        });
      }
    },
  },
});
</script>
