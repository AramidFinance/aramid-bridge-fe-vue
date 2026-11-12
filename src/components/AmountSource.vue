<script setup lang="ts">
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
import { fromBaseUnits, toBaseUnits } from '@/scripts/common/baseUnits'
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
    // the route's amount is in base units of the route's token: apply it only while that token is selected
    const amountFromRoute = routeSourceAmount(route, store.state.sourceTokenConfiguration.name, store.state.sourceChainConfiguration?.name)
    if (amountFromRoute) {
      store.state.sourceAmount = amountFromRoute
      store.state.sourceAmountFormatted = formatBaseAmount(store.state.sourceAmount, store.state.sourceTokenConfiguration.decimals)
      state.sourceAmount = fromBaseUnits(store.state.sourceAmount, store.state.sourceTokenConfiguration.decimals)
      //console.log('state.sourceAmount', new BigNumber(state.sourceAmount).toNumber(), state.sourceAmount)
      calculateFeeAndDestinationAmount()
      makeNoteField()
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

const setAmount = () => {
  if (!store.state.sourceTokenConfiguration) return

  // '' for an empty or invalid input
  const base = toBaseUnits(state.sourceAmount, store.state.sourceTokenConfiguration.decimals)
  store.state.sourceAmount = base
  store.state.sourceAmountFormatted = base ? formatBaseAmount(base, store.state.sourceTokenConfiguration.decimals) : ''
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
    if (config && store.state.sourceAmount && fromBaseUnits(store.state.sourceAmount, config.decimals) === value) return
    setAmount()
  }
)
// the store amount can change outside the input (token picker conversion, swap, Max): show it
watch(
  () => store.state.sourceAmount,
  (amount) => {
    const config = store.state.sourceTokenConfiguration
    if (!config || !amount) return
    const shown = fromBaseUnits(amount, config.decimals)
    if (!Number.isNaN(shown) && shown !== state.sourceAmount) state.sourceAmount = shown
  }
)
watch(
  () => store.state.sourceTokenConfiguration,
  () => {
    fillInState()
  }
)
watch(
  () => store.state.sourceAddress,
  () => {
    fillInState()
  }
)
watch(
  () => store.state.sourceToken,
  () => {
    fillInState()
  }
)
watch(
  () => route.params?.sourceAmount,
  () => {
    fillInState()
  }
)
const setMax = () => {
  if (!store.state.sourceAddressBalance) return
  if (!store.state.sourceTokenConfiguration) return

  store.state.sourceAmount = store.state.sourceAddressBalance
  if (store.state.sourceToken === '0') {
    // on AVM make sure we deduct the tx fee
    store.state.sourceAmount = new BigNumber(store.state.sourceAddressBalance).minus(101000).toFixed(0, 1)
  }
  store.state.sourceAmountFormatted = formatBaseAmount(store.state.sourceAmount, store.state.sourceTokenConfiguration.decimals)

  state.sourceAmount = fromBaseUnits(store.state.sourceAmount, store.state.sourceTokenConfiguration.decimals)
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
