<script setup lang="ts">
import shortenAddress from '@/scripts/common/shortenAddress'

const props = defineProps({ address: String, length: Number })
</script>
<template>
  <span v-tooltip.top="props.address">{{ shortenAddress(props.address ?? '', props.length ?? 4) }}</span>
</template>
