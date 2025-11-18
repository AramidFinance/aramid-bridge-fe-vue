<script setup lang="ts">
import SimpleLabel from './ui/SimpleLabel.vue'
import logger from "@/scripts/common/conditionalLogger"
import DropDown from './ui/DropDown.vue'
import SelectSourceChainDialog from './dialogs/SelectSourceChainDialog.vue'

import { useAppStore } from '@/stores/app'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { onMounted, reactive } from 'vue'
import { useToast } from 'primevue/usetoast'
import { fillSourceChainConfiguration } from '@/scripts/events/fillSourceChainConfiguration'
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
    if (!state.publicConfiguration) return
    if (!store.state.sourceChainConfiguration) {
      //logger.debug("css route.params['sourceChain']", route.params['sourceChain'])
      fillSourceChainConfiguration(undefined, route.params['sourceChain'])
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
onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  fillInState()
})
</script>
<template>
  <div>
    <SimpleLabel>{{ t('chain.origin') }}</SimpleLabel>
    <div class="w-full text-center place-content-center justify-items-center m-auto">
      <DropDown
        v-tooltip.top="t('chain.tooltipOrigin')"
        v-if="store.state.sourceChainConfiguration"
        :img="`logos/chains/${store.state.sourceChainConfiguration?.logo}.png`"
        :text="store.state.sourceChainConfiguration.name"
        @click="store.state.dialogSelectSourceChainIsOpen = true"
      ></DropDown>
    </div>
    <SelectSourceChainDialog></SelectSourceChainDialog>
  </div>
</template>
