<template>
  <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-20">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ t`Bank Reconciliation` }}</h1>
          <p class="text-sm text-gray-500 mt-1">{{ t`Review, categorize and match transactions to your books.` }}</p>
        </div>
        <div class="flex space-x-3">
          <Button variant="secondary" @click="autoCategorizeAll" :loading="autoCategorizing">
            <template #icon><feather-icon name="zap" class="w-4 h-4 mr-2" /></template>
            {{ t`Auto-Categorize` }}
          </Button>
          <Button v-if="selectedTransactions.length > 0" type="primary" @click="postSelectedToGL" :loading="posting">
            {{ t`Post ${selectedTransactions.length} to GL` }}
          </Button>
          <Button variant="secondary" @click="loadTransactions">
            <feather-icon name="refresh-cw" class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>

    <!-- Filters & Stats -->
    <div class="px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
      <div class="flex items-center space-x-6">
        <div class="w-72">
          <AutoComplete
            :df="{ fieldname: 'bankAccount', label: t`Filter by Bank Account`, fieldtype: 'AutoComplete' }"
            :value="selectedBankAccount"
            :suggestions="bankAccountSuggestions"
            @change="onBankAccountChange"
            size="small"
            :border="true"
          />
        </div>
        <div class="flex space-x-4 text-sm border-l border-gray-200 dark:border-gray-700 pl-6">
          <div class="flex flex-col">
            <span class="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{{ t`Unreconciled` }}</span>
            <span class="text-lg font-bold text-yellow-600">{{ unreconciledCount }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{{ t`Reconciled` }}</span>
            <span class="text-lg font-bold text-green-600">{{ reconciledCount }}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <span class="text-xs text-gray-500 uppercase font-bold">{{ t`Status:` }}</span>
        <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button 
            v-for="s in ['All', 'Unreconciled', 'Reconciled']" 
            :key="s"
            @click="filterStatus = s"
            class="px-3 py-1 text-xs rounded-md transition-all"
            :class="filterStatus === s ? 'bg-white dark:bg-gray-600 shadow-sm font-bold' : 'text-gray-500'"
          >
            {{ t(s) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Table Area -->
    <div class="flex-1 overflow-auto custom-scroll">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
          <tr>
            <th class="px-6 py-3 w-12">
              <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" class="rounded border-gray-300" />
            </th>
            <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider w-32">{{ t`Date` }}</th>
            <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">{{ t`Transaction Details` }}</th>
            <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider w-64">{{ t`Category / Match` }}</th>
            <th class="px-4 py-3 text-right font-bold text-gray-500 uppercase tracking-wider w-32">{{ t`Amount` }}</th>
            <th class="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider w-32">{{ t`Actions` }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
          <tr v-for="txn in filteredTransactions" :key="txn.name" 
            :class="[
              selectedTransactions.includes(txn.name) ? 'bg-blue-50/50 dark:bg-blue-900/10' : '',
              txn.status === 'Reconciled' ? 'opacity-75 bg-gray-50/30 dark:bg-gray-800/20' : ''
            ]"
            class="transition-colors group"
          >
            <td class="px-6 py-4">
              <input v-if="txn.status === 'Unreconciled'" type="checkbox" :checked="selectedTransactions.includes(txn.name)" @change="toggleSelect(txn.name)" class="rounded border-gray-300" />
              <feather-icon v-else name="check-circle" class="w-4 h-4 text-green-500" />
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-gray-500">{{ formatDate(txn.date) }}</td>
            <td class="px-4 py-4">
              <div class="font-medium text-gray-900 dark:text-gray-100 truncate max-w-md" :title="txn.description">{{ txn.description }}</div>
              <div class="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">{{ txn.bankAccount }} <span v-if="txn.reference" class="ml-2">• {{ txn.reference }}</span></div>
            </td>
            <td class="px-4 py-4">
              <div v-if="txn.status === 'Unreconciled'" class="space-y-2">
                <!-- Matching Suggestion -->
                <div v-if="txn.matchingVoucher" class="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-100 dark:border-green-800 flex items-center justify-between">
                  <div class="flex flex-col">
                    <span class="text-[10px] text-green-600 font-bold uppercase">{{ t`Potential Match` }}</span>
                    <span class="text-xs font-semibold">{{ txn.matchingVoucher }}</span>
                  </div>
                  <button @click="reconcileWithMatch(txn)" class="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                    {{ t`Match` }}
                  </button>
                </div>
                
                <!-- Categorization -->
                <div v-else class="flex flex-col space-y-2">
                  <AutoComplete
                    :df="{ fieldname: 'account', label: t`Account`, fieldtype: 'AutoComplete' }"
                    :value="txn.account || ''"
                    @change="(v) => updateTransaction(txn.name, 'account', v)"
                    :suggestions="accountSuggestions"
                    size="small"
                    :border="true"
                    :placeholder="t`Select account...`"
                  />
                  <div class="flex space-x-2">
                    <input 
                      type="text" 
                      :value="txn.party || ''" 
                      @change="(e) => updateTransaction(txn.name, 'party', e.target.value)"
                      class="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-transparent"
                      :placeholder="t`Party (Optional)`"
                    />
                  </div>
                </div>
              </div>
              <div v-else class="flex flex-col">
                <div class="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <span class="truncate">{{ txn.account || t`Matched` }}</span>
                </div>
                <div class="mt-1">
                  <a @click="openVoucher(txn.postedVoucherType, txn.postedVoucher)" class="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-bold uppercase">
                    {{ txn.postedVoucher }}
                  </a>
                </div>
              </div>
            </td>
            <td class="px-4 py-4 text-right">
              <div class="font-mono font-bold" :class="txn.type === 'Credit' ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(txn.amount) }}
              </div>
              <div class="text-[10px] text-gray-400 font-bold uppercase">{{ t(txn.type) }}</div>
            </td>
            <td class="px-4 py-4 text-center">
              <div v-if="txn.status === 'Unreconciled'" class="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1">
                <Button size="small" variant="ghost" @click="postTransaction(txn)" :title="t`Post to GL`" class="text-blue-600">
                  <feather-icon name="arrow-right-circle" class="w-4 h-4" />
                </Button>
                <Button size="small" variant="ghost" @click="createRuleFromTxn(txn)" :title="t`Create Rule`" class="text-yellow-600">
                  <feather-icon name="plus-circle" class="w-4 h-4" />
                </Button>
              </div>
              <div v-else>
                <feather-icon name="check" class="w-5 h-5 text-green-500 mx-auto" />
              </div>
            </td>
          </tr>
          <tr v-if="filteredTransactions.length === 0">
            <td colspan="6" class="px-6 py-24 text-center">
              <feather-icon name="coffee" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">{{ t`All caught up!` }}</h3>
              <p class="text-sm text-gray-500">{{ t`No transactions to reconcile in this view.` }}</p>
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
import { fyo } from 'src/initFyo';
import { showToast } from 'src/utils/interactive';

export default defineComponent({
  name: 'BankReconciliation',
  components: { Button, AutoComplete },
  data() {
    return {
      transactions: [] as any[],
      selectedTransactions: [] as string[],
      selectedBankAccount: '',
      bankAccountSuggestions: [] as string[],
      accountSuggestions: [] as string[],
      filterStatus: 'Unreconciled',
      loading: false,
      autoCategorizing: false,
      posting: false,
    };
  },
  computed: {
    filteredTransactions() {
      return this.transactions.filter(t => {
        if (this.filterStatus === 'All') return true;
        return t.status === this.filterStatus;
      });
    },
    unreconciledCount() { return this.transactions.filter(t => t.status === 'Unreconciled').length; },
    reconciledCount() { return this.transactions.filter(t => t.status === 'Reconciled').length; },
    allSelected() { 
      const unreconciled = this.filteredTransactions.filter(t => t.status === 'Unreconciled');
      return unreconciled.length > 0 && this.selectedTransactions.length === unreconciled.length;
    }
  },
  async mounted() {
    await this.loadBankAccounts();
    await this.loadAccounts();
    await this.loadTransactions();
  },
  methods: {
    t,
    async loadBankAccounts() {
      const accounts = await fyo.db.getAllRaw('Account', { filters: { accountType: 'Bank', isGroup: false }, fields: ['name'] });
      this.bankAccountSuggestions = accounts.map((a: any) => a.name);
      if (this.bankAccountSuggestions.length > 0) this.selectedBankAccount = this.bankAccountSuggestions[0];
    },
    async loadAccounts() {
      const accounts = await fyo.db.getAllRaw('Account', { filters: { isGroup: false }, fields: ['name'], orderBy: 'name' });
      this.accountSuggestions = accounts.map((a: any) => a.name);
    },
    async loadTransactions() {
      this.loading = true;
      try {
        const filters: any = {};
        if (this.selectedBankAccount) filters.bankAccount = this.selectedBankAccount;
        const txns = await fyo.db.getAllRaw('BankTransaction', { filters, fields: ['*'], orderBy: 'date', order: 'desc' });
        this.transactions = txns;
      } finally { this.loading = false; }
    },
    async onBankAccountChange(val: string) {
      this.selectedBankAccount = val;
      await this.loadTransactions();
    },
    toggleSelect(name: string) {
      const idx = this.selectedTransactions.indexOf(name);
      if (idx > -1) this.selectedTransactions.splice(idx, 1);
      else this.selectedTransactions.push(name);
    },
    toggleSelectAll() {
      if (this.allSelected) this.selectedTransactions = [];
      else this.selectedTransactions = this.filteredTransactions.filter(t => t.status === 'Unreconciled').map(t => t.name);
    },
    async updateTransaction(name: string, field: string, val: any) {
      const doc = await fyo.doc.getDoc('BankTransaction', name);
      await doc.setAndSync({ [field]: val });
      // Update local state
      const txn = this.transactions.find(t => t.name === name);
      if (txn) txn[field] = val;
    },
    async autoCategorizeAll() {
      this.autoCategorizing = true;
      try {
        const uncategorized = this.transactions.filter(t => t.status === 'Unreconciled');
        let count = 0;
        for (const txn of uncategorized) {
          const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
          await (doc as any).suggest();
          count++;
        }
        await this.loadTransactions();
        showToast({ type: 'success', message: t`Suggested categorization for ${count} transactions` });
      } finally { this.autoCategorizing = false; }
    },
    async postSelectedToGL() {
      this.posting = true;
      try {
        let success = 0;
        for (const txnName of this.selectedTransactions) {
          try {
            const doc = await fyo.doc.getDoc('BankTransaction', txnName);
            await (doc as any).postToGL();
            success++;
          } catch (e: any) {
            console.error(`Failed to post ${txnName}:`, e);
          }
        }
        await this.loadTransactions();
        this.selectedTransactions = [];
        showToast({ type: 'success', message: t`Successfully processed ${success} transactions.` });
      } finally { this.posting = false; }
    },
    async postTransaction(txn: any) {
      try {
        const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
        await (doc as any).postToGL();
        showToast({ type: 'success', message: t`Transaction posted successfully.` });
        await this.loadTransactions();
      } catch (e: any) {
        showToast({ type: 'error', message: e.message || 'Failed to post' });
      }
    },
    async reconcileWithMatch(txn: any) {
      try {
        const doc = await fyo.doc.getDoc('BankTransaction', txn.name);
        await (doc as any).postToGL();
        showToast({ type: 'success', message: t`Reconciled with existing voucher.` });
        await this.loadTransactions();
      } catch (e: any) {
        showToast({ type: 'error', message: e.message || 'Failed to reconcile' });
      }
    },
    async createRuleFromTxn(txn: any) {
      const rule = fyo.doc.getNewDoc('BankRule');
      await rule.set({
        ruleName: `Rule for ${txn.description.slice(0, 20)}`,
        condition: txn.description,
        targetAccount: txn.account,
        targetParty: txn.party,
      });
      await rule.sync();
      showToast({ type: 'success', message: t`Bank rule created.` });
    },
    formatDate(d: string) { return DateTime.fromISO(d).toFormat('dd MMM yyyy'); },
    formatCurrency(v: number) { return fyo.format(v, 'Currency'); },
    async openVoucher(type: string, name: string) { this.$router.push(`/edit/${type}/${name}`); }
  }
});
</script>
