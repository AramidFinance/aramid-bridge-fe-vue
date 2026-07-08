<script setup lang="ts">
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import { computed, onMounted, reactive } from 'vue'
import { fillArc200BridgeChainConfiguration } from '../../scripts/events/fillArc200BridgeChainConfiguration'
import ChainButton from '../ui/ChainButton.vue'
import DialogTitle from '../ui/DialogTitle.vue'

const props = withDefaults(defineProps<{ arc200TokensOnly?: boolean }>(), { arc200TokensOnly: false })

const store = useAppStore()

const chainButtonClick = (newDestChainId: number) => {
  store.state.dialogSelectArc200BridgeChainIsOpen = false
  fillArc200BridgeChainConfiguration(newDestChainId)
}

interface IState {
  publicConfiguration: PublicConfigurationRoot | null
  chains: ChainItem[] | null
}
const state: IState = reactive({
  publicConfiguration: null,
  chains: null
})

const displayedChains = computed(() => {
  if (!state.chains) return null
  if (props.arc200TokensOnly) {
    return state.chains.filter((chain) => chain.type === 'algo' && chain.chainId === 416101) // only voi atm
  }
  return state.chains
})

onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  if (!state.publicConfiguration) return

  state.chains = Object.keys(state.publicConfiguration.chains2tokens).map((c) => (state.publicConfiguration as PublicConfigurationRoot).chains[c])
})
</script>
<template>
  <div :class="store.state.dialogSelectArc200BridgeChainIsOpen ? '' : 'hidden'">
    <div class="full-screen backdrop-blur-sm z-[100]" @click="store.state.dialogSelectArc200BridgeChainIsOpen = false"></div>
    <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col z-[101]">
      <ul class="bg-gradient-to-r from-topleft-purple to-bottomright-purple drop-shadow-menu-default rounded-[26px] p-3">
        <DialogTitle>Select blockchain for ARC200 bridginig</DialogTitle>

        <ChainButton v-for="(item, index) in displayedChains" :key="index" :img="item.logo" :text="item.name" @click="chainButtonClick(item.chainId)"></ChainButton>
      </ul>
    </div>
  </div>
</template>
