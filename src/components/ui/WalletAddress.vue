<script setup lang="ts">
import { computed } from 'vue'
import shortenAddress from '@/scripts/common/shortenAddress'

const props = withDefaults(defineProps<{ address?: string; length?: number; focusable?: boolean }>(), { length: 4, focusable: true })

const short = computed(() => shortenAddress(props.address ?? '', props.length))
// the full value only needs revealing (tooltip, keyboard stop) when it was actually shortened
const truncated = computed(() => !!props.address && short.value !== props.address)
</script>
<template>
  <span v-tooltip.top="truncated ? props.address : ''" :tabindex="truncated && props.focusable ? 0 : undefined">{{ short }}</span>
</template>
