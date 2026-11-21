<script setup lang="ts">
import SelectDestinationChainDialog from './dialogs/SelectDestinationChainDialog.vue'
import DropDown from './ui/DropDown.vue'
import SimpleLabel from './ui/SimpleLabel.vue'

import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { fillDestinationChainConfiguration } from '@/scripts/events/fillDestinationChainConfiguration'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/scripts/common/toast'
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
      v-if="store.state.destinationChainConfiguration"
      :img="`logos/chains/${store.state.destinationChainConfiguration?.logo}.png`"
      :text="store.state.destinationChainConfiguration.name"
      @click="store.state.dialogSelectDestinationChainIsOpen = true"
    ></DropDown>
    <SelectDestinationChainDialog :arc200TokensOnly="props.arc200TokensOnly"></SelectDestinationChainDialog>
  </div>
</template>
