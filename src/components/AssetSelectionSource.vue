<script setup lang="ts">
import SimpleLabel from './ui/SimpleLabel.vue'
import logger from "@/scripts/common/conditionalLogger"
import DropDown from './ui/DropDown.vue'
import SelectSourceAssetDialog from './dialogs/SelectSourceAssetDialog.vue'

import { useAppStore } from '@/stores/app'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { onMounted, reactive, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useRoute } from 'vue-router'
import { fillSourceTokenConfiguration } from '@/scripts/events/fillSourceTokenConfiguration'
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
    fillSourceTokenConfiguration(undefined, route.params['sourceToken'])
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
  () => store.state.sourceChainConfiguration,
  () => {
    fillInState()
  }
)
watch(
  () => store.state.destinationChainConfiguration,
  () => {
    fillInState()
  }
)
</script>
<template>
  <div>
    <SimpleLabel>{{ t('asset.bridge') }}</SimpleLabel>
    <DropDown
      v-tooltip.top="t('asset.tooltipSource')"
      v-if="store.state.sourceTokenConfiguration"
      :img="`logos/tokens/${store.state.sourceTokenConfiguration?.logo}.png`"
      :text="store.state.sourceTokenConfiguration.name"
      @click="store.state.dialogSelectSourceAssetIsOpen = true"
    ></DropDown>
    <SelectSourceAssetDialog></SelectSourceAssetDialog>
  </div>
</template>
