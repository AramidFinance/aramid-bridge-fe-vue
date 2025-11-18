<script setup lang="ts">
import SimpleLabel from './ui/SimpleLabel.vue'
import shortenAddress from '@/scripts/common/shortenAddress'
import { useAppStore } from '@/stores/app'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import calculateFeeAndDestinationAmount from '@/scripts/common/calculateFeeAndDestinationAmount'
import BigNumber from 'bignumber.js'
import formatBaseAmount from '@/scripts/common/formatBaseAmount'
import { useRoute } from 'vue-router'
import { makeNoteField } from '@/scripts/aramid/makeNoteField'
import { viewAmount } from '@/scripts/common/viewAmount'
import { sanitizeTokenName } from '@/scripts/common/sanitizeTokenName'
import { useI18n } from 'vue-i18n'
import { formatTooltip } from '@/scripts/common/formatTooltip'
import debounce from '@/scripts/common/debounce'
import logger from '@/scripts/common/conditionalLogger'

const { t } = useI18n()
const toast = useToast()
const store = useAppStore()
const route = useRoute()

// Store watcher stop functions for cleanup
const stopWatchers: Array<() => void> = []

interface IState {
  publicConfiguration: PublicConfigurationRoot | null
  sourceAmount: number
}
const state: IState = reactive({
  publicConfiguration: null,
  chain: store.state.sourceChainConfiguration as ChainItem,
  sourceAmount: 0
})

onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  fillInState()
})
const fillInState = () => {
  try {
    if (!state.publicConfiguration) return
    if (!store.state.sourceTokenConfiguration) return
    if (route && route.params && route.params['sourceAmount']) {
      store.state.sourceAmount = route.params['sourceAmount'] as string
      store.state.sourceAmountFormatted = formatBaseAmount(store.state.sourceAmount, store.state.sourceTokenConfiguration.decimals)
      state.sourceAmount = new BigNumber(store.state.sourceAmount).toNumber() / 10 ** store.state.sourceTokenConfiguration.decimals
      logger.debug('state.sourceAmount', new BigNumber(state.sourceAmount).toNumber(), state.sourceAmount)
      calculateFeeAndDestinationAmount()
      makeNoteField()
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

const setAmount = () => {
  if (!store.state.sourceTokenConfiguration) return

  const base = new BigNumber(state.sourceAmount).multipliedBy(new BigNumber(10).pow(store.state.sourceTokenConfiguration.decimals)).toFixed(0, 1)
  store.state.sourceAmount = base
  store.state.sourceAmountFormatted = formatBaseAmount(base, store.state.sourceTokenConfiguration.decimals)
  logger.debug('store.state.sourceAmount', store.state.sourceAmount)
  calculateFeeAndDestinationAmount()
  makeNoteField()
}

// Debounced version to prevent excessive calculations
const debouncedSetAmount = debounce(setAmount, 300)

stopWatchers.push(watch(
  () => state.sourceAmount,
  () => {
    debouncedSetAmount()
  }
))
stopWatchers.push(watch(
  () => store.state.sourceTokenConfiguration,
  () => {
    fillInState()
  }
))
stopWatchers.push(watch(
  () => store.state.sourceAddress,
  () => {
    fillInState()
  }
))
stopWatchers.push(watch(
  () => store.state.sourceToken,
  () => {
    fillInState()
  }
))
stopWatchers.push(watch(
  () => route.params?.sourceAmount,
  () => {
    fillInState()
  }
))

// Cleanup on unmount to prevent memory leaks
onUnmounted(() => {
  stopWatchers.forEach(stop => stop())
  debouncedSetAmount.cancel()
})
const setMax = () => {
  if (!store.state.sourceAddressBalance) return
  if (!store.state.sourceTokenConfiguration) return

  store.state.sourceAmount = store.state.sourceAddressBalance
  if (store.state.sourceToken === '0') {
    // on AVM make sure we deduct the tx fee
    store.state.sourceAmount = new BigNumber(store.state.sourceAddressBalance).minus(101000).toFixed(0, 1)
  }
  store.state.sourceAmountFormatted = formatBaseAmount(store.state.sourceAmount, store.state.sourceTokenConfiguration.decimals)

  state.sourceAmount = new BigNumber(store.state.sourceAmount).toNumber() / 10 ** store.state.sourceTokenConfiguration.decimals
  calculateFeeAndDestinationAmount()
  makeNoteField()
}
</script>
<template>
  <div class="flex flex-col w-full">
    <SimpleLabel for="source-amount-input" class="justify-center md:justify-end lg:justify-end xl:justify-end md:text-right"> {{ t('amount.toBridge') }} </SimpleLabel>
    <div class="flex flex-col md:flex-row justify-center md:justify-end lg:justify-end xl:justify-end">
      <input
        id="source-amount-input"
        v-tooltip.focus.top="formatTooltip(t('amount.tooltipBridge'))"
        type="number"
        min="0"
        placeholder="0.0"
        max="1000000000"
        step="0.00001"
        class="bg-transparent placeholder-current text-2xl font-bold rounded-[2px] focus:outline-none focus:ring-2 focus:ring-white/50 text-center md:text-right w-full border-b-2 border-indigo-500/50"
        v-model="state.sourceAmount"
        aria-label="Amount to bridge"
      />
      <button
        v-if="store.state.sourceAddress"
        type="button"
        @click="setMax"
        @keydown.enter="setMax"
        @keydown.space.prevent="setMax"
        class="mt-2 ml-2 text-xl bg-clip-text bg-gradient-to-r text-transparent from-white to-primary ease-in-out duration-100 font-bold cursor-pointer select-none text-center md:text-right focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Set amount to maximum balance"
      >
        Max
      </button>
    </div>

    <div
      v-if="store.state.sourceAddress && store.state.sourceAddressBalance && store.state.sourceTokenConfiguration"
      class="text-white-0.6 my-1 text-center md:text-right md:justify-end w-full text-sm 3xl:text-xl 4xl:text-3xl"
      title="Click to refresh source balance"
      aria-live="polite"
      aria-atomic="true"
    >
      Balance: {{ viewAmount(store.state.sourceAddressBalance, store.state.sourceTokenConfiguration.decimals) }}
      {{ store.state.sourceTokenConfiguration.name }}
    </div>
  </div>
</template>
