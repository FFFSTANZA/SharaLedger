<template>
  <div class="flex flex-col overflow-hidden w-full h-full">
    <!-- Header with Tabs -->
    <div class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div class="flex items-center justify-between px-6 py-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <feather-icon name="credit-card" class="w-6 h-6 mr-3 text-blue-600" />
          {{ t`Banking` }}
        </h1>
      </div>
      
      <!-- Tabs -->
      <div class="flex space-x-1 px-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 focus:outline-none"
          :class="activeTab === tab.id
            ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'"
        >
          <feather-icon :name="tab.icon" class="w-4 h-4 inline-block mr-2" />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-hidden">
      <!-- Import Tab -->
      <div v-show="activeTab === 'import'" class="h-full">
        <BankImport @switch-tab="switchTab" />
      </div>

      <!-- Reconciliation Tab -->
      <div v-show="activeTab === 'reconciliation'" class="h-full">
        <BankReconciliation ref="reconciliation" />
      </div>

      <!-- Rules Tab -->
      <div v-show="activeTab === 'rules'" class="h-full">
        <ListView schema-name="BankRule" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { defineComponent } from 'vue';
import BankImport from './BankImport.vue';
import BankReconciliation from './BankReconciliation.vue';
import ListView from './ListView/ListView.vue';

export default defineComponent({
  name: 'Banking',
  components: {
    BankImport,
    BankReconciliation,
    ListView,
  },
  data() {
    return {
      activeTab: 'import',
      tabs: [
        {
          id: 'import',
          label: t`Statement Import`,
          icon: 'upload',
        },
        {
          id: 'reconciliation',
          label: t`Reconciliation`,
          icon: 'check-circle',
        },
        {
          id: 'rules',
          label: t`Bank Rules`,
          icon: 'list',
        },
      ],
    };
  },
  mounted() {
    // Check if we should open reconciliation tab from query params or route
    if (this.$route.query.tab === 'reconciliation' || this.$route.path.includes('reconciliation')) {
      this.activeTab = 'reconciliation';
    }
  },
  methods: {
    switchTab(tabId: string) {
      this.activeTab = tabId;
      // Refresh reconciliation data when switching to it
      if (tabId === 'reconciliation') {
        this.$nextTick(() => {
          const reconciliation = this.$refs.reconciliation as any;
          if (reconciliation && reconciliation.loadTransactions) {
            reconciliation.loadTransactions();
          }
        });
      }
    },
  },
});
</script>
