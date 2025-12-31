<template>
  <div
    class="flex items-center justify-between text-gray-900 dark:text-white mb-2"
  >
    <h3 class="font-bold text-lg tracking-tight">
      <slot name="title"></slot>
    </h3>
    <div class="flex items-center gap-2">
      <slot name="action"></slot>
    </div>
  </div>
</template>
