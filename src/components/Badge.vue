<template>
  <div
    class="inline-block rounded-full px-3 py-0.5 truncate select-none text-[11px] font-bold uppercase tracking-wider shadow-sm"
    :class="colorClass"
  >
    <slot></slot>
  </div>
</template>

<script>
import { getBgTextColorClass } from 'src/utils/colors';

export default {
  name: 'Badge',
  props: {
    color: {
      default: 'gray',
    },
  },
  computed: {
    colorClass() {
      return getBgTextColorClass(this.color);
    },
  },
};
</script>
