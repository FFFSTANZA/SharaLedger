<template>
  <div v-if="isIndia" class="flex-col justify-between w-full">
    <SectionHeader>
      <template #title>{{ t`GST Due` }}</template>
      <template #action>
        <PeriodSelector :value="period" @change="(value) => (period = value)" />
      </template>
    </SectionHeader>

    <div class="mt-4">
      <p class="text-3xl font-semibold text-gray-900 dark:text-gray-25">
        {{ fyo.format(gstDue, 'Currency') }}
      </p>

      <p
        v-if="!hasGstin"
        class="text-sm text-gray-600 dark:text-gray-400 mt-1"
      >
        {{ t`Add your GSTIN in Settings to enable GST reports.` }}
      </p>
      <p
        v-else
        class="text-sm text-gray-600 dark:text-gray-400 mt-1"
        :title="t`Calculated as (credit − debit) for CGST/SGST/IGST for the selected period.`"
      >
        {{ t`Net GST payable for the selected period.` }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { ModelNameEnum } from 'models/types';
import PeriodSelector from 'src/pages/Dashboard/PeriodSelector.vue';
import SectionHeader from 'src/pages/Dashboard/SectionHeader.vue';
import { fyo } from 'src/initFyo';
import { getDatesAndPeriodList } from 'src/utils/misc';
import { safeParseFloat } from 'utils/index';
import { defineComponent } from 'vue';
import BaseDashboardChart from './BaseDashboardChart.vue';

export default defineComponent({
  name: 'GSTDue',
  components: {
    PeriodSelector,
    SectionHeader,
  },
  extends: BaseDashboardChart,
  data() {
    return {
      gstDue: 0,
    } as { gstDue: number };
  },
  computed: {
    isIndia(): boolean {
      return fyo.singles.SystemSettings?.countryCode === 'in';
    },
    hasGstin(): boolean {
      return !!fyo.singles.AccountingSettings?.gstin;
    },
  },
  async activated() {
    await this.setData();
  },
  methods: {
    async setData() {
      if (!this.isIndia) {
        return;
      }

      const { fromDate, toDate } = getDatesAndPeriodList(this.period);

      const gstAccounts = ['CGST', 'SGST', 'IGST'];
      const rows = (await fyo.db.getAllRaw(ModelNameEnum.AccountingLedgerEntry, {
        fields: ['debit', 'credit'],
        filters: {
          reverted: false,
          account: ['in', gstAccounts],
          date: ['<=', toDate.toISO(), '>=', fromDate.toISO()],
        },
      })) as { debit: string; credit: string }[];

      this.gstDue = rows.reduce(
        (sum, row) => sum + safeParseFloat(row.credit) - safeParseFloat(row.debit),
        0
      );
    },
  },
});
</script>
