<template>
  <CommonForm
    :schema-name="schemaName"
    :name="name"
    :page-title="pageTitle"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import CommonForm from './CommonForm.vue';

export default defineComponent({
  name: 'EWayBillForm',
  components: {
    CommonForm,
  },
  props: {
    schemaName: {
      type: String,
      default: 'EWayBill',
    },
    name: {
      type: String,
      default: '',
    },
    pageTitle: {
      type: String,
      default: '',
    },
  },
});
</script>