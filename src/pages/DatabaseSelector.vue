<template>
  <div
    class="flex-1 flex justify-center items-center bg-slate-50 dark:bg-slate-950"
    :class="{
      'pointer-events-none': loadingDatabase,
      'window-drag': platform !== 'Windows',
    }"
  >
    <div
      class="w-full max-w-6xl shadow-2xl rounded-3xl border border-slate-200 dark:border-slate-800 relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-hidden"
      style="height: 680px"
    >
      <!-- Header Section -->
      <div class="px-10 pt-10 pb-8">
        <div class="flex items-center gap-4 mb-3">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-300 dark:shadow-violet-900/50 flex items-center justify-center">
            <feather-icon name="book" class="text-white w-7 h-7" />
          </div>
          <div>
            <h1 class="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Versoll Books
            </h1>
            <p class="text-slate-500 dark:text-slate-400 text-base font-medium mt-1">
              Smart accounting for modern businesses
            </p>
          </div>
        </div>
      </div>

      <!-- Main Actions Grid -->
      <div class="px-10 grid grid-cols-3 gap-6">
        <!-- New Company Card -->
        <div
          data-testid="create-new-file"
          class="relative group cursor-pointer"
          :class="{ 'opacity-50 pointer-events-none': creatingDemo }"
          @click="newDatabase"
        >
          <div
            class="h-64 rounded-3xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/30 dark:to-indigo-900/30 border-2 border-violet-100 dark:border-violet-800/50 p-6 flex flex-col justify-between transition-all duration-300 group-hover:border-violet-300 dark:group-hover:border-violet-600 group-hover:shadow-xl group-hover:shadow-violet-100 dark:group-hover:shadow-violet-900/20 group-hover:-translate-y-1"
          >
            <div>
              <div
                class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-200 dark:shadow-violet-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
              >
                <feather-icon name="plus" class="text-white w-8 h-8" />
              </div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
                New Company
              </h3>
              <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Start fresh with a new accounting setup
              </p>
            </div>
            <div
              class="w-full h-1 bg-violet-200 dark:bg-violet-800/50 rounded-full overflow-hidden"
            >
              <div
                class="h-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all duration-500 group-hover:w-full w-0"
              ></div>
            </div>
          </div>
        </div>

        <!-- Existing Company Card -->
        <div
          class="relative group cursor-pointer"
          :class="{ 'opacity-50 pointer-events-none': creatingDemo }"
          @click="existingDatabase"
        >
          <div
            class="h-64 rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 border-2 border-teal-100 dark:border-teal-800/50 p-6 flex flex-col justify-between transition-all duration-300 group-hover:border-teal-300 dark:group-hover:border-teal-600 group-hover:shadow-xl group-hover:shadow-teal-100 dark:group-hover:shadow-teal-900/20 group-hover:-translate-y-1"
          >
            <div>
              <div
                class="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-200 dark:shadow-teal-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
              >
                <feather-icon name="upload" class="text-white w-8 h-8" />
              </div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Existing Company
              </h3>
              <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Import your existing accounting data
              </p>
            </div>
            <div
              class="w-full h-1 bg-teal-200 dark:bg-teal-800/50 rounded-full overflow-hidden"
            >
              <div
                class="h-full bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500 group-hover:w-full w-0"
              ></div>
            </div>
          </div>
        </div>

        <!-- Demo Company Card -->
        <div
          v-if="!files?.length"
          class="relative group cursor-pointer"
          :class="{ 'opacity-50 pointer-events-none': creatingDemo }"
          @click="createDemo"
        >
          <div
            class="h-64 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-100 dark:border-amber-800/50 p-6 flex flex-col justify-between transition-all duration-300 group-hover:border-amber-300 dark:group-hover:border-amber-600 group-hover:shadow-xl group-hover:shadow-amber-100 dark:group-hover:shadow-amber-900/20 group-hover:-translate-y-1"
          >
            <div>
              <div
                class="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-200 dark:shadow-amber-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
              >
                <feather-icon name="play-circle" class="text-white w-8 h-8" />
              </div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Explore Demo
              </h3>
              <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Try Versoll Books with sample data
              </p>
            </div>
            <div
              class="w-full h-1 bg-amber-200 dark:bg-amber-800/50 rounded-full overflow-hidden"
            >
              <div
                class="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500 group-hover:w-full w-0"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Companies Section -->
      <div class="px-10 mt-8">
        <div
          v-if="files?.length"
          class="flex items-center justify-between mb-4"
        >
          <h3 class="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Recent Companies
          </h3>
          <button
            v-if="files?.length"
            class="text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl px-5 py-2 transition-all shadow-md shadow-violet-200 dark:shadow-violet-900/30"
            :disabled="creatingDemo"
            @click="createDemo"
          >
            {{ creatingDemo ? 'Please Wait' : 'Create Demo' }}
          </button>
        </div>

        <!-- File List -->
        <div
          class="space-y-2 overflow-y-auto"
          style="max-height: 200px"
        >
          <div
            v-for="(file, i) in files"
            :key="file.dbPath"
            class="h-16 px-4 flex gap-4 items-center rounded-xl transition-all duration-200"
            :class="
              creatingDemo
                ? 'opacity-50'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'
            "
            :title="`${file.companyName} stored at ${file.dbPath}`"
            @click="selectFile(file)"
          >
            <div
              class="w-11 h-11 rounded-xl flex justify-center items-center bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 text-violet-600 dark:text-violet-400 font-bold flex-shrink-0 text-base shadow-sm"
            >
              {{ file.companyName.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-baseline">
                <h2 class="font-bold text-slate-900 dark:text-white truncate">
                  {{ file.companyName }}
                </h2>
                <p
                  class="whitespace-nowrap text-xs font-medium text-slate-400 dark:text-slate-500"
                >
                  {{ formatDate(file.modified) }}
                </p>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 truncate">
                {{ file.dbPath }}
              </p>
            </div>
            <button
              class="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
              @click.stop="() => deleteDb(i)"
            >
              <feather-icon name="trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="w-full flex justify-between items-center absolute bottom-0 left-0 p-6 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800"
      >
        <LanguageSelector
          v-show="!creatingDemo"
          class="text-sm w-36"
        />
      </div>
    </div>
    <Loading
      v-if="creatingDemo"
      :open="creatingDemo"
      :show-x="false"
      :full-width="true"
      :percent="creationPercent"
      :message="creationMessage"
    />

    <!-- Base Count Selection when Dev -->
    <Modal :open-modal="openModal" @closemodal="openModal = false">
      <div
        class="p-8 text-slate-900 dark:text-white w-form bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl"
      >
        <h2 class="text-2xl font-bold select-none mb-2">Set Base Count</h2>
        <p class="text-base mt-2 text-slate-600 dark:text-slate-400">
          Base Count is a lower bound on the number of entries created
          when setting up the demo instance.
        </p>
        <div class="flex my-8 justify-center items-baseline gap-4 text-base">
          <label
            for="basecount"
            class="text-slate-700 dark:text-slate-300 font-medium"
          >Base Count</label
          >
          <input
            v-model="baseCount"
            type="number"
            name="basecount"
            class="bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600 border border-slate-200 dark:border-slate-600 focus:border-violet-500 dark:focus:border-violet-400 rounded-lg px-4 py-2 outline-none transition-all duration-200 w-24 text-center font-semibold text-slate-900 dark:text-white"
          />
        </div>
        <div class="flex justify-between gap-4">
          <Button
            @click="openModal = false"
            class="px-6 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            @click="
              () => {
                openModal = false;
                startDummyInstanceSetup();
              }
            "
            class="px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md shadow-violet-200 dark:shadow-violet-900/30"
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
    FeatherIcon,
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
      if (value.length < 72) {
        return value;
      }

      return '...' + value.slice(value.length - 72);
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
