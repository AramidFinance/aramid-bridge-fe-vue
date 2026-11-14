<script setup lang="ts">
import { makeNoteField } from '@/scripts/aramid/makeNoteField'
import calculateFeeAndDestinationAmount from '@/scripts/common/calculateFeeAndDestinationAmount'
import formatBaseAmount from '@/scripts/common/formatBaseAmount'
import { formatTooltip } from '@/scripts/common/formatTooltip'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { viewAmount } from '@/scripts/common/viewAmount'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import { fromBaseUnits, rescaleBaseUnits, toBaseUnits } from '@/scripts/common/baseUnits'
import { showError } from '@/scripts/common/showError'
import BigNumber from 'bignumber.js'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import getAlgoAccountARC200TokenBalance from '../scripts/algo/getAlgoAccountARC200TokenBalance'
import getAlgoAccountTokenBalance from '../scripts/algo/getAlgoAccountTokenBalance'
import SimpleLabel from './ui/SimpleLabel.vue'
const { t } = useI18n()
const toast = useToast()
const store = useAppStore()
const route = useRoute()

interface IState {
  publicConfiguration: PublicConfigurationRoot | null
  chain: ChainItem
}
const state: IState = reactive({
  publicConfiguration: null,
  chain: store.state.arc200BridgeChainConfiguration as ChainItem
})

// An amount typed while no token is selected: its base units are unknown until a token is picked.
const pendingAmount = ref<number | ''>('')

/** The amount input: a view of the store's base-unit amount in the selected token's decimals. */
const amountInput = computed<number | ''>({
  get: () => {
    const config = store.state.arc200BridgeTokenConfiguration
    if (!config) return pendingAmount.value
    const value = fromBaseUnits(store.state.arc200BridgeAmount, config.decimals)
    return Number.isNaN(value) ? '' : value
  },
  set: (value) => {
    const config = store.state.arc200BridgeTokenConfiguration
    if (!config) {
      pendingAmount.value = value
      return
    }
    // '' for an empty or invalid input
    store.state.arc200BridgeAmount = toBaseUnits(value, config.decimals)
  }
})

onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  await fillInState()
})
// token/address can change while balance requests are in flight: only the latest call writes balances
let balanceRequestId = 0
const fillInState = async () => {
  const requestId = ++balanceRequestId
  // balances of the previous token/address must not be shown or used by Max meanwhile
  store.state.arc200BridgeAddressARC200Balance = undefined
  store.state.arc200BridgeAddressASABalance = undefined
  try {
    if (!state.publicConfiguration) return
    if (!store.state.arc200BridgeTokenConfiguration) return
    if (!store.state.arc200BridgeToken) return
    const arc200Token = store.state.arc200BridgeTokenConfiguration.arc200TokenId ?? store.state.arc200BridgeTokenConfiguration.optionalArc200TokenId
    if (!arc200Token) return

    if (!store.state.arc200BridgeAddress) return
    if (!store.state.arc200BridgeChain) return
    const [balanceArc200, balanceASA] = await Promise.all([
      getAlgoAccountARC200TokenBalance(store.state.arc200BridgeChain, store.state.arc200BridgeAddress, arc200Token),
      getAlgoAccountTokenBalance(store.state.arc200BridgeChain, store.state.arc200BridgeAddress, BigInt(store.state.arc200BridgeToken))
    ])
    if (requestId !== balanceRequestId) return
    store.state.arc200BridgeAddressARC200Balance = balanceArc200?.toString() || '0'
    store.state.arc200BridgeAddressASABalance = balanceASA?.toString() || '0'
  } catch (e: any) {
    if (requestId === balanceRequestId) showError(toast, e)
  }
}

watch(
  [() => store.state.arc200BridgeAmount, () => store.state.arc200BridgeTokenConfiguration],
  ([amount, config]) => {
    store.state.arc200BridgeAmountFormatted = amount && config ? formatBaseAmount(amount, config.decimals) : ''
  },
  { immediate: true }
)
// A token change keeps the amount the user sees, converted once to the new token's base units. It runs
// synchronously, so an amount the page writes from the route right after selecting a token wins.
watch(
  () => store.state.arc200BridgeTokenConfiguration,
  async (config, previous) => {
    if (config && previous) {
      if (store.state.arc200BridgeAmount && config.decimals !== previous.decimals) {
        store.state.arc200BridgeAmount = rescaleBaseUnits(store.state.arc200BridgeAmount, previous.decimals, config.decimals)
      }
    } else if (config) {
      // the first token after none: apply the amount typed meanwhile (an amount left in unknown units is dropped)
      store.state.arc200BridgeAmount = toBaseUnits(pendingAmount.value, config.decimals)
      pendingAmount.value = ''
    } else if (previous) {
      // the token was dropped: keep showing the amount until the next token is picked
      const shown = fromBaseUnits(store.state.arc200BridgeAmount, previous.decimals)
      pendingAmount.value = Number.isNaN(shown) ? '' : shown
      store.state.arc200BridgeAmount = ''
    }
    await fillInState()
  },
  { flush: 'sync' }
)
watch(
  () => store.state.arc200BridgeAddress,
  async () => {
    await fillInState()
  }
)
watch(
  () => route.params?.sourceAmount,
  async () => {
    await fillInState()
  }
)

const setMax = () => {
  if (!store.state.arc200BridgeTokenConfiguration) return
  // balances are being (re)loaded: there is no maximum yet
  const balance = store.state.arc200BridgeDirection === 'ASAToARC200' ? store.state.arc200BridgeAddressASABalance : store.state.arc200BridgeAddressARC200Balance
  if (balance === undefined) return
  if (store.state.arc200BridgeDirection === 'ASAToARC200') {
    if (store.state.arc200BridgeToken === '0') {
      // on AVM make sure we deduct the tx fee
      store.state.arc200BridgeAmount = new BigNumber(store.state.arc200BridgeAddressASABalance ?? '101000').minus(101000).toFixed(0, 1)
    } else {
      store.state.arc200BridgeAmount = store.state.arc200BridgeAddressASABalance || '0'
    }
  } else {
    store.state.arc200BridgeAmount = store.state.arc200BridgeAddressARC200Balance || '0'
  }

  calculateFeeAndDestinationAmount()
  makeNoteField()
}
</script>
<template>
  <div class="flex flex-col w-full items-center">
    <div class="flex flex-col w-full gap-2">
      <SimpleLabel class="justify-center"> {{ t('amount.toBridge') }} </SimpleLabel>
      <div class="flex flex-col justify-center">
        <input
          v-tooltip.focus.top="formatTooltip(t('amount.tooltipBridge'))"
          type="number"
          min="0"
          placeholder="0.0"
          max="1000000000"
          step="0.00001"
          class="bg-transparent placeholder-current text-2xl font-bold rounded-[2px] focus:outline-none text-center w-full border-b-2 border-indigo-500/50"
          v-model="amountInput"
        />
        <div
          v-if="store.state.arc200BridgeAddress"
          @click="setMax"
          class="mt-2 ml-2 text-xl bg-clip-text bg-gradient-to-r text-transparent from-white to-[#E469FF] ease-in-out duration-100 font-bold cursor-pointer select-none text-center"
        >
          Max
        </div>
      </div>

      <div
        v-if="store.state.arc200BridgeAddress && (store.state.arc200BridgeAddressASABalance || store.state.arc200BridgeAddressARC200Balance) && store.state.arc200BridgeTokenConfiguration"
        class="text-white-0.6 my-1 text-center w-full text-sm 3xl:text-xl 4xl:text-3xl"
        title="Click to refresh source balance"
      >
        <div v-if="store.state.arc200BridgeDirection == 'ASAToARC200'">
          <div v-if="store.state.arc200BridgeAddressASABalance">
            ASA Balance: {{ viewAmount(store.state.arc200BridgeAddressASABalance, store.state.arc200BridgeTokenConfiguration.decimals) }}
            {{ store.state.arc200BridgeTokenConfiguration.name }}
          </div>
          <div v-if="store.state.arc200BridgeAddressARC200Balance">
            ARC200 Balance: {{ viewAmount(store.state.arc200BridgeAddressARC200Balance, store.state.arc200BridgeTokenConfiguration.decimals) }}
            {{ store.state.arc200BridgeTokenConfiguration.name }}
          </div>
        </div>
        <div v-else>
          <div v-if="store.state.arc200BridgeAddressARC200Balance">
            ARC200 Balance: {{ viewAmount(store.state.arc200BridgeAddressARC200Balance, store.state.arc200BridgeTokenConfiguration.decimals) }}
            {{ store.state.arc200BridgeTokenConfiguration.name }}
          </div>
          <div v-if="store.state.arc200BridgeAddressASABalance">
            ASA Balance: {{ viewAmount(store.state.arc200BridgeAddressASABalance, store.state.arc200BridgeTokenConfiguration.decimals) }}
            {{ store.state.arc200BridgeTokenConfiguration.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
