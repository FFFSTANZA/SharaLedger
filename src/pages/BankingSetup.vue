<template>
  <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
    <PageHeader :title="t`Banking`" />
    <div class="flex-1 overflow-auto p-6">
      <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Import Statement Card -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
          <div class="flex items-center gap-4 mb-4">
            <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
              <feather-icon name="upload" class="w-6 h-6" />
            </div>
            <h3 class="text-lg font-semibold dark:text-white">{{ t`Import Bank Statement` }}</h3>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ t`Upload your bank statement in CSV or Excel format. We support automatic column detection for major Indian banks.` }}
          </p>
          <Button type="primary" class="w-full" @click="goToImport">
            {{ t`Start Import Wizard` }}
          </Button>
        </div>

        <!-- Transactions Card -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
          <div class="flex items-center gap-4 mb-4">
            <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
              <feather-icon name="list" class="w-6 h-6" />
            </div>
            <h3 class="text-lg font-semibold dark:text-white">{{ t`Bank Transactions` }}</h3>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ t`View and categorize imported transactions before posting them to your general ledger.` }}
          </p>
          <Button class="w-full" @click="goToTransactions">
            {{ t`View Transactions` }}
          </Button>
        </div>

        <!-- Import Batches Card -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
          <div class="flex items-center gap-4 mb-4">
            <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
              <feather-icon name="layers" class="w-6 h-6" />
            </div>
            <h3 class="text-lg font-semibold dark:text-white">{{ t`Import Batches` }}</h3>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ t`Manage your statement import history and review imported batches.` }}
          </p>
          <Button class="w-full" @click="goToBatches">
            {{ t`View Batches` }}
          </Button>
        </div>

        <!-- Settings Card -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
          <div class="flex items-center gap-4 mb-4">
            <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400">
              <feather-icon name="settings" class="w-6 h-6" />
            </div>
            <h3 class="text-lg font-semibold dark:text-white">{{ t`Import Profiles` }}</h3>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ t`Manage custom column mappings and import profiles for your bank accounts.` }}
          </p>
          <Button class="w-full" @click="goToProfiles">
            {{ t`Manage Profiles` }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PageHeader from '../components/PageHeader.vue';
import Button from '../components/Button.vue';

export default defineComponent({
  components: {
    PageHeader,
    Button,
  },
  methods: {
    goToImport() {
      this.$router.push({
        path: '/import-wizard',
        query: { importType: 'BankTransaction' }
      });
    },
    goToTransactions() {
      this.$router.push('/list/BankTransaction');
    },
    goToBatches() {
      this.$router.push('/list/BankImportBatch');
    },
    goToProfiles() {
      this.$router.push('/list/BankImportProfile');
    },
  },
});
</script>
