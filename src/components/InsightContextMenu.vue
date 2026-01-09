<template>
  <Teleport to="body">
    <div
      v-if="show"
      ref="menu"
      class="fixed bg-white dark:bg-gray-850 border dark:border-gray-700 rounded-lg shadow-lg py-1 z-30 min-w-[200px]"
      :style="{ top: `${y}px`, left: `${x}px` }"
    >
      <button
        class="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
        @click="handleInsightClick"
      >
        <FeatherIcon name="help-circle" class="w-4 h-4" />
        <span>{{ t`Ask a question about this value` }}</span>
      </button>
    </div>
  </Teleport>
</template>

<script lang="ts">
import { t } from 'fyo';
import FeatherIcon from 'src/components/FeatherIcon.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'InsightContextMenu',
  components: { FeatherIcon },
  data() {
    return {
      show: false,
      x: 0,
      y: 0,
    };
  },
  mounted() {
    // Close menu on click outside
    document.addEventListener('click', this.handleClickOutside);
    // Close menu on scroll
    document.addEventListener('scroll', this.close, true);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('scroll', this.close, true);
  },
  methods: {
    open(event: MouseEvent) {
      event.preventDefault();
      event.stopPropagation();

      // Position the menu at the cursor
      this.x = event.clientX;
      this.y = event.clientY;

      // Ensure menu doesn't go off-screen
      this.$nextTick(() => {
        const menu = this.$refs.menu as HTMLElement;
        if (menu) {
          const rect = menu.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          // Adjust horizontal position if menu goes off right edge
          if (rect.right > viewportWidth) {
            this.x = viewportWidth - rect.width - 10;
          }

          // Adjust vertical position if menu goes off bottom edge
          if (rect.bottom > viewportHeight) {
            this.y = viewportHeight - rect.height - 10;
          }
        }
      });

      this.show = true;
    },
    close() {
      this.show = false;
    },
    handleClickOutside(event: Event) {
      const menu = this.$refs.menu as HTMLElement;
      if (menu && !menu.contains(event.target as Node)) {
        this.close();
      }
    },
    handleInsightClick() {
      this.$emit('insight-requested');
      this.close();
    },
  },
});
</script>
