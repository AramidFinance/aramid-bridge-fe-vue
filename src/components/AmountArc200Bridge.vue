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
import BigNumber from 'bignumber.js'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, watch } from 'vue'
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
  arc200BridgeAmount: number
}
const state: IState = reactive({
  publicConfiguration: null,
  chain: store.state.arc200BridgeChainConfiguration as ChainItem,
  arc200BridgeAmount: 0
})

onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  await fillInState()
})
const fillInState = async () => {
  try {
    if (!state.publicConfiguration) return
    if (!store.state.arc200BridgeTokenConfiguration) return
    if (!store.state.arc200BridgeToken) return
    const arc200Token = store.state.arc200BridgeTokenConfiguration.arc200TokenId ?? store.state.arc200BridgeTokenConfiguration.optionalArc200TokenId
    if (!arc200Token) return

    if (route && route.params && route.params['amount']) {
      store.state.arc200BridgeAmount = route.params['amount'] as string
      store.state.arc200BridgeAmountFormatted = formatBaseAmount(store.state.arc200BridgeAmount, store.state.arc200BridgeTokenConfiguration.decimals)
      state.arc200BridgeAmount = new BigNumber(store.state.arc200BridgeAmount).toNumber() / 10 ** store.state.arc200BridgeTokenConfiguration.decimals
      //console.log('state.arc200BridgeAmount', new BigNumber(state.arc200BridgeAmount).toNumber(), state.arc200BridgeAmount)
    }

    if (!store.state.arc200BridgeAddress) return
    if (!store.state.arc200BridgeChain) return
    const balanceArc200 = await getAlgoAccountARC200TokenBalance(store.state.arc200BridgeChain, store.state.arc200BridgeAddress, arc200Token)
    store.state.arc200BridgeAddressARC200Balance = balanceArc200?.toString() || '0'

    const balanceASA = await getAlgoAccountTokenBalance(store.state.arc200BridgeChain, store.state.arc200BridgeAddress, BigInt(store.state.arc200BridgeToken))
    store.state.arc200BridgeAddressASABalance = balanceASA?.toString() || '0'
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
  if (!store.state.arc200BridgeTokenConfiguration) return

  const base = new BigNumber(state.arc200BridgeAmount).multipliedBy(new BigNumber(10).pow(store.state.arc200BridgeTokenConfiguration.decimals)).toFixed(0, 1)
  store.state.arc200BridgeAmount = base
  store.state.arc200BridgeAmountFormatted = formatBaseAmount(base, store.state.arc200BridgeTokenConfiguration.decimals)
  //console.log('store.state.arc200BridgeAmount', store.state.arc200BridgeAmount)
}

watch(
  () => state.arc200BridgeAmount,
  () => {
    setAmount()
  }
)
watch(
  () => store.state.arc200BridgeTokenConfiguration,
  async () => {
    await fillInState()
  }
)
watch(
  () => store.state.arc200BridgeAddress,
  async () => {
    await fillInState()
  }
)
watch(
  () => store.state.arc200BridgeToken,
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

  store.state.arc200BridgeAmountFormatted = formatBaseAmount(store.state.arc200BridgeAmount, store.state.arc200BridgeTokenConfiguration.decimals)

  state.arc200BridgeAmount = new BigNumber(store.state.arc200BridgeAmount).toNumber() / 10 ** store.state.arc200BridgeTokenConfiguration.decimals
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
          v-model="state.arc200BridgeAmount"
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
