<template>
  <div
    class="flex items-baseline justify-between text-gray-800 dark:text-white"
  >
    <span class="font-semibold text-base tracking-tight"
      ><slot name="title"></slot
    ></span>
    <slot name="action"></slot>
  </div>
</template>
