<template>
  <div
    class="py-4 h-full flex justify-between flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 relative border-r border-gray-200 dark:border-gray-700 shadow-lg"
    :class="{
      'window-drag': platform !== 'Windows',
    }"
  >
    <div class="space-y-1">
      <!-- Company name -->
      <div
        class="px-6 flex flex-row items-center justify-between mb-8"
        :class="
          platform === 'Mac' && languageDirection === 'ltr' ? 'mt-8' : 'mt-4'
        "
      >
        <h6
          data-testid="company-name"
          class="font-bold text-xl text-gray-900 dark:text-gray-100 whitespace-nowrap overflow-auto no-scrollbar select-none tracking-tight"
        >
          {{ companyName }}
        </h6>
      </div>

      <!-- Sidebar Items -->
      <div v-for="group in groups" :key="group.label" class="px-2">
        <div
          class="px-3 flex items-center cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/20 h-10 rounded-lg transition-all duration-200 group"
          :class="
            isGroupActive(group) && !group.items
              ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-semibold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          "
          @click="routeToSidebarItem(group)"
        >
          <div class="text-sm font-medium tracking-tight">
            {{ group.label }}
          </div>
        </div>

        <!-- Expanded Group -->
        <div v-if="group.items && isGroupActive(group)" class="mt-1 space-y-1">
          <div
            v-for="item in group.items"
            :key="item.label"
            class="text-sm h-9 ps-6 pe-3 cursor-pointer flex items-center hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-md transition-all duration-200 group"
            :class="
              isItemActive(item)
                ? 'text-violet-600 dark:text-violet-400 font-medium'
                : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
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
      class="window-no-drag flex flex-col gap-2 py-6 px-4 border-t border-gray-100 dark:border-gray-800"
    >
      <button
        class="flex text-xs text-gray-500 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 items-center transition-colors px-2 py-1 rounded hover:bg-violet-50 dark:hover:bg-violet-900/20"
        @click="openDocumentation"
      >
        <span>{{ t`Help` }}</span>
      </button>

      <button
        class="flex text-xs text-gray-500 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 items-center transition-colors px-2 py-1 rounded hover:bg-violet-50 dark:hover:bg-violet-900/20"
        @click="viewShortcuts = true"
      >
        <span>{{ t`Shortcuts` }}</span>
      </button>

      <button
        data-testid="change-db"
        class="flex text-xs text-gray-500 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 items-center transition-colors px-2 py-1 rounded hover:bg-violet-50 dark:hover:bg-violet-900/20"
        @click="$emit('change-db-file')"
      >
        <span>{{ t`Change DB` }}</span>
      </button>

      <button
        class="flex text-xs text-gray-500 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 items-center transition-colors px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20"
        @click="() => reportIssue()"
      >
        <span>{{ t`Report Issue` }}</span>
      </button>

      <p
        v-if="showDevMode"
        class="text-[10px] text-gray-400 dark:text-gray-600 px-2 py-1 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
        @click="showDevMode = false"
        title="Open dev tools with Ctrl+Shift+I"
      >
        dev mode
      </p>
    </div>

    <!-- Hide Sidebar Button -->
    <button
      class="absolute bottom-4 end-3 text-gray-400 dark:text-gray-600 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg p-2 transition-colors hover:bg-violet-50 dark:hover:bg-violet-900/20"
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
