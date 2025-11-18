<script setup lang="ts">
import SimpleLabel from './ui/SimpleLabel.vue'
import logger from "@/scripts/common/conditionalLogger"
import DropDown from './ui/DropDown.vue'
import SelectDestinationChainDialog from './dialogs/SelectDestinationChainDialog.vue'

import { useAppStore } from '@/stores/app'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { onMounted, reactive, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { fillDestinationChainConfiguration } from '@/scripts/events/fillDestinationChainConfiguration'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const toast = useToast()
const store = useAppStore()
const route = useRoute()

interface IState {
  publicConfiguration: PublicConfigurationRoot | null
}
const state: IState = reactive({
  publicConfiguration: null,
  chain: store.state.destinationChainConfiguration as ChainItem
})
onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  fillInState()
})
const fillInState = () => {
  try {
    if (!state.publicConfiguration) return
    if (!store.state.sourceChain) return

    if (!store.state.destinationChainConfiguration) {
      fillDestinationChainConfiguration(undefined, route.params['destinationChain'])
    }
  } catch (e: any) {
    logger.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 3000
    })
  }
}

watch(
  () => store.state.sourceChain,
  () => {
    fillInState()
  }
)
</script>
<template>
  <div>
    <SimpleLabel>{{ t('chain.destinationChain') }}</SimpleLabel>
    <DropDown
      v-tooltip.top="t('chain.tooltipDestination')"
      v-if="store.state.destinationChainConfiguration"
      :img="`logos/chains/${store.state.destinationChainConfiguration?.logo}.png`"
      :text="store.state.destinationChainConfiguration.name"
      @click="store.state.dialogSelectDestinationChainIsOpen = true"
    ></DropDown>
    <SelectDestinationChainDialog></SelectDestinationChainDialog>
  </div>
</template>
