<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template #title>{{ t`Top Expenses` }}</template>
      <template #action>
        <PeriodSelector :value="period" @change="(value) => (period = value)" />
      </template>
    </SectionHeader>

    <div v-show="hasData" class="flex relative">
      <!-- Chart Legend -->
      <div class="w-1/2 flex flex-col gap-3 justify-center dark:text-gray-200">
        <!-- Ledgend Item -->
        <div
          v-for="(d, i) in expenses"
          :key="d.account"
          class="flex items-center text-sm p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-default"
          :class="active === i ? 'bg-gray-100 dark:bg-gray-800' : ''"
          @mouseover="active = i"
          @mouseleave="active = null"
        >
          <div
            class="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
            :class="d.class"
          />
          <p
            class="ms-3 overflow-x-auto whitespace-nowrap no-scrollbar w-28 font-medium text-gray-700 dark:text-gray-200"
          >
            {{ d.account }}
          </p>
          <p
            class="whitespace-nowrap flex-shrink-0 ms-auto font-semibold text-gray-800 dark:text-gray-100"
          >
            {{ fyo.format(d?.total ?? 0, 'Currency') }}
          </p>
        </div>
      </div>
      <DonutChart
        class="w-1/2 my-auto"
        :active="active"
        :sectors="sectors"
        :offset-x="3"
        :thickness="10"
        :text-offset-x="6.5"
        :value-formatter="(value: number) => fyo.format(value, 'Currency')"
        :total-label="t`Total Spending`"
        :dark-mode="darkMode"
        @change="(value: number) => (active = value)"
      />
    </div>

    <!-- Empty Message -->
    <div
      v-if="expenses.length === 0"
      class="flex-1 w-full h-full flex-center my-20"
    >
      <div class="text-center">
        <div class="text-4xl mb-3 opacity-50">💸</div>
        <span class="text-base text-gray-500 dark:text-gray-400 font-medium">
          {{ t`No expenses in this period` }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { truncate } from 'lodash';
import { fyo } from 'src/initFyo';
import { uicolors } from 'src/utils/colors';
import { getDatesAndPeriodList } from 'src/utils/misc';
import { defineComponent } from 'vue';
import DonutChart from '../../components/Charts/DonutChart.vue';
import DashboardChartBase from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector.vue';
import SectionHeader from './SectionHeader.vue';

// Linting broken in this file cause of `extends: ...`
/*
  eslint-disable @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/restrict-plus-operands
*/
export default defineComponent({
  name: 'Expenses',
  components: {
    DonutChart,
    PeriodSelector,
    SectionHeader,
  },
  extends: DashboardChartBase,
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data: () => ({
    active: null as null | number,
    expenses: [] as {
      account: string;
      total: number;
      color: { color: string; darkColor: string };
      class: string;
    }[],
  }),
  computed: {
    totalExpense(): number {
      return this.expenses.reduce((sum, expense) => sum + expense.total, 0);
    },
    hasData(): boolean {
      return this.expenses.length > 0;
    },
    sectors(): {
      color: { color: string; darkColor: string };
      label: string;
      value: number;
    }[] {
      return this.expenses.map(({ account, color, total }) => ({
        color,
        label: truncate(account, { length: 21 }),
        value: total,
      }));
    },
  },
  activated() {
    this.setData();
  },
  methods: {
    async setData() {
      const { fromDate, toDate } = getDatesAndPeriodList(this.period);
      let topExpenses = await fyo.db.getTopExpenses(
        fromDate.toISO(),
        toDate.toISO()
      );
      const shades = [
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

      this.expenses = topExpenses
        .filter((e) => e.total > 0)
        .map((d, i) => {
          const shadeIndex = i % shades.length;
          return {
            account: d.account,
            total: d.total,
            color: {
              color: shades[shadeIndex].hex,
              darkColor: shades[shadeIndex].darkHex,
            },
            class: shades[shadeIndex].class,
          };
        });
    },
  },
});
</script>
