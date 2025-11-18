<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import logger from "@/scripts/common/conditionalLogger"
import ChainButton from '../ui/ChainButton.vue'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { onMounted, reactive, watch, ref, computed } from 'vue'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { fillDestinationChainConfiguration } from '@/scripts/events/fillDestinationChainConfiguration'
import { resetSourceChainIfNotMatched } from '@/scripts/events/resetSourceChainIfNotMatched'
import { fillSourceChainConfiguration } from '@/scripts/events/fillSourceChainConfiguration'
import { resetSourceTokenIfNotMatched } from '@/scripts/events/resetSourceTokenIfNotMatched'
import { fillSourceTokenConfiguration } from '@/scripts/events/fillSourceTokenConfiguration'
import { resetDestinationTokenIfNotMatched } from '@/scripts/events/resetDestinationTokenIfNotMatched'
import { fillDestinationTokenConfiguration } from '@/scripts/events/fillDestinationTokenConfiguration'
import DialogTitle from '../ui/DialogTitle.vue'
import { fillRouteInfo } from '@/scripts/events/fillRouteInfo'
import { fillDestinationChainGenesis } from '@/scripts/events/fillDestinationChainGenesis'
import { useFocusTrap } from '@/composables/useFocusTrap'

const store = useAppStore()
const dialogRef = ref<HTMLElement | null>(null)
const isOpen = computed(() => store.state.dialogSelectDestinationChainIsOpen)

useFocusTrap(dialogRef, isOpen)

const chainButtonClick = (newDestChainId: number) => {
  store.state.dialogSelectDestinationChainIsOpen = false
  fillDestinationChainConfiguration(newDestChainId)
  resetSourceChainIfNotMatched()
  logger.debug('chainButtonClick', store.state.sourceChain, store.state.destinationChain)
  if (!store.state.sourceChain) {
    fillSourceChainConfiguration()
  }
  resetSourceTokenIfNotMatched()
  if (!store.state.sourceToken) {
    fillSourceTokenConfiguration()
  }

  resetDestinationTokenIfNotMatched()
  if (!store.state.destinationToken) {
    fillDestinationTokenConfiguration()
  }
  fillRouteInfo()
}

watch(
  () => store.state.sourceChainConfiguration,
  async () => {
    await fillDestinationChainGenesis()
  }
)

interface IState {
  publicConfiguration: PublicConfigurationRoot | null
  chains: ChainItem[] | null
}
const state: IState = reactive({
  publicConfiguration: null,
  chains: null
})
onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  if (!state.publicConfiguration) return

  state.chains = Object.keys(state.publicConfiguration.chains2tokens).map((c) => (state.publicConfiguration as PublicConfigurationRoot).chains[c])
})
</script>
<template>
  <div :class="store.state.dialogSelectDestinationChainIsOpen ? '' : 'hidden'">
    <div class="full-screen backdrop-blur-sm z-[100]" @click="store.state.dialogSelectDestinationChainIsOpen = false"></div>
    <div
      ref="dialogRef"
      class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col z-[101]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-destination-chain-title"
      @keydown.esc="store.state.dialogSelectDestinationChainIsOpen = false"
    >
      <ul class="bg-gradient-brand drop-shadow-menu-default rounded-2xl p-3">
        <DialogTitle id="select-destination-chain-title">Select destination network</DialogTitle>

        <ChainButton v-for="(item, index) in state.chains" :key="index" :img="item.logo" :text="item.name" @click="chainButtonClick(item.chainId)" :autofocus="index === 0"></ChainButton>
      </ul>
    </div>
  </div>
</template>
