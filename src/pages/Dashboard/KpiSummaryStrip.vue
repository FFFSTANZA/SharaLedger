<template>
  <div class="grid grid-cols-4 gap-4">
    <!-- Cash Balance -->
    <div
      class="kpi-card p-4 transition-all duration-300 hover:shadow-lg"
      :class="`border-l-4 ${cashStatusBorderClass}`"
    >
      <div class="flex items-start justify-between">
        <div>
          <p
            class="text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300 uppercase"
          >
            {{ t`Cash Balance` }}
          </p>
          <p
            class="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100"
          >
            {{ formatCurrency(summary.cashBalance) }}
          </p>
        </div>
        <span
          class="w-2.5 h-2.5 rounded-full mt-1 shadow-sm transition-all duration-300 hover:scale-110"
          :class="cashStatusDotClass"
        />
      </div>

      <div class="mt-3 flex items-center justify-between text-xs tabular-nums">
        <span class="text-gray-500 dark:text-gray-400 font-medium">{{
          t`vs last period`
        }}</span>
        <span :class="cashTrendClass">{{ cashTrendText }}</span>
      </div>
    </div>

    <!-- Net Profit -->
    <div
      class="kpi-card p-4 transition-all duration-300 hover:shadow-lg border-l-4"
      :class="netProfitBorderClass"
    >
      <p
        class="text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300 uppercase"
      >
        {{ t`Net Profit (This Period)` }}
      </p>
      <p
        class="mt-1 text-2xl font-bold tabular-nums"
        :class="netProfitTextClass"
      >
        {{ formatCurrency(netProfit) }}
      </p>
      <div class="mt-3 grid grid-cols-2 gap-2 text-xs tabular-nums">
        <div class="text-gray-500 dark:text-gray-400 font-medium">
          {{ t`Margin` }}
        </div>
        <div class="text-right font-semibold text-gray-700 dark:text-gray-200">
          {{ profitMarginText }}
        </div>
        <div class="text-gray-500 dark:text-gray-400 font-medium">
          {{ t`vs last period` }}
        </div>
        <div :class="['text-right font-semibold', profitTrendClass]">
          {{ profitTrendText }}
        </div>
      </div>
    </div>

    <!-- Receivables -->
    <div
      class="kpi-card p-4 transition-all duration-300 hover:shadow-lg border-l-4 border-l-violet-500 dark:border-l-violet-600"
    >
      <p
        class="text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300 uppercase"
      >
        {{ t`Receivables` }}
      </p>
      <p
        class="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100"
      >
        {{ formatCurrency(summary.receivables.outstanding) }}
      </p>
      <div class="mt-3 grid grid-cols-2 gap-2 text-xs tabular-nums">
        <div class="text-gray-500 dark:text-gray-400 font-medium">
          {{ t`Overdue` }}
        </div>
        <div
          class="text-right font-semibold"
          :class="
            summary.receivables.overdue > 0
              ? 'text-amber-600 dark:text-amber-500'
              : 'text-gray-700 dark:text-gray-200'
          "
        >
          {{ formatCurrency(summary.receivables.overdue) }}
        </div>
        <div class="text-gray-500 dark:text-gray-400 font-medium">
          {{ t`Overdue bills` }}
        </div>
        <div class="text-right font-semibold text-gray-700 dark:text-gray-200">
          {{ summary.receivables.overdueCount || 0 }}
        </div>
      </div>
    </div>

    <!-- Payables -->
    <div
      class="kpi-card p-4 transition-all duration-300 hover:shadow-lg border-l-4 border-l-teal-500 dark:border-l-teal-600"
    >
      <p
        class="text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300 uppercase"
      >
        {{ t`Payables` }}
      </p>
      <p
        class="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100"
      >
        {{ formatCurrency(summary.payables.outstanding) }}
      </p>
      <div class="mt-3 grid grid-cols-2 gap-2 text-xs tabular-nums">
        <div class="text-gray-500 dark:text-gray-400 font-medium">
          {{ t`Due in 7 days` }}
        </div>
        <div
          class="text-right font-semibold"
          :class="
            summary.payables.dueNext7 > 0
              ? 'text-amber-600 dark:text-amber-500'
              : 'text-gray-700 dark:text-gray-200'
          "
        >
          {{ formatCurrency(summary.payables.dueNext7) }}
        </div>
        <div class="text-gray-500 dark:text-gray-400 font-medium">
          {{ t`Overdue` }}
        </div>
        <div
          class="text-right font-semibold"
          :class="
            summary.payables.overdue > 0
              ? 'text-amber-600 dark:text-amber-500'
              : 'text-gray-700 dark:text-gray-200'
          "
        >
          {{ formatCurrency(summary.payables.overdue) }}
        </div>
      </div>
      <div
        v-if="summary.payables.overdueCount > 0"
        class="mt-1 text-xs text-amber-600 dark:text-amber-500 tabular-nums text-right font-semibold"
      >
        {{ summary.payables.overdueCount }} {{ t`overdue bills` }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
 import { fyo } from 'src/initFyo';
 import type { DashboardSummary } from 'utils/db/types';
 import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'KpiSummaryStrip',
  props: {
    summary: { type: Object as PropType<DashboardSummary>, required: true },
  },
  computed: {
    netProfit(): number {
      return (
        (this.summary.profit?.income ?? 0) - (this.summary.profit?.expense ?? 0)
      );
    },
    netProfitPrev(): number {
      return (
        (this.summary.profitPrev?.income ?? 0) -
        (this.summary.profitPrev?.expense ?? 0)
      );
    },
    profitMargin(): number | null {
      const income = this.summary.profit?.income ?? 0;
      if (!income) {
        return null;
      }

      return (this.netProfit / income) * 100;
    },
    profitMarginText(): string {
      if (this.profitMargin === null) {
        return '-';
      }
      return `${this.profitMargin.toFixed(1)}%`;
    },
    cashStatus(): 'green' | 'amber' | 'red' {
      const cash = this.summary.cashBalance ?? 0;
      const urgentPayables =
        (this.summary.payables?.dueNext7 ?? 0) +
        (this.summary.payables?.overdue ?? 0);

      if (cash <= 0) {
        return 'red';
      }

      if (cash < urgentPayables && urgentPayables > 0) {
        return 'amber';
      }

      return 'green';
    },
    cashStatusBorderClass(): string {
      return (
        {
          green: 'border-green-500/70 dark:border-green-500/60',
          amber: 'border-amber-500/70 dark:border-amber-500/60',
          red: 'border-red-500/70 dark:border-red-500/60',
        } as const
      )[this.cashStatus];
    },
    cashStatusDotClass(): string {
      return (
        {
          green: 'bg-green-500/80',
          amber: 'bg-amber-500/80',
          red: 'bg-red-500/80',
        } as const
      )[this.cashStatus];
    },
    cashTrend(): { diff: number; percent: number | null } {
      const current = this.summary.cashBalance ?? 0;
      const prev = this.summary.cashBalancePrev ?? 0;
      const diff = current - prev;

      const percent = prev ? (diff / prev) * 100 : null;
      return { diff, percent };
    },
    cashTrendText(): string {
      const arrow = this.cashTrend.diff >= 0 ? '↑' : '↓';
      if (this.cashTrend.percent === null) {
        return `${arrow} ${this.formatCurrency(this.cashTrend.diff)}`;
      }

      return `${arrow} ${Math.abs(this.cashTrend.percent).toFixed(1)}%`;
    },
    cashTrendClass(): string {
      if (this.cashTrend.diff > 0) {
        return 'text-violet-600 dark:text-violet-400 font-medium';
      }

      if (this.cashTrend.diff < 0) {
        return 'text-amber-600 dark:text-amber-500 font-medium';
      }

      return 'text-gray-600 dark:text-gray-300 font-medium';
    },
    profitTrend(): { diff: number; percent: number | null } {
      const diff = this.netProfit - this.netProfitPrev;
      const percent = this.netProfitPrev
        ? (diff / this.netProfitPrev) * 100
        : null;
      return { diff, percent };
    },
    profitTrendText(): string {
      const arrow = this.profitTrend.diff >= 0 ? '↑' : '↓';
      if (this.profitTrend.percent === null) {
        return `${arrow} ${this.formatCurrency(this.profitTrend.diff)}`;
      }

      return `${arrow} ${Math.abs(this.profitTrend.percent).toFixed(1)}%`;
    },
    profitTrendClass(): string {
      if (this.profitTrend.diff > 0) {
        return 'text-violet-600 dark:text-violet-400';
      }

      if (this.profitTrend.diff < 0) {
        return 'text-amber-600 dark:text-amber-500';
      }

      return 'text-gray-700 dark:text-gray-200';
    },
    netProfitBorderClass(): string {
      if (this.netProfit >= 0) {
        return 'border-l-violet-500 dark:border-l-violet-600';
      }
      return 'border-l-amber-500 dark:border-l-amber-600';
    },
    netProfitTextClass(): string {
      if (this.netProfit >= 0) {
        return 'text-violet-600 dark:text-violet-400';
      }
      return 'text-amber-600 dark:text-amber-500';
    },
  },
  methods: {
    formatCurrency(value: number) {
      return fyo.format(value ?? 0, 'Currency');
    },
  },
});
</script>

<style scoped>
.kpi-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700;
}
</style>
