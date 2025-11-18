<script setup lang="ts">
import SimpleLabel from './ui/SimpleLabel.vue'
import logger from "@/scripts/common/conditionalLogger"
import DropDown from './ui/DropDown.vue'
import SelectDestinationAssetDialog from './dialogs/SelectDestinationAssetDialog.vue'
import { useAppStore } from '@/stores/app'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { onMounted, reactive, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { resetDestinationTokenIfNotMatched } from '@/scripts/events/resetDestinationTokenIfNotMatched'
import { fillDestinationTokenConfiguration } from '@/scripts/events/fillDestinationTokenConfiguration'
import { fillRouteInfo } from '@/scripts/events/fillRouteInfo'
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
  chain: store.state.sourceChainConfiguration as ChainItem
})

const fillInState = () => {
  try {
    resetDestinationTokenIfNotMatched()
    fillDestinationTokenConfiguration(undefined, route.params['destinationToken'])
    fillRouteInfo()
  } catch (e: any) {
    logger.error(e)
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
    <SimpleLabel>{{ t('asset.receive') }}</SimpleLabel>
    <DropDown
      v-tooltip.top="'Select the asset you want to receive on the destination blockchain.'"
      v-if="store.state.destinationTokenConfiguration"
      :img="`logos/tokens/${store.state.destinationTokenConfiguration?.logo}.png`"
      :text="store.state.destinationTokenConfiguration.name"
      @click="store.state.dialogSelectDestinationAssetIsOpen = true"
    ></DropDown>
    <SelectDestinationAssetDialog></SelectDestinationAssetDialog>
  </div>
</template>
