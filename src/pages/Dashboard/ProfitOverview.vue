<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between">
      <h3 class="font-bold text-lg tracking-tight">{{ t`Profit Overview` }}</h3>
      <button
        class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:underline"
        @click="routeToProfitAndLoss"
      >
        {{ t`View full Profit & Loss` }}
      </button>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm tabular-nums">
      <div class="text-gray-600 dark:text-gray-300">{{ t`Total Revenue` }}</div>
      <div class="text-right font-semibold text-gray-900 dark:text-gray-100">
        {{ formatCurrency(revenue) }}
      </div>

      <div class="text-gray-600 dark:text-gray-300">
        {{ t`Total Expenses` }}
      </div>
      <div class="text-right font-semibold text-gray-900 dark:text-gray-100">
        {{ formatCurrency(expenses) }}
      </div>

      <div class="text-gray-600 dark:text-gray-300">{{ t`Net Profit` }}</div>
      <div
        class="text-right font-bold"
        :class="
          netProfit >= 0
            ? 'text-gray-900 dark:text-gray-100'
            : 'text-amber-600 dark:text-amber-500'
        "
      >
        {{ formatCurrency(netProfit) }}
      </div>

      <div class="text-gray-600 dark:text-gray-300">{{ t`Profit Margin` }}</div>
      <div class="text-right font-semibold text-gray-900 dark:text-gray-100">
        {{ marginText }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { fyo } from 'src/initFyo';
import { routeTo } from 'src/utils/ui';
import type { DashboardSummary } from 'utils/db/types';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'ProfitOverview',
  props: {
    summary: { type: Object as PropType<DashboardSummary>, required: true },
  },
  computed: {
    revenue(): number {
      return this.summary.profit?.income ?? 0;
    },
    expenses(): number {
      return this.summary.profit?.expense ?? 0;
    },
    netProfit(): number {
      return this.revenue - this.expenses;
    },
    marginText(): string {
      if (!this.revenue) {
        return '-';
      }

      return `${((this.netProfit / this.revenue) * 100).toFixed(1)}%`;
    },
  },
  methods: {
    formatCurrency(value: number) {
      return fyo.format(value ?? 0, 'Currency');
    },
    async routeToProfitAndLoss() {
      await routeTo('/report/ProfitAndLoss');
    },
  },
});
</script>
