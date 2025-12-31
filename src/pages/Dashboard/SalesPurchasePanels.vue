<template>
  <div class="grid grid-cols-2 gap-4">
    <!-- Sales -->
    <div
      class="dashboard-card p-6 transition-all duration-300 hover:shadow-lg border-t-4 border-t-violet-500 dark:border-t-violet-600"
    >
      <div class="flex items-start justify-between">
        <div>
          <h3
            class="font-bold text-lg tracking-tight text-gray-900 dark:text-gray-100"
          >
            {{ t`Sales` }}
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400"
              >({{ t`Receipts Control` }})</span
            >
          </h3>
          <p
            class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium uppercase tracking-wide"
          >
            {{ periodLabel }}
          </p>
        </div>
        <span
          class="w-2.5 h-2.5 rounded-full mt-1 bg-violet-500/80 dark:bg-violet-600/80 shadow-sm"
        />
      </div>

      <div class="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm tabular-nums">
        <div class="text-gray-600 dark:text-gray-300 font-medium">
          {{ t`Total Sales` }}
        </div>
        <div class="text-right font-semibold text-gray-900 dark:text-gray-100">
          {{ formatCurrency(summary.sales.total) }}
        </div>

        <div class="text-gray-600 dark:text-gray-300 font-medium">
          {{ t`Amount Received` }}
        </div>
        <div
          class="text-right font-semibold text-violet-600 dark:text-violet-400"
        >
          {{ formatCurrency(salesReceived) }}
        </div>

        <div class="text-gray-600 dark:text-gray-300 font-medium">
          {{ t`Amount Outstanding` }}
        </div>
        <div class="text-right font-semibold text-gray-900 dark:text-gray-100">
          {{ formatCurrency(summary.receivables.outstanding) }}
        </div>

        <div class="text-gray-600 dark:text-gray-300 font-medium">
          {{ t`Overdue Sales` }}
        </div>
        <div
          class="text-right font-semibold"
          :class="
            summary.receivables.overdue > 0
              ? 'text-amber-600 dark:text-amber-500'
              : 'text-gray-900 dark:text-gray-100'
          "
        >
          {{ formatCurrency(summary.receivables.overdue) }}
        </div>

        <div class="text-gray-600 dark:text-gray-300 font-medium">
          {{ t`Avg. Collection Period` }}
        </div>
        <div class="text-right font-semibold text-gray-900 dark:text-gray-100">
          {{ avgCollectionDaysText }}
        </div>
      </div>

      <div class="mt-5 flex items-center justify-between text-xs">
        <div class="text-gray-500 dark:text-gray-400 tabular-nums font-medium">
          {{ salesPaidPercentText }}
          <span class="mx-1">•</span>
          {{ t`${summary.sales.unpaidCount || 0} unpaid bills (this period)` }}
        </div>
      </div>

      <div class="mt-5 flex items-center gap-4 text-sm">
        <button
          class="text-violet-600 dark:text-violet-400 font-semibold hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
          @click="routeToOverdueSales"
        >
          {{ t`View overdue bills` }}
        </button>
        <button
          class="text-violet-600 dark:text-violet-400 font-semibold hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
          @click="routeToOverdueSales"
        >
          {{ t`Send reminders` }}
        </button>
      </div>
    </div>

    <!-- Purchases -->
    <div
      class="dashboard-card p-6 transition-all duration-300 hover:shadow-lg border-t-4 border-t-teal-500 dark:border-t-teal-600"
    >
      <div class="flex items-start justify-between">
        <div>
          <h3
            class="font-bold text-lg tracking-tight text-gray-900 dark:text-gray-100"
          >
            {{ t`Purchases` }}
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400"
              >({{ t`Payments Control` }})</span
            >
          </h3>
          <p
            class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium uppercase tracking-wide"
          >
            {{ periodLabel }}
          </p>
        </div>
        <span
          class="w-2.5 h-2.5 rounded-full mt-1 bg-teal-500/80 dark:bg-teal-600/80 shadow-sm"
        />
      </div>

      <div class="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm tabular-nums">
        <div class="text-gray-600 dark:text-gray-300 font-medium">
          {{ t`Total Purchases` }}
        </div>
        <div class="text-right font-semibold text-gray-900 dark:text-gray-100">
          {{ formatCurrency(summary.purchases.total) }}
        </div>

        <div class="text-gray-600 dark:text-gray-300 font-medium">
          {{ t`Amount Paid` }}
        </div>
        <div class="text-right font-semibold text-teal-600 dark:text-teal-400">
          {{ formatCurrency(purchasesPaid) }}
        </div>

        <div class="text-gray-600 dark:text-gray-300 font-medium">
          {{ t`Amount Due` }}
        </div>
        <div class="text-right font-semibold text-gray-900 dark:text-gray-100">
          {{ formatCurrency(summary.payables.outstanding) }}
        </div>

        <div class="text-gray-600 dark:text-gray-300 font-medium">
          {{ t`Due in next 7 days` }}
        </div>
        <div
          class="text-right font-semibold"
          :class="
            summary.payables.dueNext7 > 0
              ? 'text-amber-600 dark:text-amber-500'
              : 'text-gray-900 dark:text-gray-100'
          "
        >
          {{ formatCurrency(summary.payables.dueNext7) }}
        </div>

        <div class="text-gray-600 dark:text-gray-300 font-medium">
          {{ t`Overdue vendor bills` }}
        </div>
        <div
          class="text-right font-semibold"
          :class="
            summary.payables.overdueCount > 0
              ? 'text-amber-600 dark:text-amber-500'
              : 'text-gray-900 dark:text-gray-100'
          "
        >
          {{ formatCurrency(summary.payables.overdue) }}
        </div>
      </div>

      <div class="mt-5 flex items-center gap-4 text-sm">
        <button
          class="text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
          @click="routeToUnpaidPurchases"
        >
          {{ t`Pay bills` }}
        </button>
        <button
          class="text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
          @click="routeToOverduePurchases"
        >
          {{ t`View overdue vendors` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { DateTime } from 'luxon';
import { fyo } from 'src/initFyo';
import { routeTo } from 'src/utils/ui';
import type { DashboardSummary } from 'utils/db/types';
import { defineComponent, PropType } from 'vue';

const DEFAULT_CREDIT_DAYS = 30;

export default defineComponent({
  name: 'SalesPurchasePanels',
  props: {
    summary: { type: Object as PropType<DashboardSummary>, required: true },
    periodLabel: { type: String, required: true },
  },
  computed: {
    salesReceived(): number {
      return (
        (this.summary.sales.total ?? 0) - (this.summary.sales.outstanding ?? 0)
      );
    },
    purchasesPaid(): number {
      return (
        (this.summary.purchases.total ?? 0) -
        (this.summary.purchases.outstanding ?? 0)
      );
    },
    avgCollectionDaysText(): string {
      const avg = this.summary.sales.avgCollectionDays;
      if (avg === null || avg === undefined) {
        return '-';
      }

      return `${Math.round(avg)} ${t`days`}`;
    },
    salesPaidPercentText(): string {
      const total = this.summary.sales.total ?? 0;
      if (!total) {
        return t`0% paid`;
      }

      const paidPercent = (this.salesReceived / total) * 100;
      return `${paidPercent.toFixed(0)}% ${t`paid (this period)`}`;
    },
    overdueSalesCutoffISO(): string {
      return DateTime.now().minus({ days: DEFAULT_CREDIT_DAYS }).toISO();
    },
  },
  methods: {
    formatCurrency(value: number) {
      return fyo.format(value ?? 0, 'Currency');
    },
    async routeToOverdueSales() {
      const zero = fyo.pesa(0).store;
      await routeTo({
        path: `/list/SalesInvoice/${t`Overdue Sales Bills`}`,
        query: {
          filters: JSON.stringify({
            submitted: true,
            cancelled: false,
            outstandingAmount: ['!=', zero],
            date: ['<=', this.overdueSalesCutoffISO],
          }),
        },
      });
    },
    async routeToUnpaidPurchases() {
      const zero = fyo.pesa(0).store;
      await routeTo({
        path: `/list/PurchaseInvoice/${t`Unpaid Purchase Bills`}`,
        query: {
          filters: JSON.stringify({
            submitted: true,
            cancelled: false,
            outstandingAmount: ['!=', zero],
          }),
        },
      });
    },
    async routeToOverduePurchases() {
      const zero = fyo.pesa(0).store;
      const overdueCutoffISO = DateTime.now()
        .minus({ days: DEFAULT_CREDIT_DAYS })
        .toISO();

      await routeTo({
        path: `/list/PurchaseInvoice/${t`Overdue Purchase Bills`}`,
        query: {
          filters: JSON.stringify({
            submitted: true,
            cancelled: false,
            outstandingAmount: ['!=', zero],
            date: ['<=', overdueCutoffISO],
          }),
        },
      });
    },
  },
});
</script>
