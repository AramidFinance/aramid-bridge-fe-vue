<script setup lang="ts">
const props = defineProps({ class: String, for: String })
</script>
<template>
  <label class="text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl" :class="props.class" :for="props.for">
    <slot />
  </label>
</template>
