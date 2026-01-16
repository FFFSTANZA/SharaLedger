<template>
  <div class="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
    <PageHeader :title="t`Bank Statement Import`">
      <template #actions>
        <Button v-if="currentStep > 1" @click="prevStep">
          <template #prefix>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </template>
          {{ t`Back` }}
        </Button>
      </template>
    </PageHeader>
    
    <div class="flex-1 overflow-auto">
      <div class="max-w-7xl mx-auto p-6 space-y-6">
        <!-- Progress Stepper -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div class="flex items-center justify-between">
            <div v-for="(step, idx) in steps" :key="idx" class="flex items-center" :class="idx < steps.length - 1 ? 'flex-1' : ''">
              <div class="flex flex-col items-center">
                <div 
                  class="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all"
                  :class="currentStep > idx + 1 ? 'bg-green-500 text-white' : currentStep === idx + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
                >
                  <svg v-if="currentStep > idx + 1" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span v-else>{{ idx + 1 }}</span>
                </div>
                <div class="text-xs mt-2 font-medium text-center" :class="currentStep >= idx + 1 ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'">
                  {{ step }}
                </div>
              </div>
              <div v-if="idx < steps.length - 1" class="flex-1 h-0.5 mx-4 transition-colors" :class="currentStep > idx + 1 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'"></div>
            </div>
          </div>
        </div>

        <!-- Step 1: Bank Account Selection -->
        <div v-show="currentStep === 1" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <div class="max-w-md mx-auto space-y-6">
            <div class="text-center space-y-2">
              <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ t`Select Bank Account` }}</h2>
              <p class="text-gray-600 dark:text-gray-400">{{ t`Choose the bank account to import transactions into` }}</p>
            </div>
            
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">{{ t`Bank Account` }}</label>
              <FormControl
                :df="{ 
                  fieldname: 'bankAccount', 
                  fieldtype: 'Link', 
                  target: 'Account',
                  filters: { accountType: 'Bank' }
                }"
                :value="bankAccount"
                @change="(val) => bankAccount = val"
              />
            </div>

            <Button 
              type="primary" 
              size="large"
              class="w-full"
              :disabled="!bankAccount"
              @click="nextStep"
            >
              {{ t`Continue` }}
              <template #suffix>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </template>
            </Button>
          </div>
        </div>

        <!-- Step 2: File Upload -->
        <div v-show="currentStep === 2" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <div class="max-w-2xl mx-auto space-y-6">
            <div class="text-center space-y-2">
              <div class="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ t`Upload Statement` }}</h2>
              <p class="text-gray-600 dark:text-gray-400">{{ t`Upload your bank statement CSV file` }}</p>
            </div>

            <!-- Drag & Drop Zone -->
            <div
              @drop.prevent="handleFileDrop"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              class="border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer"
              :class="isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'"
              @click="selectFile"
            >
              <div class="space-y-4">
                <svg v-if="!fileName" xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                
                <div v-if="fileName" class="flex items-center justify-center gap-3 text-green-600 dark:text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-semibold text-lg">{{ fileName }}</span>
                </div>

                <div v-else>
                  <p class="text-lg font-medium text-gray-700 dark:text-gray-300">{{ t`Drop your CSV file here` }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ t`or click to browse` }}</p>
                </div>

                <Button v-if="fileName" @click.stop="selectFile" size="small">
                  {{ t`Choose Different File` }}
                </Button>
              </div>
            </div>

            <!-- File Info -->
            <div v-if="csvData.length" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <div>
                    <p class="font-medium text-green-800 dark:text-green-200">{{ t`File loaded successfully` }}</p>
                    <p class="text-sm text-green-600 dark:text-green-400">{{ csvData.length }} {{ t`transactions found` }} · {{ headers.length }} {{ t`columns` }}</p>
                  </div>
                </div>
                <Button type="primary" @click="nextStep">
                  {{ t`Next: Map Columns` }}
                  <template #suffix>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </template>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Column Mapping -->
        <div v-show="currentStep === 3" class="space-y-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ t`Map Columns` }}</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ t`Match your CSV columns to transaction fields` }}</p>
              </div>
              <div class="flex gap-2">
                <Button @click="autoDetectColumns" size="small">
                  <template #prefix>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </template>
                  {{ t`Auto-detect` }}
                </Button>
                <Button @click="clearMappings" size="small">
                  {{ t`Clear All` }}
                </Button>
              </div>
            </div>

            <!-- Mapping Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div v-for="(col, index) in headers" :key="index" class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-mono text-gray-500 dark:text-gray-400">{{ t`Column` }} {{ index + 1 }}</span>
                    <span v-if="mappings[index]" class="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">{{ t`Mapped` }}</span>
                  </div>
                  <div class="font-medium text-gray-900 dark:text-gray-100 truncate" :title="col">{{ col }}</div>
                  <select 
                    v-model="mappings[index]"
                    class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option :value="null">-- {{ t`Ignore` }} --</option>
                    <option value="date">📅 {{ t`Date` }}</option>
                    <option value="description">📝 {{ t`Description` }}</option>
                    <option value="withdrawal">💸 {{ t`Withdrawal (Debit)` }}</option>
                    <option value="deposit">💰 {{ t`Deposit (Credit)` }}</option>
                    <option value="amount">💵 {{ t`Amount (Combined)` }}</option>
                    <option value="balance">📊 {{ t`Balance` }}</option>
                    <option value="reference">🔖 {{ t`Reference/Cheque` }}</option>
                  </select>
                  <div class="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                    {{ t`Sample:` }} {{ csvData[0]?.[index] || '-' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Validation Alert -->
            <div v-if="!isMappingValid" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <div>
                  <p class="font-medium text-yellow-800 dark:text-yellow-200">{{ t`Required mappings missing` }}</p>
                  <p class="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    {{ t`Please map at least:` }}
                    <span class="font-semibold">{{ t`Date` }}</span> {{ t`and` }}
                    <span class="font-semibold">{{ t`Amount (or Withdrawal/Deposit)` }}</span>
                  </p>
                </div>
              </div>
            </div>
            <div v-else class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <div class="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <p class="font-medium text-green-800 dark:text-green-200">{{ t`All required fields are mapped` }}</p>
              </div>
            </div>
          </div>

          <!-- Preview Table -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ t`Data Preview` }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ t`First 10 rows of your import` }}</p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                    <th v-for="(col, index) in headers.filter((_, i) => mappings[i])" :key="index" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {{ getMappingLabel(mappings[headers.indexOf(col)]) }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="(row, ridx) in csvData.slice(0, 10)" :key="ridx" class="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ ridx + 1 }}</td>
                    <td v-for="(col, cidx) in headers.filter((_, i) => mappings[i])" :key="cidx" class="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {{ row[headers.indexOf(col)] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex justify-end">
            <Button 
              type="primary" 
              size="large"
              :disabled="!isMappingValid"
              @click="nextStep"
            >
              {{ t`Continue to Import` }}
              <template #suffix>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </template>
            </Button>
          </div>
        </div>

        <!-- Step 4: Import & Processing -->
        <div v-show="currentStep === 4" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <div class="max-w-2xl mx-auto space-y-6">
            <div class="text-center space-y-2">
              <div v-if="!isImporting && !importComplete" class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div v-else-if="isImporting" class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div v-else class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              
              <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {{ isImporting ? t`Importing Transactions` : importComplete ? t`Import Complete!` : t`Ready to Import` }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400">
                {{ isImporting ? t`Please wait while we process your transactions...` : importComplete ? t`Your transactions have been imported successfully` : t`Review the summary below and start the import` }}
              </p>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ csvData.length }}</div>
                <div class="text-sm text-blue-600 dark:text-blue-400 mt-1">{{ t`Total Rows` }}</div>
              </div>
              <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ importStats.imported }}</div>
                <div class="text-sm text-green-600 dark:text-green-400 mt-1">{{ t`Imported` }}</div>
              </div>
              <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ importStats.skipped }}</div>
                <div class="text-sm text-yellow-600 dark:text-yellow-400 mt-1">{{ t`Skipped` }}</div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div v-if="isImporting" class="space-y-2">
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${importProgress}%` }"
                ></div>
              </div>
              <div class="text-center text-sm text-gray-600 dark:text-gray-400">
                {{ importStats.imported + importStats.skipped }} / {{ csvData.length }} {{ t`processed` }}
              </div>
            </div>

            <!-- Action Buttons -->
            <div v-if="!isImporting" class="flex gap-3">
              <Button 
                v-if="!importComplete"
                type="primary" 
                size="large"
                class="flex-1"
                @click="importTransactions"
              >
                <template #prefix>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </template>
                {{ t`Start Import` }}
              </Button>
              <Button 
                v-else
                type="primary" 
                size="large"
                class="flex-1"
                @click="goToReconciliation"
              >
                {{ t`Go to Bank Reconciliation` }}
                <template #suffix>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </template>
              </Button>
            </div>

            <!-- Import Log -->
            <div v-if="importLogs.length" class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
              <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">{{ t`Import Log` }}</h4>
              <div class="space-y-1 text-xs font-mono">
                <div v-for="(log, idx) in importLogs" :key="idx" :class="log.type === 'error' ? 'text-red-600 dark:text-red-400' : log.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'">
                  {{ log.message }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <div class="flex-1">
              <p class="font-medium text-red-800 dark:text-red-200">{{ t`Error` }}</p>
              <p class="text-sm text-red-600 dark:text-red-400 mt-1">{{ errorMessage }}</p>
            </div>
            <button @click="errorMessage = ''" class="text-red-400 hover:text-red-600 dark:hover:text-red-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PageHeader from 'src/components/PageHeader.vue';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import { ModelNameEnum } from 'models/types';
import { parseCSV } from 'utils/csvParser';
import { autoCategorize, dedupeKey } from 'src/banking/autoCategorize';
import { routeTo } from 'src/utils/ui';
import { showToast } from 'src/utils/interactive';

export default defineComponent({
  components: { PageHeader, Button, FormControl },
  data() {
    return {
      currentStep: 1,
      steps: [this.t`Account`, this.t`Upload`, this.t`Map`, this.t`Import`],
      bankAccount: '',
      fileName: '',
      csvData: [] as string[][],
      headers: [] as string[],
      mappings: [] as (string | null)[],
      errorMessage: '',
      isDragging: false,
      isImporting: false,
      importComplete: false,
      importStats: {
        imported: 0,
        skipped: 0,
      },
      importLogs: [] as Array<{ message: string; type: 'info' | 'warning' | 'error' }>,
    };
  },
  computed: {
    isMappingValid() {
      const activeMappings = this.mappings.filter((m) => m !== null);
      return (
        activeMappings.includes('date') &&
        (activeMappings.includes('amount') ||
          activeMappings.includes('withdrawal') ||
          activeMappings.includes('deposit'))
      );
    },
    importProgress() {
      if (this.csvData.length === 0) return 0;
      return Math.round(((this.importStats.imported + this.importStats.skipped) / this.csvData.length) * 100);
    },
  },
  methods: {
    nextStep() {
      if (this.currentStep < 4) {
        this.currentStep++;
      }
    },
    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },
    async selectFile() {
      this.errorMessage = '';
      try {
        const result = await this.ipc.selectFile({
          title: 'Select CSV File',
          filters: [{ name: 'CSV Files', extensions: ['csv'] }]
        });

        if (result && !result.canceled && result.success) {
          await this.processFile(result.name, result.data.toString('utf-8'));
        }
      } catch (error) {
        console.error('File selection error:', error);
        this.errorMessage = this.t`An error occurred while selecting the file: ${error.message}`;
      }
    },
    async handleFileDrop(event: DragEvent) {
      this.isDragging = false;
      this.errorMessage = '';
      
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;
      
      const file = files[0];
      if (!file.name.endsWith('.csv')) {
        this.errorMessage = this.t`Please select a CSV file`;
        return;
      }

      try {
        const content = await file.text();
        await this.processFile(file.name, content);
      } catch (error) {
        console.error('File drop error:', error);
        this.errorMessage = this.t`Failed to read file: ${error.message}`;
      }
    },
    async processFile(name: string, content: string) {
      try {
        this.fileName = name;
        const parsed = parseCSV(content);
        
        if (parsed.length === 0) {
          this.errorMessage = this.t`The selected file appears to be empty or has no valid data.`;
          return;
        }

        if (parsed.length === 1) {
          this.errorMessage = this.t`The file only contains headers. No data rows found.`;
          return;
        }

        this.headers = parsed[0];
        this.csvData = parsed.slice(1);
        
        // Auto-detect column mappings
        this.autoDetectColumns();
      } catch (error) {
        console.error('File processing error:', error);
        this.errorMessage = this.t`Failed to parse CSV file: ${error.message}`;
      }
    },
    autoDetectColumns() {
      this.mappings = this.headers.map((h) => {
        const lowH = h.toLowerCase();
        if (lowH.includes('date')) return 'date';
        if (
          lowH.includes('desc') ||
          lowH.includes('narration') ||
          lowH.includes('remark') ||
          lowH.includes('detail')
        ) {
          return 'description';
        }
        if (lowH.includes('withdrawal') || lowH.includes('debit') || lowH.includes('dr')) {
          return 'withdrawal';
        }
        if (lowH.includes('deposit') || lowH.includes('credit') || lowH.includes('cr')) {
          return 'deposit';
        }
        if (lowH.includes('amount') || lowH === 'amt') return 'amount';
        if (lowH.includes('balance')) return 'balance';
        if (lowH.includes('ref') || lowH.includes('chq') || lowH.includes('cheque')) {
          return 'reference';
        }
        if (lowH.includes('type')) {
          // Don't auto-map Type column as it's for reference only
          // The amount logic will handle Credit/Debit classification
          return null;
        }
        return null;
      });
    },
    clearMappings() {
      this.mappings = this.headers.map(() => null);
    },
    getMappingLabel(mapping: string | null) {
      const labels: Record<string, string> = {
        date: this.t`Date`,
        description: this.t`Description`,
        withdrawal: this.t`Withdrawal`,
        deposit: this.t`Deposit`,
        amount: this.t`Amount`,
        balance: this.t`Balance`,
        reference: this.t`Reference`,
      };
      return mapping ? labels[mapping] : '';
    },
    async importTransactions() {
      this.errorMessage = '';
      this.isImporting = true;
      this.importComplete = false;
      this.importStats = { imported: 0, skipped: 0 };
      this.importLogs = [];
      
      if (!this.bankAccount) {
        this.errorMessage = this.t`Please select a bank account first.`;
        this.isImporting = false;
        return;
      }
      
      if (!this.isMappingValid) {
        this.errorMessage = this.t`Please map the Date and either Amount or Withdrawal/Deposit columns.`;
        this.isImporting = false;
        return;
      }

      let rowNum = 0;
      
      for (const row of this.csvData) {
        rowNum++;
        
        try {
          const entry: any = {
            bankAccount: this.bankAccount,
            status: 'Unreconciled'
          };

          this.mappings.forEach((m, idx) => {
            if (!m) return;
            const val = row[idx];
            if (m === 'date') entry.date = this.formatDate(val);
            else if (m === 'description') entry.description = val;
            else if (m === 'balance') entry.balance = this.parseAmount(val);
            else if (m === 'reference') entry.reference = val;
            else if (m === 'withdrawal' && this.parseAmount(val) > 0) {
              entry.type = 'Withdrawal';
              entry.amount = this.parseAmount(val);
            }
            else if (m === 'deposit' && this.parseAmount(val) > 0) {
              entry.type = 'Deposit';
              entry.amount = this.parseAmount(val);
            }
            else if (m === 'amount') {
              const amt = this.parseAmount(val);
              entry.type = amt < 0 ? 'Withdrawal' : 'Deposit';
              entry.amount = Math.abs(amt);
            }
          });

          if (!entry.date || !entry.amount) {
            this.importLogs.push({
              message: this.t`Row ${rowNum}: Skipped - missing date or amount`,
              type: 'warning'
            });
            this.importStats.skipped++;
            continue;
          }

          // Dedupe check
          const key = dedupeKey(entry.date, entry.description || '', entry.amount, entry.balance || 0);
          const existing = await this.fyo.db.getAll(ModelNameEnum.BankTransaction, { 
            filters: { dedupeKey: key },
            limit: 1
          });
          
          if (existing.length === 0) {
            const auto = autoCategorize(entry.description || '', entry.type);
            const doc = this.fyo.doc.getNewDoc(ModelNameEnum.BankTransaction, {
              ...entry,
              ...auto,
              dedupeKey: key
            });
            await doc.sync();
            this.importStats.imported++;
            
            if (this.importStats.imported % 10 === 0) {
              this.importLogs.push({
                message: this.t`Imported ${this.importStats.imported} transactions...`,
                type: 'info'
              });
            }
          } else {
            this.importStats.skipped++;
            this.importLogs.push({
              message: this.t`Row ${rowNum}: Skipped - duplicate transaction`,
              type: 'warning'
            });
          }
        } catch (error) {
          console.error(`Error importing row ${rowNum}:`, error);
          this.importLogs.push({
            message: this.t`Row ${rowNum}: Error - ${error.message}`,
            type: 'error'
          });
          this.importStats.skipped++;
        }

        // Small delay to keep UI responsive
        if (rowNum % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      this.isImporting = false;
      this.importComplete = true;
      
      this.importLogs.push({
        message: this.t`Import complete: ${this.importStats.imported} imported, ${this.importStats.skipped} skipped`,
        type: 'info'
      });

      if (this.importStats.imported > 0) {
        showToast({ 
          title: this.t`${this.importStats.imported} transactions imported successfully`, 
          type: 'success' 
        });
      } else if (this.importStats.skipped > 0) {
        showToast({ 
          title: this.t`All ${this.importStats.skipped} transactions were duplicates`, 
          type: 'info' 
        });
      }
    },
    goToReconciliation() {
      routeTo('/bank-reconciliation');
    },
    parseAmount(val: string) {
      if (!val) return 0;
      return parseFloat(val.replace(/,/g, '')) || 0;
    },
    formatDate(val: string) {
       const parts = val.split(/[\/\-]/);
       if (parts.length === 3) {
           let d, m, y;
           if (parts[2].length === 4) { // DD/MM/YYYY
               d = parts[0].padStart(2, '0');
               m = parts[1].padStart(2, '0');
               y = parts[2];
           } else if (parts[0].length === 4) { // YYYY/MM/DD
               y = parts[0];
               m = parts[1].padStart(2, '0');
               d = parts[2].padStart(2, '0');
           }
           if (y && m && d) return `${y}-${m}-${d}`;
       }
       return val;
    }
  }
});
</script>
