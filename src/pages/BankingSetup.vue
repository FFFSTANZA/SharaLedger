<template>
  <div class="flex flex-col overflow-hidden w-full">
    <!-- Header -->
    <PageHeader :title="t`Banking`">
      <Button
        :title="t`New Transaction`"
        type="primary"
        @click="newTransaction"
      >
        {{ t`New Transaction` }}
      </Button>
    </PageHeader>

    <!-- Main Content -->
    <div class="flex-1 overflow-auto custom-scroll custom-scroll-thumb1 p-6">
      <div class="max-w-6xl mx-auto">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3
              class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
            >
              {{ t`Total Transactions` }}
            </h3>
            <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ stats.totalCount }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ t`This month: ${stats.monthlyCount}` }}
            </p>
          </div>
          <div
            class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3
              class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
            >
              {{ t`Unmatched Transactions` }}
            </h3>
            <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ stats.unmatchedCount }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ t`Need attention` }}
            </p>
          </div>
          <div
            class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3
              class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
            >
              {{ t`Import Sessions` }}
            </h3>
            <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ stats.importSessions }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ t`Total batches imported` }}
            </p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mb-8">
          <h2
            class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4"
          >
            {{ t`Quick Actions` }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-violet-500 dark:hover:border-violet-400 transition-colors"
              @click="goToBankImport"
            >
              <div class="flex items-center mb-4">
                <div class="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                  <feather-icon
                    name="upload-cloud"
                    class="w-6 h-6 text-violet-600 dark:text-violet-400"
                  />
                </div>
                <div class="ml-4">
                  <h3 class="font-medium text-gray-900 dark:text-gray-100">
                    {{ t`Import Statement` }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ t`Upload bank statement CSV/XLSX` }}
                  </p>
                </div>
              </div>
            </div>

            <div
              class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-violet-500 dark:hover:border-violet-400 transition-colors"
              @click="goToTransactions"
            >
              <div class="flex items-center mb-4">
                <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <feather-icon
                    name="list"
                    class="w-6 h-6 text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div class="ml-4">
                  <h3 class="font-medium text-gray-900 dark:text-gray-100">
                    {{ t`View Transactions` }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ t`Browse all bank transactions` }}
                  </p>
                </div>
              </div>
            </div>

            <div
              class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-violet-500 dark:hover:border-violet-400 transition-colors"
              @click="goToImportHistory"
            >
              <div class="flex items-center mb-4">
                <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <feather-icon
                    name="clock"
                    class="w-6 h-6 text-green-600 dark:text-green-400"
                  />
                </div>
                <div class="ml-4">
                  <h3 class="font-medium text-gray-900 dark:text-gray-100">
                    {{ t`Import History` }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ t`View past import sessions` }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div v-if="recentTransactions.length > 0" class="mb-8">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ t`Recent Transactions` }}
            </h2>
            <Button variant="ghost" size="small" @click="goToTransactions">
              {{ t`View All` }}
            </Button>
          </div>
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    class="text-left p-4 font-medium text-gray-600 dark:text-gray-400"
                  >
                    {{ t`Date` }}
                  </th>
                  <th
                    class="text-left p-4 font-medium text-gray-600 dark:text-gray-400"
                  >
                    {{ t`Description` }}
                  </th>
                  <th
                    class="text-right p-4 font-medium text-gray-600 dark:text-gray-400"
                  >
                    {{ t`Amount` }}
                  </th>
                  <th
                    class="text-center p-4 font-medium text-gray-600 dark:text-gray-400"
                  >
                    {{ t`Status` }}
                  </th>
                  <th
                    class="text-center p-4 font-medium text-gray-600 dark:text-gray-400"
                  >
                    {{ t`Bank` }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="txn in recentTransactions"
                  :key="txn.name"
                  class="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  @click="viewTransaction(txn.name)"
                >
                  <td class="p-4 text-gray-900 dark:text-gray-100">
                    {{ formatDate(txn.date) }}
                  </td>
                  <td class="p-4 text-gray-900 dark:text-gray-100">
                    {{ txn.description }}
                  </td>
                  <td class="p-4 text-right font-mono">
                    <span
                      :class="
                        txn.type === 'Credit'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      "
                    >
                      {{ txn.type === 'Credit' ? '+' : '-'
                      }}{{ formatCurrency(txn.amount) }}
                    </span>
                  </td>
                  <td class="p-4 text-center">
                    <span
                      class="px-2 py-1 rounded text-xs font-medium"
                      :class="{
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                          txn.status === 'Unmatched',
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400':
                          txn.status === 'Matched',
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                          txn.status === 'Posted',
                      }"
                    >
                      {{ txn.status }}
                    </span>
                  </td>
                  <td class="p-4 text-center text-gray-500 dark:text-gray-400">
                    {{ txn.bankName || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center"
        >
          <feather-icon
            name="credit-card"
            class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
          />
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {{ t`No Bank Transactions Yet` }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ t`Get started by importing your first bank statement` }}
          </p>
          <Button type="primary" @click="goToBankImport">
            {{ t`Import Statement` }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import Button from 'src/components/Button.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { fyo } from 'src/initFyo';
import { routeTo } from 'src/utils/ui';
import { defineComponent } from 'vue';

interface TransactionDoc {
  name: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  bankName?: string;
}

export default defineComponent({
  name: 'BankingSetup',
  components: {
    Button,
    PageHeader,
  },
  data() {
    return {
      stats: {
        totalCount: 0,
        monthlyCount: 0,
        unmatchedCount: 0,
        importSessions: 0,
      },
      recentTransactions: [] as TransactionDoc[],
    };
  },
  async mounted() {
    await this.loadStats();
    await this.loadRecentTransactions();
  },
  methods: {
    async loadStats() {
      try {
        const totalResult = await fyo.db.count('BankTransaction');
        this.stats.totalCount = totalResult;

        const batchesResult = await fyo.db.count('BankImportBatch');
        this.stats.importSessions = batchesResult;

        const unmatchedResult = await fyo.db.count('BankTransaction', {
          status: 'Unmatched',
        });
        this.stats.unmatchedCount = unmatchedResult;
      } catch {
        // Ignore errors
      }
    },
    async loadRecentTransactions() {
      try {
        const transactions = await fyo.db.getAll('BankTransaction', {
          orderBy: 'creation desc',
          limit: 5,
        });
        this.recentTransactions = transactions as TransactionDoc[];
      } catch {
        // Ignore errors
      }
    },
    formatDate(dateStr: string): string {
      try {
        return fyo.format(dateStr, 'Date');
      } catch {
        return dateStr;
      }
    },
    formatCurrency(amount: number): string {
      return fyo.format(amount, 'Currency');
    },
    goToBankImport() {
      routeTo('/bank-import');
    },
    goToTransactions() {
      routeTo('/list/BankTransaction');
    },
    goToImportHistory() {
      routeTo('/list/BankImportBatch');
    },
    viewTransaction(name: string) {
      routeTo(`/edit/BankTransaction/${name}`);
    },
    newTransaction() {
      routeTo('/edit/BankTransaction/new');
    },
  },
});
</script>
