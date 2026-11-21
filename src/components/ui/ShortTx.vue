<script setup lang="ts">
import shortenAddress from '@/scripts/common/shortenAddress'
import CopyIcon from './CopyIcon.vue'
import { useAppStore } from '@/stores/app'
import { getTxExplorers } from '@/scripts/common/txExplorers'
import { computed, reactive } from 'vue'

const props = defineProps({ txId: String, length: Number, chain: Number })

const store = useAppStore()
// reactive, so the explorer link appears once the public configuration loads; unknown chains have no link
const state = reactive({
  explorers: computed(() => {
    const chain = props.chain ?? store.state.sourceChain
    if (!chain || !props.txId) return []
    return getTxExplorers(chain, store.state.publicConfiguration?.chains?.[chain.toString()]?.blockExplorers, props.txId)
  })
})
// the full id only needs revealing (keyboard stop) when it was actually shortened
const truncated = computed(() => !!props.txId && shortenAddress(props.txId, props.length ?? 4) !== props.txId)
</script>
<template>
  <span v-if="state.explorers.length">
    <a v-tooltip.top="truncated ? props.txId : ''" :href="state.explorers[0].url" target="_blank" rel="noreferrer">{{ shortenAddress(props.txId ?? '', props.length ?? 4) }}</a>
    <details v-if="state.explorers.length > 1" class="relative inline-block align-middle ml-1">
      <summary class="cursor-pointer select-none list-none text-xs" aria-label="Other explorers" title="Other explorers">&#9662;</summary>
      <ul class="absolute z-10 mt-1 min-w-max rounded border border-dark-elevation bg-dark-green-1 p-1 text-sm shadow">
        <li v-for="e in state.explorers" :key="e.url">
          <a class="block px-2 py-1 hover:underline" :href="e.url" target="_blank" rel="noreferrer">{{ e.name }}</a>
        </li>
      </ul>
    </details>
  </span>
  <span v-else>
    <span v-tooltip.top="truncated ? props.txId : ''" :tabindex="truncated ? 0 : undefined">{{ shortenAddress(props.txId ?? '', props.length ?? 4) }}</span>
  </span>
  <CopyIcon :text="props.txId"></CopyIcon>
</template>
