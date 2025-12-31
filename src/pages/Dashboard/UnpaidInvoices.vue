<template>
  <div class="flex-col justify-between w-full p-4">
    <!-- Title and Period Selector -->
    <SectionHeader>
      <template #title>{{ title }}</template>
      <template #action>
        <PeriodSelector :value="period" @change="(value) => (period = value)" />
      </template>
    </SectionHeader>

    <!-- Widget Body -->
    <div class="mt-4">
      <!-- Paid & Unpaid Amounts -->
      <div class="flex justify-between gap-4">
        <!-- Paid -->
        <div
          class="text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
          :class="{
            'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 rounded px-2 py-1':
              !count,
          }"
          :title="paidCount > 0 ? t`View Paid Invoices` : ''"
          @click="() => routeToInvoices('paid')"
        >
          {{ fyo.format(paid, 'Currency') }}
          <span
            v-if="count"
            class="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1"
            >{{ t`Paid` }}</span
          >
        </div>

        <!-- Unpaid -->
        <div
          class="text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
          :class="{
            'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 rounded px-2 py-1':
              !count,
          }"
          :title="unpaidCount > 0 ? t`View Unpaid Invoices` : ''"
          @click="() => routeToInvoices('unpaid')"
        >
          {{ fyo.format(unpaid, 'Currency') }}
          <span
            v-if="count"
            class="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1"
            >{{ t`Unpaid` }}</span
          >
        </div>
      </div>

      <!-- Widget Bar -->
      <div
        class="mt-3 relative rounded-lg overflow-hidden h-5 shadow-inner"
        @mouseenter="show = true"
        @mouseleave="show = false"
      >
        <div
          class="w-full h-full transition-all duration-300"
          :class="unpaidColorClass"
        ></div>
        <div
          class="absolute inset-0 h-full transition-all duration-300"
          :class="paidColorClass"
          :style="`width: ${barWidth}%`"
        ></div>
      </div>
    </div>
    <MouseFollower
      v-if="hasData"
      :offset="15"
      :show="show"
      placement="top"
      class="text-sm shadow-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg border-l-4"
      :style="{ borderColor: colors }"
    >
      <div class="flex justify-between gap-6">
        <p class="text-gray-600 dark:text-gray-300">{{ t`Paid` }}</p>
        <p class="font-semibold">{{ paidCount ?? 0 }}</p>
      </div>
      <div v-if="unpaidCount > 0" class="flex justify-between gap-6 mt-1">
        <p class="text-gray-600 dark:text-gray-300">{{ t`Unpaid` }}</p>
        <p class="font-semibold">{{ unpaidCount ?? 0 }}</p>
      </div>
    </MouseFollower>
  </div>
</template>
<script lang="ts">
import { t } from 'fyo';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';
import MouseFollower from 'src/components/MouseFollower.vue';
import { fyo } from 'src/initFyo';
import { uicolors } from 'src/utils/colors';
import { getDatesAndPeriodList } from 'src/utils/misc';
import { PeriodKey } from 'src/utils/types';
import { routeTo } from 'src/utils/ui';
import { safeParseFloat } from 'utils/index';
import { PropType, defineComponent } from 'vue';
import BaseDashboardChart from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector.vue';
import SectionHeader from './SectionHeader.vue';

// Linting broken in this file cause of `extends: ...`
/* 
  eslint-disable @typescript-eslint/no-unsafe-argument, 
  @typescript-eslint/restrict-template-expressions,
  @typescript-eslint/no-unsafe-return
*/
export default defineComponent({
  name: 'UnpaidInvoices',
  components: {
    PeriodSelector,
    SectionHeader,
    MouseFollower,
  },
  extends: BaseDashboardChart,
  props: {
    schemaName: { type: String as PropType<string>, required: true },
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      show: false,
      total: 0,
      unpaid: 0,
      hasData: false,
      paid: 0,
      count: 0,
      unpaidCount: 0,
      paidCount: 0,
      barWidth: 40,
      period: 'This Year',
    } as {
      show: boolean;
      period: PeriodKey;
      total: number;
      unpaid: number;
      hasData: boolean;
      paid: number;
      count: number;
      unpaidCount: number;
      paidCount: number;
      barWidth: number;
    };
  },
  computed: {
    title(): string {
      return fyo.schemaMap[this.schemaName]?.label ?? '';
    },
    color(): 'violet' | 'teal' {
      if (this.schemaName === ModelNameEnum.SalesInvoice) {
        return 'violet';
      }
      return 'teal';
    },
    colors(): string {
      return uicolors[this.color][this.darkMode ? '600' : '500'];
    },
    paidColorClass(): string {
      if (!this.hasData) {
        return this.darkMode ? 'bg-gray-700' : 'bg-gray-300';
      }

      if (this.color === 'violet') {
        return this.darkMode ? 'bg-violet-600' : 'bg-violet-500';
      }
      return this.darkMode ? 'bg-teal-600' : 'bg-teal-500';
    },
    unpaidColorClass(): string {
      if (!this.hasData) {
        return `bg-gray-${this.darkMode ? '800' : '100'}`;
      }

      if (this.color === 'violet') {
        return this.darkMode ? 'bg-violet-50' : 'bg-violet-100';
      }
      return this.darkMode ? 'bg-teal-50' : 'bg-teal-100';
    },
  },
  async activated() {
    await this.setData();
  },
  methods: {
    async routeToInvoices(type: 'paid' | 'unpaid') {
      if (type === 'paid' && !this.paidCount) {
        return;
      }

      if (type === 'unpaid' && !this.unpaidCount) {
        return;
      }

      const zero = this.fyo.pesa(0).store;
      const filters = { outstandingAmount: ['=', zero] };
      const schemaLabel = fyo.schemaMap[this.schemaName]?.label ?? '';
      let label = t`Paid ${schemaLabel}`;
      if (type === 'unpaid') {
        filters.outstandingAmount[0] = '!=';
        label = t`Unpaid ${schemaLabel}`;
      }

      const path = `/list/${this.schemaName}/${label}`;
      const query = { filters: JSON.stringify(filters) };
      await routeTo({ path, query });
    },
    async setData() {
      const { fromDate, toDate } = getDatesAndPeriodList(this.period);

      const { total, outstanding } = await fyo.db.getTotalOutstanding(
        this.schemaName,
        fromDate.toISO(),
        toDate.toISO()
      );

      const { countTotal, countOutstanding } = await this.getCounts(
        this.schemaName,
        fromDate,
        toDate
      );

      this.total = total ?? 0;
      this.unpaid = outstanding ?? 0;
      this.paid = total - outstanding;
      this.hasData = countTotal > 0;
      this.count = countTotal;
      this.paidCount = countTotal - countOutstanding;
      this.unpaidCount = countOutstanding;
      this.barWidth = (this.paid / (this.total || 1)) * 100;
    },
    async newInvoice() {
      const doc = fyo.doc.getNewDoc(this.schemaName);
      await routeTo(`/edit/${this.schemaName}/${doc.name!}`);
    },

    async getCounts(schemaName: string, fromDate: DateTime, toDate: DateTime) {
      const outstandingAmounts = await fyo.db.getAllRaw(schemaName, {
        fields: ['outstandingAmount'],
        filters: {
          cancelled: false,
          submitted: true,
          date: ['<=', toDate.toISO(), '>=', fromDate.toISO()],
        },
      });

      const isOutstanding = outstandingAmounts.map((o) =>
        safeParseFloat(o.outstandingAmount)
      );

      return {
        countTotal: isOutstanding.length,
        countOutstanding: isOutstanding.filter((o) => o > 0).length,
      };
    },
  },
});
</script>
