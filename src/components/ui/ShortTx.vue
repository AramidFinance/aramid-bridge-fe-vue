<script setup lang="ts">
import shortenAddress from '@/scripts/common/shortenAddress'
import CopyIcon from './CopyIcon.vue'
import { useAppStore } from '@/stores/app'
import { getTxExplorers } from '@/scripts/common/txExplorers'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

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
const { t } = useI18n()
const menu = ref<HTMLDetailsElement | null>(null)
const close = () => {
  if (menu.value) menu.value.open = false
}
const onOutside = (e: Event) => {
  if (menu.value?.open && !menu.value.contains(e.target as Node)) close()
}
// the document listener only exists while the menu is open
const onToggle = () => {
  if (menu.value?.open) document.addEventListener('pointerdown', onOutside)
  else document.removeEventListener('pointerdown', onOutside)
}
// the menu element can disappear without a toggle event
watch(() => state.explorers.length, (n) => {
  if (n < 2) document.removeEventListener('pointerdown', onOutside)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))
// the full id only needs revealing (keyboard stop) when it was actually shortened
const truncated = computed(() => !!props.txId && shortenAddress(props.txId, props.length ?? 4) !== props.txId)
</script>
<template>
  <span v-if="state.explorers.length">
    <a v-tooltip.top="truncated ? props.txId : ''" :href="state.explorers[0].url" target="_blank" rel="noreferrer">{{ shortenAddress(props.txId ?? '', props.length ?? 4) }}</a>
    <details v-if="state.explorers.length > 1" ref="menu" @toggle="onToggle" class="relative inline-block align-middle ml-1" @keydown.esc="close">
      <summary class="cursor-pointer select-none list-none text-xs" :aria-label="t('sign.otherExplorers')" :title="t('sign.otherExplorers')">&#9662;</summary>
      <ul class="absolute z-10 mt-1 min-w-max rounded border border-dark-elevation bg-dark-green-1 p-1 text-sm shadow">
        <li v-for="e in state.explorers.slice(1)" :key="e.url">
          <a class="block px-2 py-1 hover:underline" :href="e.url" target="_blank" rel="noreferrer" @click="close">{{ e.name }}</a>
        </li>
      </ul>
    </details>
  </span>
  <span v-else>
    <span v-tooltip.top="truncated ? props.txId : ''" :tabindex="truncated ? 0 : undefined">{{ shortenAddress(props.txId ?? '', props.length ?? 4) }}</span>
  </span>
  <CopyIcon :text="props.txId"></CopyIcon>
</template>
