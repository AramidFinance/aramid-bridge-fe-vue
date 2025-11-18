<script setup lang="ts">
import SimpleLabel from './ui/SimpleLabel.vue'
import logger from "@/scripts/common/conditionalLogger"
import { useAppStore } from '@/stores/app'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { onMounted, reactive, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { viewAmount } from '@/scripts/common/viewAmount'
import BigNumber from 'bignumber.js'
import calculateFeeAndDestinationAmount from '@/scripts/common/calculateFeeAndDestinationAmount'
import { makeNoteField } from '@/scripts/aramid/makeNoteField'
import { fillSourceChainConfiguration } from '@/scripts/events/fillSourceChainConfiguration'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const toast = useToast()
const store = useAppStore()

interface IState {
  publicConfiguration: PublicConfigurationRoot | null
}
const state: IState = reactive({
  publicConfiguration: null,
  chain: store.state.sourceChainConfiguration as ChainItem
})
onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  fillInState()
})
const fillInState = () => {
  try {
    if (!state.publicConfiguration) return

    if (!store.state.sourceChainConfiguration) {
      fillSourceChainConfiguration()
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

const setWarningIfLowBalanceAtDestinationChain = () => {
  if (!store.state.destinationAmount) return
  if (!store.state.destinationBridgeBalance) return
  if (new BigNumber(store.state.destinationBridgeBalance).lt(new BigNumber(store.state.destinationAmount).multipliedBy(10))) {
    store.state.escrowBalanceIsSufficient10x = false
  } else {
    store.state.escrowBalanceIsSufficient10x = true
  }
  if (new BigNumber(store.state.destinationBridgeBalance).lt(new BigNumber(store.state.destinationAmount))) {
    store.state.escrowBalanceIsSufficient = false
  } else {
    store.state.escrowBalanceIsSufficient = true
  }
  // logger.debug(
  //   'store.state.escrowBalanceIsSufficient',
  //   store.state.escrowBalanceIsSufficient,
  //   store.state.escrowBalanceIsSufficient10x,
  //   store.state.destinationAmount,
  //   store.state.destinationBridgeBalance
  // )
}

watch(
  () => store.state.destinationAmount,
  () => {
    // check 10x warning
    //logger.debug('destinationAmount updated', store.state.escrowBalanceIsSufficient, store.state.escrowBalanceIsSufficient10x, store.state.destinationAmount, store.state.destinationBridgeBalance)
    setWarningIfLowBalanceAtDestinationChain()
  }
)

watch(
  () => store.state.destinationTokenConfiguration,
  () => {
    // check 10x warning
    calculateFeeAndDestinationAmount()
    makeNoteField()
  }
)
watch(
  () => store.state.destinationBridgeBalance,
  () => {
    // check 10x warning
    setWarningIfLowBalanceAtDestinationChain()
  }
)
watch(
  () => store.state.destinationAddress,
  () => {
    // check 10x warning
    setWarningIfLowBalanceAtDestinationChain()
  }
)
watch(
  () => store.state.sourceAmount,
  () => {
    calculateFeeAndDestinationAmount()
    makeNoteField()
    setWarningIfLowBalanceAtDestinationChain()
  }
)
</script>
<template>
  <div class="flex flex-col w-full">
    <SimpleLabel class="justify-center md:justify-end lg:justify-end xl:justify-end md:text-right"> {{ t('amount.toReceive') }} </SimpleLabel>
    <div
      v-tooltip.top="'This is the amount of assets that will be transferred to the destination address.'"
      class="flex items-center bg-transparent h-[40px] text-2xl font-bold rounded-[2px] focus:outline-none text-center md:text-right justify-center md:justify-end mt-5 md:mt-0"
      v-if="store.state.destinationTokenConfiguration"
    >
      {{ viewAmount(store.state.destinationAmount, store.state.destinationTokenConfiguration?.decimals) }}
    </div>

    <div
      v-if="store.state.destinationAddress && store.state.destinationAddressBalance && store.state.destinationTokenConfiguration"
      class="text-white-0.6 my-3 text-center md:text-right md:justify-end w-full text-base 3xl:text-xl 4xl:text-3xl"
      title="Click to refresh source balance"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ t('common.balance') }}: {{ viewAmount(store.state.destinationAddressBalance, store.state.destinationTokenConfiguration?.decimals) }} {{ store.state.destinationTokenConfiguration.name }}
    </div>
  </div>
</template>
