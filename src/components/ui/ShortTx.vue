<script setup lang="ts">
import shortenAddress from '@/scripts/common/shortenAddress'
import logger from "@/scripts/common/conditionalLogger"
import CopyIcon from './CopyIcon.vue'
import { useAppStore } from '@/stores/app'
import { reactive } from 'vue'

const props = defineProps({ txId: String, length: Number, chain: Number })

const store = useAppStore()
const state = reactive({
  explorer: ''
})
const chain = props.chain ?? store.state.sourceChain
if (chain && store.state.publicConfiguration?.chains[chain?.toString()].blockExplorers) {
  state.explorer = store.state.publicConfiguration?.chains[chain?.toString()].blockExplorers[0]
}
logger.debug('state.explorer', props, state.explorer)
</script>
<template>
  <span v-if="state.explorer">
    <a :href="`${state.explorer}${props.txId}`" target="_blank" rel="noreferrer">
      <span :v-tooltip="props.txId">{{ shortenAddress(props.txId ?? '', props.length ?? 4) }}</span>
    </a>
  </span>
  <span v-else>
    <span :v-tooltip="props.txId">{{ shortenAddress(props.txId ?? '', props.length ?? 4) }}</span>
  </span>
  <CopyIcon :text="props.txId"></CopyIcon>
</template>
