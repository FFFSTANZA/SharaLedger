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
          class="px-3 flex items-center cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-800/50 h-10 rounded-lg transition-colors duration-200"
          :class="
            isGroupActive(group) && !group.items
              ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium shadow-sm shadow-violet-200/50 dark:shadow-none'
              : 'text-gray-700 dark:text-gray-300'
          "
          @click="routeToSidebarItem(group)"
        >
          <Icon
            class="flex-shrink-0"
            :name="group.icon"
            :size="group.iconSize || '18'"
            :height="group.iconHeight ?? 0"
            :active="!!isGroupActive(group)"
            :darkMode="darkMode"
            :class="
              isGroupActive(group) && !group.items
                ? 'text-violet-600 dark:text-violet-400'
                : ''
            "
          />
          <div class="ms-3 text-base">
            {{ group.label }}
          </div>
        </div>

        <!-- Expanded Group -->
        <div v-if="group.items && isGroupActive(group)" class="mt-1 space-y-1">
          <div
            v-for="item in group.items"
            :key="item.label"
            class="text-base h-9 ps-11 pe-3 cursor-pointer flex items-center hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
            :class="
              isItemActive(item)
                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium shadow-sm shadow-violet-200/50 dark:shadow-none'
                : 'text-gray-600 dark:text-gray-400'
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
      class="window-no-drag flex flex-col gap-2 py-4 px-6 border-t dark:border-gray-800"
    >
      <button
        class="flex text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 gap-2 items-center transition-colors duration-200"
        @click="openDocumentation"
      >
        <feather-icon name="help-circle" class="h-4 w-4 flex-shrink-0" />
        <span>{{ t`Help` }}</span>
      </button>

      <button
        class="flex text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 gap-2 items-center transition-colors duration-200"
        @click="viewShortcuts = true"
      >
        <feather-icon name="command" class="h-4 w-4 flex-shrink-0" />
        <span>{{ t`Shortcuts` }}</span>
      </button>

      <button
        data-testid="change-db"
        class="flex text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 gap-2 items-center transition-colors duration-200"
        @click="$emit('change-db-file')"
      >
        <feather-icon name="database" class="h-4 w-4 flex-shrink-0" />
        <span>{{ t`Change DB` }}</span>
      </button>

      <button
        class="flex text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 gap-2 items-center transition-colors duration-200"
        @click="() => reportIssue()"
      >
        <feather-icon name="flag" class="h-4 w-4 flex-shrink-0" />
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
