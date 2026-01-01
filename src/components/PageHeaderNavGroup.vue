<template>
  <div class="flex items-center gap-1">
    <SearchBar />
    <!-- Back Button -->
    <a
      ref="backlink"
      class="nav-link rounded-l-xl dark:bg-gray-800"
      :class="
        historyState.back
          ? 'text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
          : 'text-gray-300 dark:text-gray-600'
      "
      @click="$router.back()"
    >
      <feather-icon name="arrow-left" class="w-4 h-4" />
    </a>
    <!-- Forward Button -->
    <a
      class="nav-link rounded-r-xl dark:bg-gray-800"
      :class="
        historyState.forward
          ? 'text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
          : 'text-gray-300 dark:text-gray-600'
      "
      @click="$router.forward()"
    >
      <feather-icon name="arrow-right" class="w-4 h-4" />
    </a>
  </div>
</template>
<script lang="ts">
import { shortcutsKey } from 'src/utils/injectionKeys';
import { ref, inject } from 'vue';
import { defineComponent } from 'vue';
import SearchBar from './SearchBar.vue';
import { historyState } from 'src/utils/refs';

const COMPONENT_NAME = 'PageHeaderNavGroup';

export default defineComponent({
  components: { SearchBar },
  setup() {
    return {
      historyState,
      backlink: ref<HTMLAnchorElement | null>(null),
      shortcuts: inject(shortcutsKey),
    };
  },
  computed: {
    hasBack() {
      return !!history.back;
    },
    hasForward() {
      return !!history.forward;
    },
  },
  activated() {
    this.shortcuts?.shift.set(COMPONENT_NAME, ['Backspace'], () => {
      this.backlink?.click();
    });
    // @ts-ignore
    window.ng = this;
  },
  deactivated() {
    this.shortcuts?.delete(COMPONENT_NAME);
  },
});
</script>

<style scoped>
.nav-link {
  @apply flex items-center h-8 bg-gray-50 px-2 transition-all duration-200 border dark:border-gray-700;
}
</style>
