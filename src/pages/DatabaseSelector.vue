<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 relative overflow-hidden"
    :class="{
      'pointer-events-none': loadingDatabase,
    }"
  >
    <!-- Animated Background Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-4 -right-4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-8 -left-8 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
    </div>

    <!-- Main Card -->
    <div
      class="relative w-full max-w-4xl mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/50 overflow-hidden"
      style="min-height: 600px"
    >
      <!-- Header Section -->
      <div class="relative px-12 pt-12 pb-8 text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
        <!-- Logo Animation -->
        <div class="flex justify-center mb-6">
          <div class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
            <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
              <path d="M2 17L12 22L22 17"/>
              <path d="M2 12L12 17L22 12"/>
            </svg>
          </div>
        </div>

        <!-- Welcome Text -->
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Welcome to Versoll
        </h1>
        <p class="text-xl text-indigo-100 mb-2">
          Your Premium Accounting & Financial Management Platform
        </p>
        <div class="flex items-center justify-center gap-2 text-indigo-200">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span class="text-sm font-medium">Trusted by 10,000+ businesses worldwide</span>
        </div>
      </div>

      <!-- Main Content -->
      <div class="p-12">
        <!-- Action Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <!-- New Company -->
          <div
            data-testid="create-new-file"
            class="group relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl transform"
            :class="creatingDemo ? 'opacity-50' : 'hover:from-indigo-600 hover:to-purple-700'"
            @click="newDatabase"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
              </div>
              <div class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <h3 class="text-xl font-bold mb-2">New Company</h3>
            <p class="text-indigo-100 text-sm leading-relaxed">
              Start your financial journey with a fresh, clean slate. Set up your company from scratch.
            </p>
          </div>

          <!-- Existing Company -->
          <div
            class="group relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl transform"
            :class="creatingDemo ? 'opacity-50' : 'hover:from-emerald-600 hover:to-teal-700'"
            @click="existingDatabase"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>
              <div class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <h3 class="text-xl font-bold mb-2">Import Company</h3>
            <p class="text-emerald-100 text-sm leading-relaxed">
              Bring your existing financial data into Versoll. Seamless import and migration support.
            </p>
          </div>

          <!-- Demo Mode -->
          <div
            v-if="!files?.length"
            class="group relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl transform"
            :class="creatingDemo ? 'opacity-50' : 'hover:from-amber-600 hover:to-orange-700'"
            @click="createDemo"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <h3 class="text-xl font-bold mb-2">Try Demo</h3>
            <p class="text-amber-100 text-sm leading-relaxed">
              Explore Versoll's powerful features with realistic sample data and transactions.
            </p>
          </div>
        </div>

        <!-- Recent Companies Section -->
        <div v-if="files?.length" class="mb-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Recent Companies
            </h3>
            <button
              class="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              :disabled="creatingDemo"
              @click="createDemo"
            >
              {{ creatingDemo ? 'Please Wait...' : 'Create Another Demo' }}
            </button>
          </div>

          <!-- Company List -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
            <div
              v-for="(file, i) in files"
              :key="file.dbPath"
              class="group bg-gray-50 dark:bg-gray-800 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md border border-gray-200 dark:border-gray-700"
              :class="creatingDemo ? 'opacity-50' : ''"
              :title="`${file.companyName} stored at ${file.dbPath}`"
              @click="selectFile(file)"
            >
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                  {{ file.companyName.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-gray-900 dark:text-gray-100 truncate">
                    {{ file.companyName }}
                  </h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {{ truncate(file.dbPath) }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Modified {{ formatDate(file.modified) }}
                  </p>
                </div>
                <button
                  class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  @click.stop="() => deleteDb(i)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Features Section -->
        <div class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 mb-6">
          <h4 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
            Why Choose Versoll?
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div class="flex flex-col items-center">
              <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center mb-3">
                <svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h5 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">GST Ready</h5>
              <p class="text-sm text-gray-600 dark:text-gray-400">Complete GST compliance with automated returns</p>
            </div>
            <div class="flex flex-col items-center">
              <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center mb-3">
                <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <h5 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">Real-time Analytics</h5>
              <p class="text-sm text-gray-600 dark:text-gray-400">Instant insights into your business performance</p>
            </div>
            <div class="flex flex-col items-center">
              <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-3">
                <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h5 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">Bank Secure</h5>
              <p class="text-sm text-gray-600 dark:text-gray-400">Enterprise-grade security for your data</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-12 py-6 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
        <div class="flex items-center justify-between">
          <LanguageSelector v-show="!creatingDemo" class="text-sm w-32" />
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              Version 2.1.0
            </span>
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <Loading
      v-if="creatingDemo"
      :open="creatingDemo"
      :show-x="false"
      :full-width="true"
      :percent="creationPercent"
      :message="creationMessage"
    />

    <!-- Modal for Base Count Selection -->
    <Modal :open-modal="openModal" @closemodal="openModal = false">
      <div class="p-8 text-gray-900 dark:text-gray-100 w-form bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xl">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold mb-2">Demo Configuration</h2>
          <p class="text-gray-600 dark:text-gray-400">
            Customize your demo experience by setting the data volume
          </p>
        </div>
        
        <div class="flex my-8 justify-center items-baseline gap-4 text-base">
          <label for="basecount" class="text-gray-700 dark:text-gray-300 font-medium">
            Base Count
          </label>
          <input
            v-model="baseCount"
            type="number"
            name="basecount"
            class="bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 border border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-lg px-4 py-2 outline-none transition-all duration-200 w-24 text-center font-semibold text-gray-900 dark:text-gray-100"
          />
        </div>
        
        <div class="flex justify-between gap-4">
          <Button
            @click="openModal = false"
            class="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            @click="() => { openModal = false; startDummyInstanceSetup(); }"
            class="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Create Demo
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { setupDummyInstance } from 'dummy';
import { t } from 'fyo';
import { Verb } from 'fyo/telemetry/types';
import { DateTime } from 'luxon';
import Button from 'src/components/Button.vue';
import LanguageSelector from 'src/components/Controls/LanguageSelector.vue';
import FeatherIcon from 'src/components/FeatherIcon.vue';
import Loading from 'src/components/Loading.vue';
import Modal from 'src/components/Modal.vue';
import { fyo } from 'src/initFyo';
import { showDialog } from 'src/utils/interactive';
import { updateConfigFiles } from 'src/utils/misc';
import { deleteDb, getSavePath, getSelectedFilePath } from 'src/utils/ui';
import type { ConfigFilesWithModified } from 'utils/types';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'DatabaseSelector',
  components: {
    LanguageSelector,
    Loading,
    Modal,
    Button,
  },
  emits: ['file-selected', 'new-database'],
  data() {
    return {
      openModal: false,
      baseCount: 100,
      creationMessage: '',
      creationPercent: 0,
      creatingDemo: false,
      loadingDatabase: false,
      files: [],
    } as {
      openModal: boolean;
      baseCount: number;
      creationMessage: string;
      creationPercent: number;
      creatingDemo: boolean;
      loadingDatabase: boolean;
      files: ConfigFilesWithModified[];
    };
  },
  async mounted() {
    await this.setFiles();

    if (fyo.store.isDevelopment) {
      // @ts-ignore
      window.ds = this;
    }
  },
  methods: {
    truncate(value: string) {
      if (value.length < 50) {
        return value;
      }

      return '...' + value.slice(value.length - 50);
    },
    formatDate(isoDate: string) {
      return DateTime.fromISO(isoDate).toRelative();
    },
    async deleteDb(i: number) {
      const file = this.files[i];
      const setFiles = this.setFiles.bind(this);

      await showDialog({
        title: t`Delete ${file.companyName}?`,
        detail: t`Database file: ${file.dbPath}`,
        type: 'warning',
        buttons: [
          {
            label: this.t`Yes`,
            async action() {
              await deleteDb(file.dbPath);
              await setFiles();
            },
            isPrimary: true,
          },
          {
            label: this.t`No`,
            action() {
              return null;
            },
            isEscape: true,
          },
        ],
      });
    },
    async createDemo() {
      if (!fyo.store.isDevelopment) {
        await this.startDummyInstanceSetup();
      } else {
        this.openModal = true;
      }
    },
    async startDummyInstanceSetup() {
      const { filePath, canceled } = await getSavePath('demo', 'db');
      if (canceled || !filePath) {
        return;
      }

      this.creatingDemo = true;
      await setupDummyInstance(
        filePath,
        fyo,
        1,
        this.baseCount,
        (message, percent) => {
          this.creationMessage = message;
          this.creationPercent = percent;
        }
      );

      updateConfigFiles(fyo);
      await fyo.purgeCache();
      await this.setFiles();
      this.fyo.telemetry.log(Verb.Created, 'dummy-instance');
      this.creatingDemo = false;
      this.$emit('file-selected', filePath);
    },
    async setFiles() {
      const dbList = await ipc.getDbList();
      this.files = dbList?.sort(
        (a, b) => Date.parse(b.modified) - Date.parse(a.modified)
      );
    },
    newDatabase() {
      if (this.creatingDemo) {
        return;
      }

      this.$emit('new-database');
    },
    async existingDatabase() {
      if (this.creatingDemo) {
        return;
      }

      const filePath = (await getSelectedFilePath())?.filePaths?.[0];
      this.emitFileSelected(filePath);
    },
    selectFile(file: ConfigFilesWithModified) {
      if (this.creatingDemo) {
        return;
      }

      this.emitFileSelected(file.dbPath);
    },
    emitFileSelected(filePath: string) {
      if (!filePath) {
        return;
      }

      this.$emit('file-selected', filePath);
    },
  },
});
</script>

<style scoped>
/* Custom animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* Scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.7);
}
</style>