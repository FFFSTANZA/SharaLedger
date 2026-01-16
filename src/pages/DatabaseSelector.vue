<template>
  <div
    class="flex-1 flex justify-center items-center bg-gradient-to-br from-violet-50 to-teal-50 dark:from-gray-950 dark:to-gray-900"
    :class="{
      'pointer-events-none': loadingDatabase,
      'window-drag': platform !== 'Windows',
    }"
  >
    <div
      class="w-full w-form shadow-2xl rounded-3xl border border-white dark:border-gray-800 relative bg-white/90 dark:bg-gray-875/90 backdrop-blur-md overflow-hidden"
      style="height: 720px"
    >
      <!-- Welcome to Versoll Books -->
      <div class="px-8 pt-10 pb-6">
        <h1
          class="text-3xl font-bold select-none text-gray-900 dark:text-gray-25 tracking-tight"
        >
          {{ t`Welcome to Versoll Books` }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 text-lg mt-2 select-none">
          {{ t`Your premium accounting companion` }}
        </p>
      </div>

      <!-- Action items -->
      <div class="px-4 space-y-2">
        <!-- New File -->
        <div
          data-testid="create-new-file"
          class="px-4 h-24 flex flex-row items-center gap-5 p-4 rounded-2xl transition-all duration-300 group"
          :class="
            creatingDemo
              ? 'opacity-50'
              : 'hover:bg-violet-50 dark:hover:bg-violet-900/20 cursor-pointer'
          "
          @click="newDatabase"
        >
          <div
            class="w-12 h-12 rounded-2xl bg-violet-600 shadow-lg shadow-violet-200 dark:shadow-none flex-center group-hover:scale-110 transition-transform duration-300"
          >
            <feather-icon name="plus" class="text-white w-6 h-6" />
          </div>

          <div>
            <p class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t`New Company` }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t`Start a fresh journey with a new company` }}
            </p>
          </div>
        </div>

        <!-- Existing File -->
        <div
          class="px-4 h-24 flex flex-row items-center gap-5 p-4 rounded-2xl transition-all duration-300 group"
          :class="
            creatingDemo
              ? 'opacity-50'
              : 'hover:bg-teal-50 dark:hover:bg-teal-900/20 cursor-pointer'
          "
          @click="existingDatabase"
        >
          <div
            class="w-12 h-12 rounded-2xl bg-teal-600 shadow-lg shadow-teal-200 dark:shadow-none flex-center group-hover:scale-110 transition-transform duration-300"
          >
            <feather-icon name="upload" class="w-6 h-6 text-white" />
          </div>
          <div>
            <p class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t`Existing Company` }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t`Import your data from an existing file` }}
            </p>
          </div>
        </div>

        <!-- Create Demo -->
        <div
          v-if="!files?.length"
          class="px-4 h-24 flex flex-row items-center gap-5 p-4 rounded-2xl transition-all duration-300 group"
          :class="
            creatingDemo
              ? 'opacity-50'
              : 'hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer'
          "
          @click="createDemo"
        >
          <div
            class="w-12 h-12 rounded-2xl bg-amber-500 shadow-lg shadow-amber-200 dark:shadow-none flex-center group-hover:scale-110 transition-transform duration-300"
          >
            <feather-icon name="monitor" class="w-6 h-6 text-white" />
          </div>
          <div>
            <p class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t`Explore with Demo` }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t`Experience Versoll Books with pre-loaded data` }}
            </p>
          </div>
        </div>
      </div>

      <div class="px-8 mt-8 mb-4">
        <h3
          class="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest"
        >
          {{ files?.length ? t`Recent Companies` : '' }}
        </h3>
      </div>

      <!-- File List -->
      <div class="overflow-y-auto px-4" style="max-height: 280px">
        <div
          v-for="(file, i) in files"
          :key="file.dbPath"
          class="h-20 px-4 flex gap-5 items-center rounded-xl transition-all duration-200 mb-1"
          :class="
            creatingDemo
              ? 'opacity-50'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
          "
          :title="t`${file.companyName} stored at ${file.dbPath}`"
          @click="selectFile(file)"
        >
          <div
            class="w-10 h-10 rounded-xl flex justify-center items-center bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold flex-shrink-0 text-base"
          >
            {{ file.companyName.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-baseline">
              <h2 class="font-bold text-gray-900 dark:text-gray-100 truncate">
                {{ file.companyName }}
              </h2>
              <p
                class="whitespace-nowrap text-xs font-medium text-gray-400 dark:text-gray-500"
              >
                {{ formatDate(file.modified) }}
              </p>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {{ file.dbPath }}
            </p>
          </div>
          <button
            class="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
            @click.stop="() => deleteDb(i)"
          >
            <feather-icon name="trash-2" class="w-4 h-4" />
          </button>
        </div>
      </div>
      <hr v-if="files?.length" class="dark:border-gray-800" />

      <!-- Language Selector -->
      <div
        class="w-full flex justify-between items-center absolute bottom-0 left-0 p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t dark:border-gray-800"
      >
        <LanguageSelector v-show="!creatingDemo" class="text-sm w-32" />
        <button
          v-if="files?.length"
          class="text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-6 py-2 transition-all shadow-md shadow-violet-200 dark:shadow-none"
          :disabled="creatingDemo"
          @click="createDemo"
        >
          {{ creatingDemo ? t`Please Wait` : t`Create Another Demo` }}
        </button>
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
        class="p-8 text-gray-900 dark:text-gray-100 w-form bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xl"
      >
        <h2 class="text-2xl font-bold select-none mb-2">Set Base Count</h2>
        <p class="text-base mt-2 text-gray-600 dark:text-gray-400">
          Base Count is a lower bound on the number of entries made when
          creating the dummy instance.
        </p>
        <div class="flex my-8 justify-center items-baseline gap-4 text-base">
          <label
            for="basecount"
            class="text-gray-700 dark:text-gray-300 font-medium"
            >Base Count</label
          >
          <input
            v-model="baseCount"
            type="number"
            name="basecount"
            class="bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 border border-gray-200 dark:border-gray-600 focus:border-violet-500 dark:focus:border-violet-400 rounded-lg px-4 py-2 outline-none transition-all duration-200 w-24 text-center font-semibold text-gray-900 dark:text-gray-100"
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
            @click="
              () => {
                openModal = false;
                startDummyInstanceSetup();
              }
            "
            class="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md"
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
