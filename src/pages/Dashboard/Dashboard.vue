<template>
  <div class="h-screen" style="width: var(--w-desk)">
    <PageHeader :title="t`Dashboard`" :border="false">
      <div
        class="rounded-xl bg-gray-100 dark:bg-gray-800/50 p-0.5 flex items-center"
      >
        <PeriodSelector
          class="px-3"
          :value="period"
          :options="['This Month', 'This Quarter', 'This Year', 'YTD']"
          @change="(value) => (period = value)"
        />
      </div>
    </PageHeader>

    <div
      class="no-scrollbar overflow-auto dark:bg-gradient-to-b dark:from-gray-875 dark:to-gray-900"
      style="height: calc(100vh - var(--h-row-largest) - 1px)"
    >
      <div style="min-width: var(--w-desk-fixed)" class="p-4">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <KpiSummaryStrip v-if="summary" :summary="summary" class="w-full" />
            <div v-else class="dashboard-card p-4">
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ t`Loading dashboard...` }}
              </p>
            </div>
          </div>

          <div class="col-span-12 xl:col-span-9 space-y-4">
            <div
              class="dashboard-card p-6 transition-all duration-300 hover:shadow-lg"
            >
              <Cashflow :dark-mode="darkMode" />
            </div>

            <SalesPurchasePanels
              v-if="summary"
              :summary="summary"
              :period-label="periodLabel"
            />

            <div v-if="summary" class="grid grid-cols-2 gap-4">
              <div
                class="dashboard-card p-6 transition-all duration-300 hover:shadow-lg"
              >
                <ProfitOverview :summary="summary" />
              </div>
              <div
                class="dashboard-card p-6 transition-all duration-300 hover:shadow-lg"
              >
                <ExpenseBreakdown
                  :summary="summary"
                  :dark-mode="darkMode"
                  :from-date="fromDateISO"
                  :to-date="toDateISO"
                />
              </div>
            </div>
          </div>

          <div class="col-span-12 xl:col-span-3">
            <div
              v-if="summary"
              class="dashboard-card p-4 xl:sticky xl:top-4 transition-all duration-300 hover:shadow-lg"
            >
              <AlertsPanel :summary="summary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { DateTime } from 'luxon';
import PageHeader from 'src/components/PageHeader.vue';
import { fyo } from 'src/initFyo';
import { docsPathRef } from 'src/utils/refs';
import { getDatesAndPeriodList } from 'src/utils/misc';
import type { PeriodKey } from 'src/utils/types';
import type { DashboardSummary } from 'utils/db/types';
import { defineComponent } from 'vue';
import AlertsPanel from './AlertsPanel.vue';
import Cashflow from './Cashflow.vue';
import ExpenseBreakdown from './ExpenseBreakdown.vue';
import KpiSummaryStrip from './KpiSummaryStrip.vue';
import PeriodSelector from './PeriodSelector.vue';
import ProfitOverview from './ProfitOverview.vue';
import SalesPurchasePanels from './SalesPurchasePanels.vue';

const DEFAULT_CREDIT_DAYS = 30;

export default defineComponent({
  name: 'Dashboard',
  components: {
    PageHeader,
    PeriodSelector,
    Cashflow,
    KpiSummaryStrip,
    SalesPurchasePanels,
    ProfitOverview,
    ExpenseBreakdown,
    AlertsPanel,
  },
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      period: 'This Year' as PeriodKey,
      summary: null as DashboardSummary | null,
      fromDateISO: DateTime.now().toISODate(),
      toDateISO: DateTime.now().plus({ days: 1 }).toISODate(),
      requestId: 0,
    };
  },
  computed: {
    periodLabel(): string {
      if (this.period === 'This Month') {
        return t`This Month`;
      }

      if (this.period === 'This Quarter') {
        return t`This Quarter`;
      }

      if (this.period === 'This Year') {
        return t`This Year`;
      }

      if (this.period === 'YTD') {
        return t`Year to Date`;
      }

      return this.period;
    },
  },
  watch: {
    period: 'fetchSummary',
  },
  async activated() {
    docsPathRef.value = 'books/dashboard';
    await this.fetchSummary();
  },
  deactivated() {
    docsPathRef.value = '';
  },
  methods: {
    async fetchSummary() {
      const currentRequestId = ++this.requestId;

      const { fromDate, toDate } = getDatesAndPeriodList(this.period);
      this.fromDateISO = fromDate.toISODate();
      this.toDateISO = toDate.toISODate();

      const durationMs = toDate.toMillis() - fromDate.toMillis();
      const prevFromDate = DateTime.fromMillis(
        fromDate.toMillis() - durationMs
      );
      const prevToDate = fromDate;

      const todayISODate = DateTime.now().toISODate();

      const summary = await fyo.db.getDashboardSummary(
        fromDate.toISO(),
        toDate.toISO(),
        prevFromDate.toISO(),
        prevToDate.toISO(),
        todayISODate,
        DEFAULT_CREDIT_DAYS
      );

      if (currentRequestId !== this.requestId) {
        return;
      }

      this.summary = summary;
    },
  },
});
</script>

<style>
.dashboard-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700;
}
</style>
