<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between">
      <h3
        class="font-bold text-lg tracking-tight text-gray-900 dark:text-gray-100"
      >
        {{ t`Profit Overview` }}
      </h3>
      <button
        class="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
        @click="routeToProfitAndLoss"
      >
        {{ t`View full Profit & Loss` }}
      </button>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm tabular-nums">
      <div class="text-gray-600 dark:text-gray-300 font-medium">
        {{ t`Total Revenue` }}
      </div>
      <div
        class="text-right font-semibold bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1"
      >
        {{ formatCurrency(revenue) }}
      </div>

      <div class="text-gray-600 dark:text-gray-300 font-medium">
        {{ t`Total Expenses` }}
      </div>
      <div
        class="text-right font-semibold bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1"
      >
        {{ formatCurrency(expenses) }}
      </div>

      <div class="text-gray-600 dark:text-gray-300 font-medium">
        {{ t`Net Profit` }}
      </div>
      <div
        class="text-right font-bold text-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg px-2 py-1"
        :class="
          netProfit >= 0
            ? 'text-violet-600 dark:text-violet-400'
            : 'text-amber-600 dark:text-amber-500'
        "
      >
        {{ formatCurrency(netProfit) }}
      </div>

      <div class="text-gray-600 dark:text-gray-300 font-medium">
        {{ t`Profit Margin` }}
      </div>
      <div
        class="text-right font-semibold bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1"
      >
        {{ marginText }}
      </div>
    </div>

    <div class="mt-8 flex-1 flex flex-col justify-center">
      <div class="space-y-5">
        <div>
          <div class="flex justify-between text-xs mb-2 font-medium">
            <span
              class="text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >{{ t`Revenue` }}</span
            >
            <span class="text-gray-900 dark:text-gray-100 tabular-nums">{{
              formatCurrency(revenue)
            }}</span>
          </div>
          <div
            class="h-2.5 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner"
          >
            <div
              class="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              :style="{ width: `${revenuePercent}%` }"
            ></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-xs mb-2 font-medium">
            <span
              class="text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >{{ t`Expenses` }}</span
            >
            <span class="text-gray-900 dark:text-gray-100 tabular-nums">{{
              formatCurrency(expenses)
            }}</span>
          </div>
          <div
            class="h-2.5 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner"
          >
            <div
              class="h-full bg-red-500 dark:bg-red-400 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
              :style="{ width: `${expensePercent}%` }"
            ></div>
          </div>
        </div>
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
    revenuePercent(): number {
      const max = Math.max(this.revenue, this.expenses);
      if (!max) return 0;
      return (this.revenue / max) * 100;
    },
    expensePercent(): number {
      const max = Math.max(this.revenue, this.expenses);
      if (!max) return 0;
      return (this.expenses / max) * 100;
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
