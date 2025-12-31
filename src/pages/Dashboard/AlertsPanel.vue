<template>
  <div>
    <h3 class="font-bold text-lg tracking-tight">{{ t`Attention` }}</h3>
    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {{ t`Only actionable items` }}
    </p>

    <div v-if="items.length" class="mt-5 space-y-3">
      <button
        v-for="item in items"
        :key="item.key"
        class="w-full text-left p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
        @click="item.action"
      >
        <div class="flex items-start gap-3">
          <feather-icon
            :name="item.icon"
            class="w-4 h-4 mt-0.5"
            :class="item.iconClass"
          />
          <div class="flex-1">
            <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {{ item.title }}
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              {{ item.detail }}
            </div>
          </div>
        </div>
      </button>
    </div>

    <div v-else class="mt-8 text-sm text-gray-600 dark:text-gray-300">
      {{ t`No urgent items right now.` }}
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
  name: 'AlertsPanel',
  props: {
    summary: { type: Object as PropType<DashboardSummary>, required: true },
  },
  computed: {
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
    hasGstin(): boolean {
      return !!fyo.singles?.AccountingSettings?.gstin;
    },
    gstText(): { title: string; detail: string } | null {
      const net = this.summary.tax?.netGst ?? 0;
      if (!this.hasGstin || !net) {
        return null;
      }

      if (net > 0) {
        return {
          title: t`GST payable`,
          detail: `${fyo.format(net, 'Currency')}`,
        };
      }

      return {
        title: t`GST receivable`,
        detail: `${fyo.format(Math.abs(net), 'Currency')}`,
      };
    },
    items() {
      const items: {
        key: string;
        icon: string;
        iconClass: string;
        title: string;
        detail: string;
        action: () => Promise<void>;
      }[] = [];

      const zero = fyo.pesa(0).store;
      const overdueCutoffISO = DateTime.now()
        .minus({ days: DEFAULT_CREDIT_DAYS })
        .toISO();

      if ((this.summary.receivables?.overdueCount ?? 0) > 0) {
        items.push({
          key: 'overdue-invoices',
          icon: 'alert-triangle',
          iconClass: 'text-amber-600 dark:text-amber-500',
          title: t`${this.summary.receivables.overdueCount} overdue sales bills`,
          detail: fyo.format(this.summary.receivables.overdue, 'Currency'),
          action: async () =>
            await routeTo({
              path: `/list/SalesInvoice/${t`Overdue Sales Bills`}`,
              query: {
                filters: JSON.stringify({
                  submitted: true,
                  cancelled: false,
                  outstandingAmount: ['!=', zero],
                  date: ['<=', overdueCutoffISO],
                }),
              },
            }),
        });
      }

      if ((this.summary.payables?.dueNext7Count ?? 0) > 0) {
        items.push({
          key: 'upcoming-payments',
          icon: 'clock',
          iconClass: 'text-amber-600 dark:text-amber-500',
          title: t`Upcoming vendor payments`,
          detail: `${fyo.format(
            this.summary.payables.dueNext7,
            'Currency'
          )} ${t`due in next 7 days`}`,
          action: async () =>
            await routeTo({
              path: `/list/PurchaseInvoice/${t`Purchase Bills Due Soon`}`,
              query: {
                filters: JSON.stringify({
                  submitted: true,
                  cancelled: false,
                  outstandingAmount: ['!=', zero],
                }),
              },
            }),
        });
      }

      if ((this.summary.payables?.overdueCount ?? 0) > 0) {
        items.push({
          key: 'overdue-vendor-bills',
          icon: 'alert-octagon',
          iconClass: 'text-amber-600 dark:text-amber-500',
          title: t`${this.summary.payables.overdueCount} overdue purchase bills`,
          detail: fyo.format(this.summary.payables.overdue, 'Currency'),
          action: async () =>
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
            }),
        });
      }

      if (this.cashStatus !== 'green') {
        items.push({
          key: 'low-cash',
          icon: 'dollar-sign',
          iconClass:
            this.cashStatus === 'red'
              ? 'text-red-600 dark:text-red-500'
              : 'text-amber-600 dark:text-amber-500',
          title: t`Low cash warning`,
          detail: fyo.format(this.summary.cashBalance, 'Currency'),
          action: async () => await routeTo('/report/BalanceSheet'),
        });
      }

      if (this.gstText) {
        items.push({
          key: 'gst',
          icon: 'file-text',
          iconClass: 'text-gray-700 dark:text-gray-300',
          title: this.gstText.title,
          detail: this.gstText.detail,
          action: async () => await routeTo('/report/GSTR1'),
        });
      }

      if (this.hasGstin) {
        items.push({
          key: 'gst-reminder',
          icon: 'calendar',
          iconClass: 'text-gray-700 dark:text-gray-300',
          title: t`GST filing reminder`,
          detail: t`Review GSTR1 / GSTR2 for this period`,
          action: async () => await routeTo('/report/GSTR1'),
        });
      }

      return items;
    },
  },
});
</script>
