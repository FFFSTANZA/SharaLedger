<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-hidden">
      <ListView
        :title="t`E-Way Bills`"
        :module="'regional-in'"
        :doctype="'EWayBill'"
        :columns="columns"
        :filters="filters"
        :quickEditFields="quickEditFields"
        :showCreate="true"
        :showImport="false"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ListView from './ListView.vue';
import { t } from 'fyo';

export default defineComponent({
  name: 'EWayBillListView',
  components: {
    ListView,
  },
  setup() {
    const columns = [
      {
        label: t`E-Way Bill No`,
        fieldname: 'ewayBillNo',
        width: 1.2,
      },
      {
        label: t`Status`,
        fieldname: 'status',
        width: 0.8,
        color: (status: string) => {
          switch (status) {
            case 'Draft':
              return 'text-gray-600';
            case 'Active':
              return 'text-green-600';
            case 'Cancelled':
              return 'text-red-600';
            case 'Expired':
              return 'text-orange-600';
            default:
              return 'text-gray-600';
          }
        },
      },
      {
        label: t`Invoice No`,
        fieldname: 'invoiceNo',
        width: 1,
      },
      {
        label: t`Invoice Date`,
        fieldname: 'invoiceDate',
        width: 1,
      },
      {
        label: t`Invoice Value`,
        fieldname: 'invoiceValue',
        width: 1.2,
        align: 'right',
      },
      {
        label: t`Vehicle No`,
        fieldname: 'vehicleNo',
        width: 1,
      },
      {
        label: t`Valid Upto`,
        fieldname: 'validUpto',
        width: 1,
      },
    ];

    const filters = [
      {
        label: t`All`,
        fieldname: '',
      },
      {
        label: t`Draft`,
        fieldname: 'Draft',
      },
      {
        label: t`Active`,
        fieldname: 'Active',
      },
      {
        label: t`Cancelled`,
        fieldname: 'Cancelled',
      },
      {
        label: t`Expired`,
        fieldname: 'Expired',
      },
    ];

    const quickEditFields = [
      'ewayBillNo',
      'ewayBillDate',
      'vehicleNo',
      'transporterName',
      'distanceKm',
    ];

    return {
      t,
      columns,
      filters,
      quickEditFields,
    };
  },
});
</script>