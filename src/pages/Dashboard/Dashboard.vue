<template>
  <div class="h-screen" style="width: var(--w-desk)">
    <PageHeader :title="t`Dashboard`">
      <div
        class="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus-within:bg-gray-50 dark:focus-within:bg-gray-700 flex items-center shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <PeriodSelector
          class="px-3"
          :value="period"
          :options="['This Year', 'This Quarter', 'This Month', 'YTD']"
          @change="(value) => (period = value)"
        />
      </div>
    </PageHeader>

    <div
      class="no-scrollbar overflow-auto dark:bg-gradient-to-b dark:from-gray-875 dark:to-gray-900"
      style="height: calc(100vh - var(--h-row-largest) - 1px)"
    >
      <div
        style="min-width: var(--w-desk-fixed)"
        class="overflow-auto p-4 space-y-4"
      >
        <Cashflow
          class="dashboard-card p-6"
          :common-period="period"
          :dark-mode="darkMode"
          @period-change="handlePeriodChange"
        />
        <div class="flex w-full gap-4">
          <UnpaidInvoices
            :schema-name="'SalesInvoice'"
            :common-period="period"
            :dark-mode="darkMode"
            class="dashboard-card flex-1"
            @period-change="handlePeriodChange"
          />
          <UnpaidInvoices
            :schema-name="'PurchaseInvoice'"
            :common-period="period"
            :dark-mode="darkMode"
            class="dashboard-card flex-1"
            @period-change="handlePeriodChange"
          />
        </div>
        <div class="flex gap-4">
          <ProfitAndLoss
            class="dashboard-card flex-1 p-6"
            :common-period="period"
            :dark-mode="darkMode"
            @period-change="handlePeriodChange"
          />
          <Expenses
            class="dashboard-card flex-1 p-6"
            :common-period="period"
            :dark-mode="darkMode"
            @period-change="handlePeriodChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PageHeader from 'src/components/PageHeader.vue';
import UnpaidInvoices from './UnpaidInvoices.vue';
import Cashflow from './Cashflow.vue';
import Expenses from './Expenses.vue';
import PeriodSelector from './PeriodSelector.vue';
import ProfitAndLoss from './ProfitAndLoss.vue';
import { docsPathRef } from 'src/utils/refs';

export default {
  name: 'Dashboard',
  components: {
    PageHeader,
    Cashflow,
    ProfitAndLoss,
    Expenses,
    PeriodSelector,
    UnpaidInvoices,
  },
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return { period: 'This Year' };
  },
  activated() {
    docsPathRef.value = 'books/dashboard';
  },
  deactivated() {
    docsPathRef.value = '';
  },
  methods: {
    handlePeriodChange(period) {
      if (period === this.period) {
        return;
      }

      this.period = '';
    },
  },
};
</script>

<style scoped>
.dashboard-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700;
}
</style>
