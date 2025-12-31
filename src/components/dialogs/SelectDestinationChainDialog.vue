<script setup lang="ts">
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { fillDestinationChainConfiguration } from '@/scripts/events/fillDestinationChainConfiguration'
import { fillDestinationChainGenesis } from '@/scripts/events/fillDestinationChainGenesis'
import { fillDestinationTokenConfiguration } from '@/scripts/events/fillDestinationTokenConfiguration'
import { fillRouteInfo } from '@/scripts/events/fillRouteInfo'
import { fillSourceChainConfiguration } from '@/scripts/events/fillSourceChainConfiguration'
import { fillSourceTokenConfiguration } from '@/scripts/events/fillSourceTokenConfiguration'
import { resetDestinationTokenIfNotMatched } from '@/scripts/events/resetDestinationTokenIfNotMatched'
import { resetSourceChainIfNotMatched } from '@/scripts/events/resetSourceChainIfNotMatched'
import { resetSourceTokenIfNotMatched } from '@/scripts/events/resetSourceTokenIfNotMatched'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import { computed, defineProps, onMounted, reactive, watch, withDefaults } from 'vue'
import { useI18n } from 'vue-i18n'
import ChainButton from '../ui/ChainButton.vue'
import DialogTitle from '../ui/DialogTitle.vue'

const props = withDefaults(defineProps<{ arc200TokensOnly?: boolean }>(), { arc200TokensOnly: false })

const store = useAppStore()
const { t } = useI18n()

const chainButtonClick = (newDestChainId: number) => {
  store.state.dialogSelectDestinationChainIsOpen = false
  fillDestinationChainConfiguration(newDestChainId)
  resetSourceChainIfNotMatched()
  console.log('chainButtonClick', store.state.sourceChain, store.state.destinationChain)
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

const displayedChains = computed(() => {
  if (!state.chains) return null
  if (props.arc200TokensOnly) {
    return state.chains.filter((chain) => chain.type === 'algo')
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
  <div :class="store.state.dialogSelectDestinationChainIsOpen ? '' : 'hidden'">
    <div class="full-screen backdrop-blur-sm z-[100]" @click="store.state.dialogSelectDestinationChainIsOpen = false"></div>
    <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col z-[101]">
      <ul class="bg-gradient-to-r from-topleft-purple to-bottomright-purple drop-shadow-menu-default rounded-[26px] p-3">
        <DialogTitle>{{ t('dialogs.selectDestinationNetwork') }}</DialogTitle>

        <ChainButton v-for="(item, index) in displayedChains" :key="index" :img="item.logo" :text="item.name" @click="chainButtonClick(item.chainId)"></ChainButton>
      </ul>
    </div>
  </div>
</template>
