<template>
  <div class="flex flex-col overflow-hidden w-full">
    <!-- Header -->
    <PageHeader :title="t`Banking Setup`" />

    <!-- Main Content -->
    <div class="flex-1 overflow-auto custom-scroll custom-scroll-thumb1 p-8">
      <div class="max-w-4xl mx-auto">
        <!-- Import Section -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold mb-4">
            {{ t`Import Bank Statement` }}
          </h2>
          <p class="text-base text-gray-600 dark:text-gray-400 mb-6">
            {{ t`Import your bank statement from CSV, XLSX, or XLS files. The system will automatically detect the format, normalize the data, auto-categorize transactions, and skip duplicate transactions.` }}
          </p>
          <Button
            type="primary"
            size="large"
            @click="importNew"
          >
            {{ t`Start Import` }}
          </Button>
          <div class="mt-6 text-sm text-gray-600 dark:text-gray-400">
            <p class="font-semibold mb-2">{{ t`Supported formats:` }}</p>
            <ul class="list-disc list-inside">
              <li>{{ t`CSV files (.csv)` }}</li>
              <li>{{ t`Excel files (.xlsx, .xls)` }}</li>
            </ul>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Transactions -->
          <div
            class="border dark:border-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            @click="navigateToTransactions"
          >
            <feather-icon name="list" class="w-8 h-8 mb-3 text-gray-600 dark:text-gray-400" />
            <h3 class="text-lg font-semibold mb-2">
              {{ t`Bank Transactions` }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t`View and manage imported bank transactions` }}
            </p>
          </div>

          <!-- Import Batches -->
          <div
            class="border dark:border-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            @click="navigateToBatches"
          >
            <feather-icon name="layers" class="w-8 h-8 mb-3 text-gray-600 dark:text-gray-400" />
            <h3 class="text-lg font-semibold mb-2">
              {{ t`Import Batches` }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t`View import history and batch details` }}
            </p>
          </div>

          <!-- Import Profiles -->
          <div
            class="border dark:border-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            @click="navigateToProfiles"
          >
            <feather-icon name="settings" class="w-8 h-8 mb-3 text-gray-600 dark:text-gray-400" />
            <h3 class="text-lg font-semibold mb-2">
              {{ t`Import Profiles` }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t`Manage saved column mappings for different banks` }}
            </p>
          </div>
        </div>

        <!-- Features -->
        <div class="mt-8 border-t dark:border-gray-800 pt-6">
          <h3 class="text-lg font-semibold mb-4">
            {{ t`Features` }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-start gap-3">
              <feather-icon name="check-circle" class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 class="font-medium mb-1">{{ t`Automatic Format Detection` }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ t`Automatically detects headers and maps columns for different bank formats` }}
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <feather-icon name="check-circle" class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 class="font-medium mb-1">{{ t`Data Normalization` }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ t`Normalizes dates, amounts, and descriptions across different formats` }}
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <feather-icon name="check-circle" class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 class="font-medium mb-1">{{ t`Auto-Categorization` }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ t`Suggests accounts and parties based on transaction descriptions` }}
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <feather-icon name="check-circle" class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 class="font-medium mb-1">{{ t`Duplicate Detection` }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ t`Identifies and skips duplicate transactions automatically` }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  components: { PageHeader, Button },
  methods: {
    async importNew() {
      await this.$router.push('/import-wizard');
    },
    async navigateToTransactions() {
      await this.$router.push(`/list/${ModelNameEnum.BankTransaction}`);
    },
    async navigateToBatches() {
      await this.$router.push(`/list/${ModelNameEnum.BankImportBatch}`);
    },
    async navigateToProfiles() {
      await this.$router.push(`/list/${ModelNameEnum.BankImportProfile}`);
    },
  },
});
</script>
