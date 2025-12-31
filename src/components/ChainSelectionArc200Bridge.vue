<script setup lang="ts">
import SelectArc200BridgeChainDialog from './dialogs/SelectArc200BridgeChainDialog.vue'
import DropDown from './ui/DropDown.vue'
import SimpleLabel from './ui/SimpleLabel.vue'

import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { fillArc200BridgeChainConfiguration } from '@/scripts/events/fillArc200BridgeChainConfiguration'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const toast = useToast()
const store = useAppStore()
const route = useRoute()
const props = withDefaults(defineProps<{ arc200TokensOnly?: boolean }>(), { arc200TokensOnly: false })

interface IState {
  publicConfiguration: PublicConfigurationRoot | null
}
const state: IState = reactive({
  publicConfiguration: null,
  chain: store.state.arc200BridgeChainConfiguration as ChainItem
})
onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  fillInState()
})
const fillInState = () => {
  try {
    if (!state.publicConfiguration) return

    if (!store.state.arc200BridgeChainConfiguration) {
      fillArc200BridgeChainConfiguration(undefined, route.params['destinationChain'])
    }
  } catch (e: any) {
    console.error(e)
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
      v-if="store.state.arc200BridgeChainConfiguration"
      :img="`logos/chains/${store.state.arc200BridgeChainConfiguration?.logo}.png`"
      :text="store.state.arc200BridgeChainConfiguration.name"
      @click="store.state.dialogSelectArc200BridgeChainIsOpen = true"
    ></DropDown>
    <SelectArc200BridgeChainDialog :arc200TokensOnly="props.arc200TokensOnly"></SelectArc200BridgeChainDialog>
  </div>
</template>
