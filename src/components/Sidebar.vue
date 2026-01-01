<template>
  <div
    class="py-4 h-full flex justify-between flex-col bg-gray-50 dark:bg-gray-900 relative border-r dark:border-gray-800"
    :class="{
      'window-drag': platform !== 'Windows',
    }"
  >
    <div class="space-y-1">
      <!-- Company name -->
      <div
        class="px-6 flex flex-row items-center justify-between mb-6"
        :class="
          platform === 'Mac' && languageDirection === 'ltr' ? 'mt-8' : 'mt-2'
        "
      >
        <h6
          data-testid="company-name"
          class="font-bold text-lg dark:text-gray-100 whitespace-nowrap overflow-auto no-scrollbar select-none tracking-tight"
        >
          {{ companyName }}
        </h6>
      </div>

      <!-- Sidebar Items -->
      <div v-for="group in groups" :key="group.label" class="px-3">
        <div
          class="px-3 flex items-center cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-800/50 h-10 rounded-lg transition-all duration-300"
          :class="
            isGroupActive(group) && !group.items
              ? 'bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 font-semibold shadow-sm border border-gray-100 dark:border-gray-700'
              : 'text-gray-600 dark:text-gray-400 font-medium'
          "
          @click="routeToSidebarItem(group)"
        >
          <div class="text-base tracking-tight">
            {{ group.label }}
          </div>
        </div>

        <!-- Expanded Group -->
        <div v-if="group.items && isGroupActive(group)" class="mt-1 space-y-1">
          <div
            v-for="item in group.items"
            :key="item.label"
            class="text-[15px] h-9 ps-4 pe-3 cursor-pointer flex items-center hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-300"
            :class="
              isItemActive(item)
                ? 'bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 font-semibold shadow-sm border border-gray-100 dark:border-gray-700'
                : 'text-gray-500 dark:text-gray-400 font-medium'
            "
            @click="routeToSidebarItem(item)"
          >
            {{ item.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- Report Issue and DB Switcher -->
    <div
      class="window-no-drag flex flex-col gap-3 py-6 px-6 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50"
    >
      <button
        class="flex text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 items-center transition-colors duration-200"
        @click="openDocumentation"
      >
        <span>{{ t`Help` }}</span>
      </button>

      <button
        class="flex text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 items-center transition-colors duration-200"
        @click="viewShortcuts = true"
      >
        <span>{{ t`Shortcuts` }}</span>
      </button>

      <button
        data-testid="change-db"
        class="flex text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 items-center transition-colors duration-200"
        @click="$emit('change-db-file')"
      >
        <span>{{ t`Change DB` }}</span>
      </button>

      <button
        class="flex text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 items-center transition-colors duration-200"
        @click="() => reportIssue()"
      >
        <span>{{ t`Report Issue` }}</span>
      </button>

      <p
        v-if="showDevMode"
        class="text-[10px] uppercase tracking-wider text-gray-400 select-none cursor-pointer mt-2"
        @click="showDevMode = false"
        title="Open dev tools with Ctrl+Shift+I"
      >
        dev mode
      </p>
    </div>

    <!-- Hide Sidebar Button -->
    <button
      class="absolute bottom-4 end-4 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg p-1.5 transition-all duration-200 rtl-rotate-180"
      @click="() => toggleSidebar()"
    >
      <feather-icon name="chevrons-left" class="w-4 h-4" />
    </button>

    <Modal :open-modal="viewShortcuts" @closemodal="viewShortcuts = false">
      <ShortcutsHelper class="w-form" />
    </Modal>
  </div>
</template>
<script lang="ts">
import { reportIssue } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import { languageDirectionKey, shortcutsKey } from 'src/utils/injectionKeys';
import { docsPathRef } from 'src/utils/refs';
import { getSidebarConfig } from 'src/utils/sidebarConfig';
import { SidebarConfig, SidebarItem, SidebarRoot } from 'src/utils/types';
import { routeTo, toggleSidebar } from 'src/utils/ui';
import { defineComponent, inject } from 'vue';
import router from '../router';
import Icon from './Icon.vue';
import Modal from './Modal.vue';
import ShortcutsHelper from './ShortcutsHelper.vue';

const COMPONENT_NAME = 'Sidebar';

export default defineComponent({
  components: {
    Icon,
    Modal,
    ShortcutsHelper,
  },
  props: {
    darkMode: { type: Boolean, default: false },
  },
  emits: ['change-db-file', 'toggle-darkmode'],
  setup() {
    return {
      languageDirection: inject(languageDirectionKey),
      shortcuts: inject(shortcutsKey),
    };
  },
  data() {
    return {
      companyName: '',
      groups: [],
      viewShortcuts: false,
      activeGroup: null,
      showDevMode: false,
    } as {
      companyName: string;
      groups: SidebarConfig;
      viewShortcuts: boolean;
      activeGroup: null | SidebarRoot;
      showDevMode: boolean;
    };
  },
  computed: {
    appVersion() {
      return fyo.store.appVersion;
    },
  },
  async mounted() {
    const { companyName } = await fyo.doc.getDoc('AccountingSettings');
    this.companyName = companyName as string;
    this.groups = await getSidebarConfig();

    this.setActiveGroup();
    router.afterEach(() => {
      this.setActiveGroup();
    });

    this.shortcuts?.shift.set(COMPONENT_NAME, ['KeyH'], () => {
      if (document.body === document.activeElement) {
        this.toggleSidebar();
      }
    });
    this.shortcuts?.set(COMPONENT_NAME, ['F1'], () => this.openDocumentation());

    this.showDevMode = this.fyo.store.isDevelopment;
  },
  unmounted() {
    this.shortcuts?.delete(COMPONENT_NAME);
  },
  methods: {
    routeTo,
    reportIssue,
    toggleSidebar,
    openDocumentation() {
      ipc.openLink('https://docs.sharaledger.com/' + docsPathRef.value);
    },
    setActiveGroup() {
      const { fullPath } = this.$router.currentRoute.value;
      const fallBackGroup = this.activeGroup;
      this.activeGroup =
        this.groups.find((g) => {
          if (fullPath.startsWith(g.route) && g.route !== '/') {
            return true;
          }

          if (g.route === fullPath) {
            return true;
          }

          if (g.items) {
            let activeItem = g.items.filter(
              ({ route }) => route === fullPath || fullPath.startsWith(route)
            );

            if (activeItem.length) {
              return true;
            }
          }
        }) ??
        fallBackGroup ??
        this.groups[0];
    },
    isItemActive(item: SidebarItem) {
      const { path: currentRoute, params } = this.$route;
      const routeMatch = currentRoute === item.route;

      const schemaNameMatch =
        item.schemaName && params.schemaName === item.schemaName;

      const isMatch = routeMatch || schemaNameMatch;
      if (params.name && item.schemaName && !isMatch) {
        return currentRoute.includes(`${item.schemaName}/${params.name}`);
      }

      return isMatch;
    },
    isGroupActive(group: SidebarRoot) {
      return this.activeGroup && group.label === this.activeGroup.label;
    },
    routeToSidebarItem(item: SidebarItem | SidebarRoot) {
      routeTo(this.getPath(item));
    },
    getPath(item: SidebarItem | SidebarRoot) {
      const { route: path, filters } = item;
      if (!filters) {
        return path;
      }

      return { path, query: { filters: JSON.stringify(filters) } };
    },
  },
});
</script>
