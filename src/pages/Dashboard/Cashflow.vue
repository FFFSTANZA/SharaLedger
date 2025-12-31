<template>
  <div>
    <!-- Title and Period Selector -->
    <SectionHeader>
      <template #title>{{ t`Cashflow` }}</template>
      <template #action>
        <!-- Chart Legend -->
        <div v-if="hasData" class="flex text-sm gap-6 me-4">
          <div class="flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full inline-block bg-violet-500 dark:bg-violet-600 shadow-sm"
            />
            <span class="text-gray-600 dark:text-gray-300 font-medium">{{
              t`Inflow`
            }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full inline-block bg-teal-500 dark:bg-teal-600 shadow-sm"
            />
            <span class="text-gray-600 dark:text-gray-300 font-medium">{{
              t`Outflow`
            }}</span>
          </div>
        </div>
        <div
          v-else
          class="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
        />

        <PeriodSelector
          v-if="hasData"
          :value="period"
          :options="periodOptions"
          @change="(value) => (period = value)"
        />
        <div
          v-else
          class="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
        />
      </template>
    </SectionHeader>

    <!-- Line Chart -->
    <LineChart
      v-if="chartData.points.length"
      class="mt-6"
      :aspect-ratio="4.15"
      :colors="chartData.colors"
      :grid-color="chartData.gridColor"
      :font-color="chartData.fontColor"
      :points="chartData.points"
      :x-labels="chartData.xLabels"
      :format="chartData.format"
      :format-x="chartData.formatX"
      :y-max="chartData.yMax"
      :draw-labels="hasData"
      :show-tooltip="hasData"
    />
  </div>
</template>
<script lang="ts">
import { AccountTypeEnum } from 'models/baseModels/Account/types';
import { ModelNameEnum } from 'models/types';
import LineChart from 'src/components/Charts/LineChart.vue';
import { fyo } from 'src/initFyo';
import { formatXLabels, getYMax } from 'src/utils/chart';
import { uicolors } from 'src/utils/colors';
import { getDatesAndPeriodList } from 'src/utils/misc';
import DashboardChartBase from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector.vue';
import SectionHeader from './SectionHeader.vue';
import { defineComponent } from 'vue';
import { getMapFromList } from 'utils/index';
import { PeriodKey } from 'src/utils/types';

// Linting broken in this file cause of `extends: ...`
/* 
  eslint-disable @typescript-eslint/no-unsafe-argument, 
  @typescript-eslint/no-unsafe-return
*/

export default defineComponent({
  name: 'Cashflow',
  components: {
    PeriodSelector,
    SectionHeader,
    LineChart,
  },
  extends: DashboardChartBase,
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data: () => ({
    data: [] as { inflow: number; outflow: number; yearmonth: string }[],
    periodList: [],
    periodOptions: ['This Year', 'This Quarter', 'YTD'],
    hasData: false,
  }),
  computed: {
    chartData() {
      let data = this.data;
      let colors = [
        uicolors.violet[this.darkMode ? '600' : '500'],
        uicolors.teal[this.darkMode ? '600' : '500'],
      ];
      if (!this.hasData) {
        data = dummyData;
        colors = [
          this.darkMode ? uicolors.gray['700'] : uicolors.gray['200'],
          this.darkMode ? uicolors.gray['800'] : uicolors.gray['100'],
        ];
      }

      const xLabels = data.map((cf) => cf.yearmonth);
      const points = (['inflow', 'outflow'] as const).map((k) =>
        data.map((d) => d[k])
      );

      const format = (value: number) => fyo.format(value ?? 0, 'Currency');
      const yMax = getYMax(points);
      return {
        points,
        xLabels,
        colors,
        format,
        yMax,
        formatX: formatXLabels,
        gridColor: this.darkMode
          ? 'rgba(200, 200, 200, 0.15)'
          : 'rgba(0, 0, 0, 0.06)',
        fontColor: this.darkMode ? uicolors.gray['400'] : uicolors.gray['600'],
      };
    },
  },
  async activated() {
    await this.setData();
    if (!this.hasData) {
      await this.setHasData();
    }
  },
  methods: {
    async setData() {
      const { periodList, fromDate, toDate } = getDatesAndPeriodList(
        this.period as PeriodKey
      );

      const data = await fyo.db.getCashflow(fromDate.toISO(), toDate.toISO());
      const dataMap = getMapFromList(data, 'yearmonth');
      this.data = periodList.map((p) => {
        const key = p.toFormat('yyyy-MM');
        const item = dataMap[key];
        if (item) {
          return item;
        }

        return {
          inflow: 0,
          outflow: 0,
          yearmonth: key,
        };
      });
    },
    async setHasData() {
      const accounts = await fyo.db.getAllRaw('Account', {
        filters: {
          accountType: ['in', [AccountTypeEnum.Cash, AccountTypeEnum.Bank]],
        },
      });
      const accountNames = accounts.map((a) => a.name as string);
      const count = await fyo.db.count(ModelNameEnum.AccountingLedgerEntry, {
        filters: { account: ['in', accountNames] },
      });
      this.hasData = count > 0;
    },
  },
});

const dummyData = [
  {
    inflow: 100,
    outflow: 250,
    yearmonth: '2021-05',
  },
  {
    inflow: 350,
    outflow: 100,
    yearmonth: '2021-06',
  },
  {
    inflow: 50,
    outflow: 300,
    yearmonth: '2021-07',
  },
  {
    inflow: 320,
    outflow: 100,
    yearmonth: '2021-08',
  },
];
</script>
