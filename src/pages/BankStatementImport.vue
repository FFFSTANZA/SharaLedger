<template>
  <div class="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
    <PageHeader :title="t`Bank Statement Import`" />
    
    <div class="flex-1 overflow-auto p-6">
      <div class="max-w-4xl mx-auto space-y-8">
        <!-- Step 1: Account and File Selection -->
        <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">{{ t`1. Select Bank Account` }}</label>
              <FormControl
                :df="{ fieldname: 'bankAccount', fieldtype: 'Link', target: 'Account' }"
                :value="bankAccount"
                @change="(val) => bankAccount = val"
              />
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">{{ t`2. Select CSV File` }}</label>
              <div class="flex gap-2">
                <div class="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm truncate">
                  {{ fileName || t`No file selected` }}
                </div>
                <Button @click="selectFile">{{ t`Browse` }}</Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Preview & Mapping (Only shown after file selection) -->
        <div v-if="csvData.length" class="space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ t`3. Preview & Map Columns` }}</h3>
            <div class="text-sm text-gray-500">{{ csvData.length }} {{ t`rows found` }}</div>
          </div>
          
          <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table class="w-full text-sm text-left">
              <thead class="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
                <tr>
                  <th v-for="(col, index) in headers" :key="index" class="px-4 py-3 min-w-[150px]">
                    <div class="space-y-2">
                      <div class="font-medium truncate" :title="col">{{ col }}</div>
                      <select 
                        v-model="mappings[index]"
                        class="w-full p-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded"
                      >
                        <option :value="null">-- {{ t`Ignore` }} --</option>
                        <option value="date">{{ t`Date` }}</option>
                        <option value="description">{{ t`Description` }}</option>
                        <option value="withdrawal">{{ t`Withdrawal (Debit)` }}</option>
                        <option value="deposit">{{ t`Deposit (Credit)` }}</option>
                        <option value="amount">{{ t`Amount (Combined)` }}</option>
                        <option value="balance">{{ t`Balance` }}</option>
                        <option value="reference">{{ t`Reference/Cheque` }}</option>
                      </select>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, ridx) in csvData.slice(0, 5)" :key="ridx" class="border-b dark:border-gray-700 bg-white dark:bg-gray-900">
                  <td v-for="(cell, cidx) in row" :key="cidx" class="px-4 py-2 truncate max-w-[200px] text-gray-600 dark:text-gray-400">
                    {{ cell }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="text-xs text-gray-500 italic">{{ t`Showing first 5 rows as preview` }}</div>
        </div>

        <!-- Step 3: Import Button -->
        <div v-if="csvData.length" class="flex justify-end pt-4">
          <Button 
            type="primary" 
            size="large"
            :disabled="!bankAccount || !isMappingValid"
            @click="importTransactions"
          >
            {{ t`Import ${csvData.length} Transactions` }}
          </Button>
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
      bankAccount: '',
      fileName: '',
      csvData: [] as string[][],
      headers: [] as string[],
      mappings: [] as (string | null)[],
    };
  },
  computed: {
    isMappingValid() {
      const activeMappings = this.mappings.filter(m => m !== null);
      return activeMappings.includes('date') && 
             (activeMappings.includes('amount') || (activeMappings.includes('withdrawal') && activeMappings.includes('deposit')));
    }
  },
  methods: {
    async selectFile() {
      const result = await this.ipc.selectFile({
        title: 'Select CSV File',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      });

      if (result && !result.canceled && result.success) {
        this.fileName = result.name;
        const content = result.data.toString('utf-8');
        const parsed = parseCSV(content);
        if (parsed.length > 0) {
          this.headers = parsed[0];
          this.csvData = parsed.slice(1);
          // Initial auto-mapping
          this.mappings = this.headers.map(h => {
            const lowH = h.toLowerCase();
            if (lowH.includes('date')) return 'date';
            if (lowH.includes('desc') || lowH.includes('narration') || lowH.includes('remark')) return 'description';
            if (lowH.includes('withdrawal') || lowH.includes('debit') || lowH.includes('dr')) return 'withdrawal';
            if (lowH.includes('deposit') || lowH.includes('credit') || lowH.includes('cr')) return 'deposit';
            if (lowH.includes('balance')) return 'balance';
            if (lowH.includes('ref') || lowH.includes('chq') || lowH.includes('cheque')) return 'reference';
            return null;
          });
        }
      }
    },
    async importTransactions() {
      let count = 0;
      for (const row of this.csvData) {
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

        if (entry.date && entry.amount) {
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
            count++;
          }
        }
      }
      
      showToast({ 
        title: this.t`${count} new transactions imported.`, 
        type: 'success' 
      });
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
