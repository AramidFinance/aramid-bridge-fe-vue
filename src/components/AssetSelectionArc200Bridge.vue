<script setup lang="ts">
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { fillDestinationTokenConfiguration } from '@/scripts/events/fillDestinationTokenConfiguration'
import { fillRouteInfo } from '@/scripts/events/fillRouteInfo'
import { resetDestinationTokenIfNotMatched } from '@/scripts/events/resetDestinationTokenIfNotMatched'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import SelectArc200BridgeAssetDialog from './dialogs/SelectArc200BridgeAssetDialog.vue'
import DropDown from './ui/DropDown.vue'
import SimpleLabel from './ui/SimpleLabel.vue'

const { t } = useI18n()
const toast = useToast()
const store = useAppStore()
const route = useRoute()

interface IState {
  publicConfiguration: PublicConfigurationRoot | null
}
const state: IState = reactive({
  publicConfiguration: null,
  chain: store.state.sourceChainConfiguration as ChainItem
})

const fillInState = () => {
  try {
    resetDestinationTokenIfNotMatched()
    fillDestinationTokenConfiguration(undefined, route.params['destinationToken'])
    fillRouteInfo()
  } catch (e: any) {
    console.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 3000
    })
  }
}

onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  fillInState()
})

watch(
  () => store.state.sourceToken,
  () => {
    fillInState()
  }
)
</script>
<template>
  <div>
    <SimpleLabel>ARC200 asset</SimpleLabel>
    <DropDown
      v-tooltip.top="'Select the asset you want to receive on the destination blockchain.'"
      v-if="store.state.arc200BridgeTokenConfiguration"
      :img="`logos/tokens/${store.state.arc200BridgeTokenConfiguration?.logo}.png`"
      :text="store.state.arc200BridgeTokenConfiguration.name"
      @click="store.state.dialogSelectArc200BridgeAssetIsOpen = true"
    ></DropDown>
    <DropDown img="" text="Select asset" v-else @click="store.state.dialogSelectArc200BridgeAssetIsOpen = true"></DropDown>
    <SelectArc200BridgeAssetDialog></SelectArc200BridgeAssetDialog>
  </div>
</template>
