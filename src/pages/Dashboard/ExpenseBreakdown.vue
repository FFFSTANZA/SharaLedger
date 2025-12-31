<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between">
      <h3 class="font-bold text-lg tracking-tight">
        {{ t`Expense Breakdown` }}
      </h3>
      <button
        class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:underline"
        @click="routeToProfitAndLoss"
      >
        {{ t`View full Profit & Loss` }}
      </button>
    </div>

    <div v-if="hasData" class="mt-5 flex gap-6">
      <!-- List -->
      <div class="w-1/2 flex flex-col gap-2 justify-center">
        <button
          v-for="(row, i) in expenseRows"
          :key="row.account"
          class="text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
          :class="active === i ? 'bg-gray-50 dark:bg-gray-800/40' : ''"
          @mouseenter="active = i"
          @mouseleave="active = null"
          @click="routeToLedger(row.account)"
        >
          <div class="flex items-center gap-2 text-sm">
            <span class="w-2.5 h-2.5 rounded-full" :class="row.class" />
            <span
              class="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[9rem]"
              >{{ row.account }}</span
            >
            <span
              class="ms-auto font-semibold text-gray-900 dark:text-gray-100 tabular-nums"
            >
              {{ formatCurrency(row.total) }}
            </span>
          </div>
          <div class="mt-1 flex items-center justify-between text-xs">
            <span class="text-gray-500 dark:text-gray-400 tabular-nums">
              {{ row.percentText }}
            </span>
            <span
              v-if="row.changeText"
              class="tabular-nums"
              :class="
                row.isUnusualIncrease
                  ? 'text-amber-600 dark:text-amber-500'
                  : 'text-gray-500 dark:text-gray-400'
              "
            >
              {{ row.changeText }}
            </span>
          </div>
        </button>
      </div>

      <!-- Donut -->
      <DonutChart
        class="w-1/2 my-auto"
        :active="active"
        :sectors="sectors"
        :offset-x="3"
        :thickness="10"
        :text-offset-x="6.5"
        :value-formatter="(value: number) => formatCurrency(value)"
        :total-label="t`Total Expenses`"
        :dark-mode="darkMode"
        @change="(value: number) => (active = value)"
      />
    </div>

    <div v-else class="flex-1 w-full h-full flex-center my-20">
      <div class="text-center">
        <span class="text-base text-gray-500 dark:text-gray-400 font-medium">
          {{ t`No expenses in this period` }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { truncate } from 'lodash';
import { fyo } from 'src/initFyo';
import { uicolors } from 'src/utils/colors';
import { routeTo } from 'src/utils/ui';
import type { DashboardSummary } from 'utils/db/types';
import { defineComponent, PropType } from 'vue';
import DonutChart from 'src/components/Charts/DonutChart.vue';

export default defineComponent({
  name: 'ExpenseBreakdown',
  components: { DonutChart },
  props: {
    summary: { type: Object as PropType<DashboardSummary>, required: true },
    darkMode: { type: Boolean, default: false },
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
  },
  data: () => ({
    active: null as null | number,
  }),
  computed: {
    hasData(): boolean {
      return (this.summary.profit?.expense ?? 0) > 0;
    },
    totalExpense(): number {
      return this.summary.profit?.expense ?? 0;
    },
    topExpenseSum(): number {
      return (this.summary.topExpenses ?? []).reduce(
        (sum, e) => sum + (e.total ?? 0),
        0
      );
    },
    shades() {
      return [
        {
          class: 'bg-violet-500 dark:bg-violet-600',
          hex: uicolors.violet['500'],
          darkHex: uicolors.violet['600'],
        },
        {
          class: 'bg-teal-500 dark:bg-teal-600',
          hex: uicolors.teal['500'],
          darkHex: uicolors.teal['600'],
        },
        {
          class: 'bg-amber-500 dark:bg-amber-600',
          hex: uicolors.amber['500'],
          darkHex: uicolors.amber['600'],
        },
        {
          class: 'bg-blue-500 dark:bg-blue-600',
          hex: uicolors.blue['500'],
          darkHex: uicolors.blue['600'],
        },
        {
          class: 'bg-pink-500 dark:bg-pink-600',
          hex: uicolors.pink['500'],
          darkHex: uicolors.pink['600'],
        },
      ];
    },
    expenseRows() {
      return (this.summary.topExpenses ?? []).map((d, i) => {
        const shadeIndex = i % this.shades.length;
        const percent = this.totalExpense
          ? (d.total / this.totalExpense) * 100
          : 0;

        const prevTotal = d.prevTotal ?? 0;
        const changePercent = prevTotal
          ? ((d.total - prevTotal) / prevTotal) * 100
          : null;
        const isUnusualIncrease = changePercent !== null && changePercent >= 25;

        return {
          account: d.account,
          total: d.total,
          prevTotal,
          class: this.shades[shadeIndex].class,
          color: {
            color: this.shades[shadeIndex].hex,
            darkColor: this.shades[shadeIndex].darkHex,
          },
          percentText: `${percent.toFixed(0)}%`,
          changeText:
            changePercent !== null && Math.abs(changePercent) >= 10
              ? `${changePercent > 0 ? '↑' : '↓'} ${Math.abs(
                  changePercent
                ).toFixed(0)}% ${t`vs last period`}`
              : '',
          isUnusualIncrease,
        };
      });
    },
    sectors() {
      const sectors = this.expenseRows.map((r) => ({
        color: r.color,
        label: truncate(r.account, { length: 21 }),
        value: r.total,
      }));

      const other = Math.max(this.totalExpense - this.topExpenseSum, 0);
      if (other > 0) {
        sectors.push({
          color: {
            color: uicolors.gray['400'],
            darkColor: uicolors.gray['600'],
          },
          label: t`Other`,
          value: other,
        });
      }

      return sectors;
    },
  },
  methods: {
    formatCurrency(value: number) {
      return fyo.format(value ?? 0, 'Currency');
    },
    async routeToProfitAndLoss() {
      await routeTo('/report/ProfitAndLoss');
    },
    async routeToLedger(account: string) {
      await routeTo({
        path: '/report/GeneralLedger',
        query: {
          account,
          fromDate: this.fromDate,
          toDate: this.toDate,
        },
      });
    },
  },
});
</script>
