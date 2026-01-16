<template>
  <div class="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
    <PageHeader :title="t`Bank Reconciliation`">
      <Button type="primary" @click="goToImport">
        {{ t`Import Statement` }}
      </Button>
    </PageHeader>

    <div class="flex-1 overflow-auto">
      <table class="w-full text-sm text-left border-collapse">
        <thead class="sticky top-0 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm z-10">
          <tr>
            <th class="px-4 py-3 border-b dark:border-gray-700">{{ t`Date` }}</th>
            <th class="px-4 py-3 border-b dark:border-gray-700">{{ t`Description` }}</th>
            <th class="px-4 py-3 border-b dark:border-gray-700 text-right">{{ t`Withdrawal` }}</th>
            <th class="px-4 py-3 border-b dark:border-gray-700 text-right">{{ t`Deposit` }}</th>
            <th class="px-4 py-3 border-b dark:border-gray-700 w-64">{{ t`Category / Party` }}</th>
            <th class="px-4 py-3 border-b dark:border-gray-700 text-center">{{ t`Action` }}</th>
          </tr>
        </thead>
        <tbody class="divide-y dark:divide-gray-700">
          <tr v-for="row in transactions" :key="row.name" class="hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors">
            <td class="px-4 py-3 whitespace-nowrap">{{ row.values.date }}</td>
            <td class="px-4 py-3 min-w-[200px]">
                <div class="font-medium text-gray-900 dark:text-gray-100">{{ row.values.description }}</div>
                <div class="text-xs text-gray-500">{{ row.values.bankAccount }} | {{ row.values.reference }}</div>
            </td>
            <td class="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400">
              {{ row.values.type === 'Withdrawal' ? formatCurrency(row.values.amount) : '' }}
            </td>
            <td class="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
              {{ row.values.type === 'Deposit' ? formatCurrency(row.values.amount) : '' }}
            </td>
            <td class="px-4 py-3 space-y-2">
              <FormControl
                :df="{ fieldname: 'account', fieldtype: 'Link', target: 'Account', placeholder: t`Select Category` }"
                :value="row.values.account"
                size="small"
                @change="(val) => updateRow(row, 'account', val)"
              />
              <FormControl
                :df="{ fieldname: 'party', fieldtype: 'Link', target: 'Party', placeholder: t`Select Party (Optional)` }"
                :value="row.values.party"
                size="small"
                @change="(val) => updateRow(row, 'party', val)"
              />
            </td>
            <td class="px-4 py-3 text-center">
              <Button 
                size="small" 
                type="primary" 
                :disabled="!row.values.account"
                @click="post(row)"
              >
                {{ t`Post` }}
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="loading" class="p-12 text-center">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full"></div>
      </div>
      
      <div v-else-if="transactions.length === 0" class="p-12 text-center">
        <div class="text-gray-400 mb-2">
          <feather-icon name="check-circle" class="w-12 h-12 mx-auto opacity-20" />
        </div>
        <div class="text-lg font-medium text-gray-600 dark:text-gray-400">{{ t`All caught up!` }}</div>
        <div class="text-sm text-gray-500">{{ t`No unreconciled transactions found.` }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PageHeader from 'src/components/PageHeader.vue';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import { ModelNameEnum } from 'models/types';
import { Doc } from 'fyo/model/doc';
import { postBankTransactionToGL } from 'src/banking/postToGL';
import { routeTo } from 'src/utils/ui';
import { showToast } from 'src/utils/interactive';

export default defineComponent({
  components: { PageHeader, Button, FormControl },
  data() {
    return {
      transactions: [] as Doc[],
      loading: true,
    };
  },
  mounted() {
    this.loadTransactions();
  },
  methods: {
    formatCurrency(value: unknown) {
      return this.fyo.format(value, 'Currency');
    },
    async loadTransactions() {
      this.loading = true;
      try {
        const docs = await this.fyo.doc.getDocs(ModelNameEnum.BankTransaction, {
          filters: { status: 'Unreconciled' },
          orderBy: { date: 'desc' }
        });
        this.transactions = docs;
      } finally {
        this.loading = false;
      }
    },
    async updateRow(row: Doc, field: string, value: any) {
      await row.set(field, value);
      await row.save();
    },
    async post(row: Doc) {
      try {
        await postBankTransactionToGL(row);
        // Remove from list
        this.transactions = this.transactions.filter(t => t.name !== row.name);
        showToast({ title: this.t`Transaction posted successfully`, type: 'success' });
      } catch (err: any) {
        showToast({ title: err.message, type: 'error' });
      }
    },
    goToImport() {
      routeTo('/bank-import');
    }
  }
});
</script>
