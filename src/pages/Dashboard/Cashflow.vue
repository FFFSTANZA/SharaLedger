<template>
  <div>
    <div class="flex items-start justify-between">
      <div>
        <h3
          class="font-bold text-lg tracking-tight text-gray-900 dark:text-gray-100"
        >
          {{ t`Cashflow` }}
        </h3>
        <p :class="`mt-1 text-sm tabular-nums ${netSummaryClass}`">
          {{ netSummaryText }}
        </p>
      </div>

      <div
        class="rounded-xl bg-gray-100 dark:bg-gray-800/50 p-1 flex items-center"
      >
        <button
          class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
          :class="
            range === 'This Month'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/40'
          "
          @click="range = 'This Month'"
        >
          {{ t`This Month` }}
        </button>
        <button
          class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
          :class="
            range === 'This Year'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/40'
          "
          @click="range = 'This Year'"
        >
          {{ t`This Year` }}
        </button>
      </div>
    </div>

    <div v-if="hasData" class="mt-6 flex flex-wrap gap-6 text-sm">
      <div class="flex items-center gap-3">
        <span
          class="w-3 h-3 rounded-full inline-block bg-violet-500 dark:bg-violet-400 shadow-md"
        />
        <span class="text-gray-700 dark:text-gray-300 font-medium">
          {{ t`Inflow` }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <span
          class="w-3 h-3 rounded-full inline-block bg-teal-500 dark:bg-teal-400 shadow-md"
        />
        <span class="text-gray-700 dark:text-gray-300 font-medium">
          {{ t`Outflow` }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <span
          class="w-3 h-3 rounded-full inline-block bg-violet-500 dark:bg-violet-400 shadow-md"
        />
        <span class="text-gray-700 dark:text-gray-300 font-medium">
          {{ t`Net Cashflow` }}
        </span>
      </div>
    </div>

    <LineChart
      v-if="hasData"
      class="mt-6"
      :aspect-ratio="4.15"
      :colors="chartData.colors"
      :thicknesses="chartData.thicknesses"
      :grid-color="chartData.gridColor"
      :font-color="chartData.fontColor"
      :points="chartData.points"
      :x-labels="chartData.xLabels"
      :format="chartData.format"
      :format-x="chartData.formatX"
      :y-max="chartData.yMax"
      :draw-labels="range !== 'This Month'"
      :show-all-series-in-tooltip="true"
      :series-labels="chartData.seriesLabels"
      :tooltip-extra="getTooltipExtra"
      :show-points="true"
      :dark-mode="darkMode"
    />

    <div v-else class="flex-1 w-full h-full flex-center my-20">
      <div class="text-center">
        <div class="text-6xl mb-4">📊</div>
        <span class="text-base text-gray-500 dark:text-gray-400 font-medium">
          {{ t`No transactions yet` }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { DateTime } from 'luxon';
import { fyo } from 'src/initFyo';
import { uicolors } from 'src/utils/colors';
import { getYMax } from 'src/utils/chart';
import LineChart from 'src/components/Charts/LineChart.vue';
import { defineComponent } from 'vue';
import type { CashflowSeriesPoint } from 'utils/db/types';

type RangeKey = 'This Month' | 'This Year';

export default defineComponent({
  name: 'Cashflow',
  components: { LineChart },
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data: () => ({
    range: 'This Month' as RangeKey,
    series: [] as CashflowSeriesPoint,
    prevNetTotal: 0,
  }),
  computed: {
    hasData(): boolean {
      return (this.series ?? []).some(
        (p) => (p.inflow ?? 0) > 0 || (p.outflow ?? 0) > 0
      );
    },
    netTotal(): number {
      return (this.series ?? []).reduce((sum, p) => sum + (p.net ?? 0), 0);
    },
    netSummaryText(): string {
      const net = this.netTotal;
      const prev = this.prevNetTotal;

      const isSurplus = net >= 0;
      const label = isSurplus ? t`Net cash surplus` : t`Net cash deficit`;
      const absNet = Math.abs(net);

      if (!prev) {
        return `${label} ${fyo.format(absNet, 'Currency')}`;
      }

      const diffPercent = ((net - prev) / Math.abs(prev)) * 100;
      const arrow = diffPercent >= 0 ? '↑' : '↓';
      const tag = this.range === 'This Month' ? t`MoM` : t`YoY`;

      return `${label} ${fyo.format(absNet, 'Currency')} (${arrow}${Math.abs(
        diffPercent
      ).toFixed(1)}% ${tag})`;
    },
    netSummaryClass(): string {
      const net = this.netTotal;
      const prev = this.prevNetTotal;

      if (!prev) {
        return 'text-gray-600 dark:text-gray-300';
      }

      const diffPercent = ((net - prev) / Math.abs(prev)) * 100;
      return diffPercent >= 0
        ? 'text-violet-600 dark:text-violet-400 font-semibold'
        : 'text-amber-600 dark:text-amber-500 font-semibold';
    },
    chartData() {
      const points = [
        this.series.map((p) => p.inflow ?? 0),
        this.series.map((p) => p.outflow ?? 0),
        this.series.map((p) => p.net ?? 0),
      ];

      const colors = [
        uicolors.violet[this.darkMode ? '400' : '500'],
        uicolors.teal[this.darkMode ? '400' : '500'],
        this.darkMode ? '#a78bfa' : '#8b5cf6', // Violet color for net cashflow instead of gray
      ];

      const thicknesses = [3, 3, 6];

      const xLabels = this.series.map((p) => p.period);
      const format = (value: number) => fyo.format(value ?? 0, 'Currency');
      const yMax = getYMax(points);

      const formatX = (value: string) => {
        if (this.range === 'This Month') {
          const dt = DateTime.fromFormat(value, 'yyyy-MM-dd');
          return dt.isValid ? dt.toFormat('dd') : value;
        }

        const dt = DateTime.fromFormat(value, 'yyyy-MM');
        return dt.isValid ? dt.toFormat('MMM yy') : value;
      };

      return {
        points,
        xLabels,
        colors,
        thicknesses,
        format,
        yMax,
        formatX,
        gridColor: this.darkMode
          ? 'rgba(200, 200, 200, 0.15)'
          : 'rgba(0, 0, 0, 0.06)',
        fontColor: this.darkMode ? uicolors.gray['400'] : uicolors.gray['600'],
        seriesLabels: [t`Inflow`, t`Outflow`, t`Net Cashflow`],
      };
    },
  },
  watch: {
    range: 'setData',
  },
  async activated() {
    await this.setData();
  },
  methods: {
    async setData() {
      const toDate = DateTime.now().plus({ days: 1 });

      let fromDate: DateTime;
      let prevFromDate: DateTime;
      let prevToDate: DateTime;
      let groupBy: 'day' | 'month';

      if (this.range === 'This Month') {
        fromDate = toDate.startOf('month');
        prevFromDate = fromDate.minus({ months: 1 });
        prevToDate = toDate.minus({ months: 1 });
        groupBy = 'day';
      } else {
        fromDate = toDate.minus({ months: 12 });
        prevFromDate = fromDate.minus({ months: 12 });
        prevToDate = toDate.minus({ months: 12 });
        groupBy = 'month';
      }

      const [current, prev] = await Promise.all([
        fyo.db.getCashflowSeries(fromDate.toISO(), toDate.toISO(), groupBy),
        fyo.db.getCashflowSeries(
          prevFromDate.toISO(),
          prevToDate.toISO(),
          groupBy
        ),
      ]);

      this.series = current;
      this.prevNetTotal = (prev ?? []).reduce(
        (sum, p) => sum + (p.net ?? 0),
        0
      );
    },
    getTooltipExtra(xi: number) {
      const point = this.series?.[xi];
      if (!point) {
        return '';
      }

      const inflow = point.topInflow;
      const outflow = point.topOutflow;

      const inflowAmount = inflow?.amount ?? 0;
      const outflowAmount = outflow?.amount ?? 0;

      if (!inflowAmount && !outflowAmount) {
        return '';
      }

      const isInflowSpike = inflowAmount >= outflowAmount;
      const spike = isInflowSpike ? inflow : outflow;
      const spikeLabel = isInflowSpike ? t`inflow` : t`outflow`;

      if (!spike?.amount) {
        return '';
      }

      const refType = spike.referenceType ?? '';
      const refName = spike.referenceName ?? '';
      const schemaLabel = refType
        ? fyo.schemaMap[refType]?.label ?? refType
        : t`Entry`;

      const ref = refName ? `${schemaLabel} ${refName}` : schemaLabel;
      return `${fyo.format(spike.amount, 'Currency')} ${spikeLabel} – ${ref}`;
    },
  },
});
</script>
