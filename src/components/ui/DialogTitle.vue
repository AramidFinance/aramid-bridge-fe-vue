<script setup lang="ts">
defineProps<{
  id: string  // Required for aria-labelledby
  level?: 1 | 2 | 3 | 4 | 5 | 6  // Heading level, defaults to 2
}>()
</script>

<template>
  <component
    :is="`h${level || 2}`"
    :id="id"
    class="mx-4 mt-1 text-xl 3xl:text-2xl 4xl:text-3xl font-satoshi font-semibold text-primary-light w-max"
  >
    <slot />
  </component>
  <hr class="h-px my-4 bg-divider border-0 dark:bg-gray-700" />
</template>