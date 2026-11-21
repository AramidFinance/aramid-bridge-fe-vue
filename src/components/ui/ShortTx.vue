<script setup lang="ts">
import shortenAddress from '@/scripts/common/shortenAddress'
import CopyIcon from './CopyIcon.vue'
import { useAppStore } from '@/stores/app'
import { computed, reactive } from 'vue'

const props = defineProps({ txId: String, length: Number, chain: Number })

const store = useAppStore()
const state = reactive({
  explorer: ''
})
const chain = props.chain ?? store.state.sourceChain
if (chain && store.state.publicConfiguration?.chains[chain?.toString()].blockExplorers) {
  state.explorer = store.state.publicConfiguration?.chains[chain?.toString()].blockExplorers[0]
}
console.log('state.explorer', props, state.explorer)
// the full id only needs revealing (keyboard stop) when it was actually shortened
const truncated = computed(() => !!props.txId && shortenAddress(props.txId, props.length ?? 4) !== props.txId)
</script>
<template>
  <span v-if="state.explorer">
    <a v-tooltip.top="props.txId" :href="`${state.explorer}${props.txId}`" target="_blank" rel="noreferrer">{{ shortenAddress(props.txId ?? '', props.length ?? 4) }}</a>
  </span>
  <span v-else>
    <span v-tooltip.top="truncated ? props.txId : ''" :tabindex="truncated ? 0 : undefined">{{ shortenAddress(props.txId ?? '', props.length ?? 4) }}</span>
  </span>
  <CopyIcon :text="props.txId"></CopyIcon>
</template>
