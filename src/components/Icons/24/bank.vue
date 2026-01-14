<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <g fill="none" fill-rule="evenodd">
      <path
        :fill="lightColor"
        d="M2,11 L22,11 L22,21 C22,21.5522847 21.5522847,22 21,22 L3,22 C2.44771525,22 2,21.5522847 2,21 L2,11 Z"
      />
      <path
        :fill="darkColor"
        fill-rule="nonzero"
        d="M12,2 L2,9 L2,21 L22,21 L22,9 L12,2 Z M12,4.5 L18,9 L6,9 L12,4.5 Z M4,12 L4,18 L7,18 L7,12 L4,12 Z M9,12 L9,18 L12,18 L12,12 L9,12 Z M14,12 L14,18 L17,18 L17,12 L14,12 Z M19,12 L20.5,12 L20.5,18 L19,18 L19,12 Z"
      />
    </g>
  </svg>
</template>
<script>
import Base from '../base.vue';
export default {
  name: 'IconBank',
  extends: Base,
};
</script>
