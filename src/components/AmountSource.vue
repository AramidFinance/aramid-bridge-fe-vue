<script setup lang="ts">
import { showError } from '@/scripts/common/showError'
import { routeSourceAmount } from '@/scripts/common/routeSourceAmount'
import { makeNoteField } from '@/scripts/aramid/makeNoteField'
import calculateFeeAndDestinationAmount from '@/scripts/common/calculateFeeAndDestinationAmount'
import formatBaseAmount from '@/scripts/common/formatBaseAmount'
import { formatTooltip } from '@/scripts/common/formatTooltip'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { viewAmount } from '@/scripts/common/viewAmount'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import { fromBaseUnits, isBaseUnits, isPositiveBaseUnits, toBaseUnits } from '@/scripts/common/baseUnits'
import BigNumber from 'bignumber.js'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import SimpleLabel from './ui/SimpleLabel.vue'

const { t } = useI18n()
const toast = useToast()
const store = useAppStore()
const route = useRoute()

interface IState {
  publicConfiguration: PublicConfigurationRoot | null
  sourceAmount: number
}
const state: IState = reactive({
  publicConfiguration: null,
  chain: store.state.sourceChainConfiguration as ChainItem,
  // the input shows the store's amount (e.g. when returning to the page without an amount in the URL)
  sourceAmount: store.state.sourceTokenConfiguration && store.state.sourceAmount ? fromBaseUnits(store.state.sourceAmount, store.state.sourceTokenConfiguration.decimals) || 0 : 0
})

onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  fillInState()
})
// the URL amount last applied (chain/token/amount): a URL amount is applied once, so re-selecting the
// URL's token later does not overwrite an amount typed since
let appliedRouteAmount: string | undefined
const fillInState = () => {
  try {
    if (!state.publicConfiguration) return
    if (!store.state.sourceTokenConfiguration) return
    // the route's amount is in base units of the route's token: apply it only while that token is selected
    const amountFromRoute = routeSourceAmount(route, store.state.sourceTokenConfiguration.name, store.state.sourceChainConfiguration?.name)
    const routeKey = `${route.params['sourceChain']}/${route.params['sourceToken']}/${amountFromRoute}`
    if (amountFromRoute && routeKey !== appliedRouteAmount) {
      appliedRouteAmount = routeKey
      // the input and the formatted amount follow the store (watcher below); fee, destination amount and
      // note follow it too (AmountDestination's sourceAmount watcher, and the token watcher below)
      store.state.sourceAmount = amountFromRoute
    }
  } catch (e: any) {
    showError(toast, e)
  }
}

const setAmount = () => {
  if (!store.state.sourceTokenConfiguration) return

  // '' for an empty or invalid input
  const base = toBaseUnits(state.sourceAmount, store.state.sourceTokenConfiguration.decimals)
  store.state.sourceAmount = base
  store.state.sourceAmountFormatted = base ? formatBaseAmount(base, store.state.sourceTokenConfiguration.decimals) : ''
  // more fraction digits than the token has were cut off: show what will be bridged
  const shown = fromBaseUnits(base, store.state.sourceTokenConfiguration.decimals)
  if (base && !Number.isNaN(shown) && shown !== state.sourceAmount) state.sourceAmount = shown
  //console.log('store.state.sourceAmount', store.state.sourceAmount)
  calculateFeeAndDestinationAmount()
  makeNoteField()
}

watch(
  () => state.sourceAmount,
  (value) => {
    const config = store.state.sourceTokenConfiguration
    // the input shows the store amount already (e.g. Max or the route set it): writing the displayed
    // float back could round an exact base-unit amount
    // (a non-canonical store amount, e.g. '5000000.0' from a link, is still rewritten)
    if (config && isBaseUnits(store.state.sourceAmount) && fromBaseUnits(store.state.sourceAmount, config.decimals) === value) return
    setAmount()
  }
)
// The store amount or its token can change outside the input (token picker, swap, Max, a chain change
// selecting another token): the input and the formatted amount always show the store's base units in the
// selected token's decimals.
watch([() => store.state.sourceAmount, () => store.state.sourceTokenConfiguration], ([amount, config], [, previousConfig]) => {
  if (config && config !== previousConfig) {
    // an amount typed while no token was selected: store it now that its units are known
    // (the store default '0' counts as no amount)
    if (!previousConfig && !isPositiveBaseUnits(amount) && state.sourceAmount) {
      setAmount()
      return
    }
    // another token can have another fee tier and other decimals
    calculateFeeAndDestinationAmount()
    makeNoteField()
  }
  if (!config || !amount) return
  const shown = fromBaseUnits(amount, config.decimals)
  if (Number.isNaN(shown)) return
  store.state.sourceAmountFormatted = formatBaseAmount(amount, config.decimals)
  if (shown !== state.sourceAmount) state.sourceAmount = shown
})
// one watcher for what makes a URL amount applicable (no re-apply on an address change: wallet sync
// changes the address on its own)
watch([() => store.state.sourceTokenConfiguration, () => route.params?.sourceAmount], () => fillInState())
const setMax = () => {
  if (!store.state.sourceAddressBalance) return
  if (!store.state.sourceTokenConfiguration) return

  store.state.sourceAmount = store.state.sourceAddressBalance
  if (store.state.sourceToken === '0') {
    // on AVM make sure we deduct the tx fee
    store.state.sourceAmount = BigNumber.max(0, new BigNumber(store.state.sourceAddressBalance).minus(101000)).toFixed(0, 1)
  }
  // the input and the formatted amount follow the store (watcher above)
  calculateFeeAndDestinationAmount()
  makeNoteField()
}
</script>
<template>
  <div class="flex flex-col w-full">
    <SimpleLabel class="justify-center md:justify-end lg:justify-end xl:justify-end md:text-right"> {{ t('amount.toBridge') }} </SimpleLabel>
    <div class="flex flex-col md:flex-row justify-center md:justify-end lg:justify-end xl:justify-end">
      <input
        v-tooltip.focus.top="formatTooltip(t('amount.tooltipBridge'))"
        type="number"
        min="0"
        placeholder="0.0"
        max="1000000000"
        step="0.00001"
        class="bg-transparent placeholder-current text-2xl font-bold rounded-[2px] focus:outline-none text-center md:text-right w-full border-b-2 border-indigo-500/50"
        v-model="state.sourceAmount"
      />
      <div
        v-if="store.state.sourceAddress"
        @click="setMax"
        class="mt-2 ml-2 text-xl bg-clip-text bg-gradient-to-r text-transparent from-white to-[#E469FF] ease-in-out duration-100 font-bold cursor-pointer select-none text-center md:text-right"
      >
        Max
      </div>
    </div>

    <div
      v-if="store.state.sourceAddress && store.state.sourceAddressBalance && store.state.sourceTokenConfiguration"
      class="text-white-0.6 my-1 text-center md:text-right md:justify-end w-full text-sm 3xl:text-xl 4xl:text-3xl"
      title="Click to refresh source balance"
    >
      Balance: {{ viewAmount(store.state.sourceAddressBalance, store.state.sourceTokenConfiguration.decimals) }}
      {{ store.state.sourceTokenConfiguration.name }}
    </div>
  </div>
</template>
