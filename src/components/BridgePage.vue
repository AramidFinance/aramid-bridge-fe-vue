<script setup lang="ts">
import MainBox from './ui/MainBox.vue'
import ChainSelectionSource from './ChainSelectionSource.vue'
import AssetSelectionSource from './AssetSelectionSource.vue'
import AssetSelectionDestination from './AssetSelectionDestination.vue'
import WalletSource from './WalletSource.vue'
import WalletDestination from './WalletDestination.vue'
import AmountSource from './AmountSource.vue'
import SwitchButton from './SwitchButton.vue'
import ChainSelectionDestination from './ChainSelectionDestination.vue'
import AmountDestination from './AmountDestination.vue'
import MainActionButton from './ui/MainActionButton.vue'
import { onMounted, reactive, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useRouter, useRoute } from 'vue-router'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { resetDestinationChainIfNotMatched } from '@/scripts/events/resetDestinationChainIfNotMatched'
import { fillDestinationChainConfiguration } from '@/scripts/events/fillDestinationChainConfiguration'
import { resetSourceTokenIfNotMatched } from '@/scripts/events/resetSourceTokenIfNotMatched'
import { fillSourceTokenConfiguration } from '@/scripts/events/fillSourceTokenConfiguration'
import SimpleLabel from './ui/SimpleLabel.vue'
import base64url from 'base64url'
import { useToast } from 'primevue/usetoast'
import { makeNoteField } from '@/scripts/aramid/makeNoteField'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import Message from 'primevue/message'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import getWeb3Modal from '@/scripts/eth/getWeb3Modal'
import algosdk from 'algosdk'
import { resetStateSoft } from '@/scripts/common/resetStateSoft'
import calculateFeeAndDestinationAmount from '@/scripts/common/calculateFeeAndDestinationAmount'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const store = useAppStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const state = reactive({
  mounted: false,
  error: ''
})
const fillInRoute = () => {
  if (!state.mounted) return
  if (store.state.lockRouteForSwitch) {
    store.state.lockRouteForSwitch = false
    return
  }
  let route, params
  if (
    store.state.sourceChainConfiguration &&
    store.state.destinationChainConfiguration &&
    store.state.sourceTokenConfiguration &&
    store.state.destinationTokenConfiguration &&
    store.state.sourceAddress &&
    store.state.destinationAddress &&
    store.state.sourceAmount
  ) {
    route = 'bridge-sc-dc-st-dt-sa-da-a-n'
    params = {
      sourceChain: store.state.sourceChainConfiguration.name,
      destinationChain: store.state.destinationChainConfiguration.name,
      sourceToken: store.state.sourceTokenConfiguration.name,
      destinationToken: store.state.destinationTokenConfiguration.name,
      sourceAddress: store.state.sourceAddress,
      destinationAddress: store.state.destinationAddress,
      sourceAmount: store.state.sourceAmount,
      note: base64url(store.state.memo ? store.state.memo : 'aramid')
    }
  } else if (
    store.state.sourceChainConfiguration &&
    store.state.destinationChainConfiguration &&
    store.state.sourceTokenConfiguration &&
    store.state.destinationTokenConfiguration &&
    store.state.sourceAmount
  ) {
    route = 'bridge-sc-dc-st-dt-a-n'
    params = {
      sourceChain: store.state.sourceChainConfiguration.name,
      destinationChain: store.state.destinationChainConfiguration.name,
      sourceToken: store.state.sourceTokenConfiguration.name,
      destinationToken: store.state.destinationTokenConfiguration.name,
      sourceAmount: store.state.sourceAmount,
      note: base64url(store.state.memo ? store.state.memo : 'aramid')
    }
  } else if (store.state.sourceChainConfiguration && store.state.destinationChainConfiguration && store.state.sourceTokenConfiguration && store.state.destinationTokenConfiguration) {
    route = 'bridge-sc-dc-st-dt'
    params = {
      sourceChain: store.state.sourceChainConfiguration.name,
      destinationChain: store.state.destinationChainConfiguration.name,
      sourceToken: store.state.sourceTokenConfiguration.name,
      destinationToken: store.state.destinationTokenConfiguration.name
    }
  }
  if (route) {
    // console.log('debug route', {
    //   route: route,
    //   params: params
    // })
    router.push({
      name: route,
      params: params
    })
  }
}

const doValidation = (): boolean => {
  // called when the review button is pressed, right after confirmNetworksAndDestinationAddress
  try {
    if (store.state.loadingDestinationAddressBalance) {
      throw Error(t('error.loadingBalance', { type: t('address.destination').toLowerCase() }))
    }
    if (store.state.loadingSourceAddressBalance) {
      throw Error(t('error.loadingBalance', { type: t('address.origin').toLowerCase() }))
    }
    if (store.state.loadingDestinationEscrowAddressBalance) {
      throw Error(t('error.loadingEscrowBalance'))
    }

    if (store.state.sourceChainConfiguration?.type == 'algo') {
      if (!algosdk.isValidAddress(store.state.sourceAddress ?? '')) {
        throw Error(t('address.invalidOrigin'))
      }
    }
    if (store.state.sourceChainConfiguration?.type == 'eth') {
      if (!ethers.isAddress(store.state.sourceAddress)) {
        throw Error(t('address.invalidOrigin'))
      }
    }

    if (store.state.destinationChainConfiguration?.type == 'algo') {
      if (!algosdk.isValidAddress(store.state.destinationAddress ?? '')) {
        throw Error(t('address.invalidDestination'))
      }
    }
    if (store.state.destinationChainConfiguration?.type == 'eth') {
      if (!ethers.isAddress(store.state.destinationAddress)) {
        throw Error(t('address.invalidDestination'))
      }
    }

    if (!store.state.sourceAddress) {
      throw Error(t('bridge.selectOriginAddress'))
    } else if (
      store.state.sourceChainConfiguration?.type == 'algo' &&
      store.state.sourceAlgoConnectorType !== AlgoConnectorType.QRCode &&
      store.state.sourceAlgoConnectorType !== AlgoConnectorType.UseWallet
    ) {
      console.log('store.state.sourceAlgoConnectorType', store.state.sourceAlgoConnectorType)
      throw Error(t('bridge.selectSignMethod'))
    } else if (!store.state.destinationAddress) {
      throw Error(t('bridge.selectDestinationAddress'))
    } else if (!store.state.sourceToken) {
      throw Error(t('bridge.selectSourceAsset'))
    } else if (!store.state.destinationToken) {
      throw Error(t('bridge.selectDestinationAsset'))
    } else if (new BigNumber(store.state.sourceAmount).lte(0) || store.state.sourceAmount === 'NaN') {
      throw Error(t('bridge.amountZero'))
    } else if (!store.state.sourceAddressBalance || new BigNumber(store.state.sourceAmount).gt(new BigNumber(store.state.sourceAddressBalance))) {
      throw Error(t('bridge.amountGreaterThanBalance'))
    } else if (!store.state.sourceTokenConfiguration) {
      throw Error(t('error.sourceConfigurationMissing'))
    } else if (!store.state.destinationTokenConfiguration) {
      throw Error(t('error.configurationMissing'))
    }
    // For some reason this fails in dev mode, but not in prod
    else if (!store.state.escrowBalanceIsSufficient) {
      throw Error(t('bridge.insufficientLiquidity'))
    } else if (!store.state.destinationBridgeBalance || !store.state.destinationAmount || new BigNumber(store.state.destinationBridgeBalance).lt(new BigNumber(store.state.destinationAmount))) {
      throw Error(t('bridge.amountGreaterThanBridge'))
    }
    const memoWhiteList = /^[\p{L}\p{N}\s.,\-_/@*+$%]*$/u
    if (store.state.memo && !store.state.memo.match(memoWhiteList)) {
      throw Error(t('bridge.invalidMemo'))
    }
    // else if (disabled && store.state.destinationChainConfiguration && store.state.destinationChainConfiguration.type == 'near') {
    //   throw Error('Please Pay token storage fee to continue.')
    // }

    if (
      store.state.routeConfig &&
      store.state.routeConfig.feeAlternatives &&
      store.state.routeConfig.feeAlternatives[0] &&
      new BigNumber(store.state.sourceAmount).minus(store.state.feeAmount).lt(store.state.routeConfig.feeAlternatives[0].minimumAmount)
    ) {
      throw Error(t('amount.afterFees', { amount: Number(ethers.formatUnits(store.state.routeConfig.feeAlternatives[0].minimumAmount, store.state.sourceTokenConfiguration.decimals)).toFixed(8) }))
    }
    if (
      store.state.routeConfig &&
      store.state.routeConfig.feeAlternatives &&
      store.state.routeConfig.feeAlternatives[0] &&
      new BigNumber(store.state.sourceAmount).gt(store.state.routeConfig.feeAlternatives[0].maximumAmount)
    ) {
      throw Error(t('amount.lessThan', { amount: Number(ethers.formatUnits(store.state.routeConfig.feeAlternatives[0].maximumAmount, store.state.sourceTokenConfiguration.decimals)).toFixed(2) }))
    }

    if (Math.abs(Number(store.state.sourceAmountFormatted) - Number(store.state.feeAmountFormatted) - Number(store.state.destinationAmountFormatted)) > 0.001) {
      throw Error(
        t('amount.incompatible', {
          sourceAmount: store.state.sourceAmountFormatted,
          feeAmount: store.state.feeAmountFormatted,
          destinationAmount: store.state.destinationAmountFormatted
        })
      )
    }

    return true
  } catch (e: any) {
    console.error(e)
    state.error = e.message ?? e
    toast.add({
      severity: 'error',
      detail: state.error,
      life: 3000
    })
    return false
  }
}

const reviewButtonClick = () => {
  if (!doValidation()) return
  let optedIn = true
  if (store.state.destinationChainConfiguration?.type == 'algo' && !store.state.destinationAccountOptedIn && store.state.destinationToken != '0') {
    optedIn = false
  }
  if (
    store.state.sourceChainConfiguration &&
    store.state.destinationChainConfiguration &&
    store.state.sourceTokenConfiguration &&
    store.state.destinationTokenConfiguration &&
    store.state.sourceAddress &&
    store.state.destinationAddress &&
    store.state.sourceAmount
  ) {
    router.push({
      name: optedIn ? 'review-sc-dc-st-dt-sa-da-a-n' : 'optin-sc-dc-st-dt-sa-da-a-n',
      params: {
        sourceChain: store.state.sourceChainConfiguration.name,
        destinationChain: store.state.destinationChainConfiguration.name,
        sourceToken: store.state.sourceTokenConfiguration.name,
        destinationToken: store.state.destinationTokenConfiguration.name,
        sourceAddress: store.state.sourceAddress,
        destinationAddress: store.state.destinationAddress,
        sourceAmount: store.state.sourceAmount,
        note: base64url(store.state.memo ? store.state.memo : 'aramid')
      }
    })
  }
}

const fillInConfigFromRoute = () => {
  if (!store.state.publicConfiguration) return
  const sourceChain = route.params['sourceChain'] as string
  const destinationChain = route.params['destinationChain'] as string
  const sourceToken = route.params['sourceToken'] as string
  const destinationToken = route.params['destinationToken'] as string
  if (sourceChain) {
    store.state.sourceChainConfiguration = Object.values(store.state.publicConfiguration.chains).find((chain) => chain.name === sourceChain)
    if (!store.state.sourceChainConfiguration) return
    store.state.sourceChain = store.state.sourceChainConfiguration.chainId
  }
  if (destinationChain) {
    store.state.destinationChainConfiguration = Object.values(store.state.publicConfiguration.chains).find((chain) => chain.name === destinationChain)
    if (!store.state.destinationChainConfiguration) return
    store.state.destinationChain = store.state.destinationChainConfiguration.chainId
  }
  if (sourceToken && store.state.sourceChainConfiguration) {
    store.state.sourceTokenConfiguration = Object.values(store.state.sourceChainConfiguration.tokens).find((token) => token.name === sourceToken)
    if (!store.state.sourceTokenConfiguration) return
    store.state.sourceToken = store.state.sourceTokenConfiguration.tokenId
  }
  if (destinationToken && store.state.destinationChainConfiguration) {
    store.state.destinationTokenConfiguration = Object.values(store.state.destinationChainConfiguration.tokens).find((token) => token.name === destinationToken)
    if (!store.state.destinationTokenConfiguration) return
    store.state.destinationToken = store.state.destinationTokenConfiguration.tokenId
  }
  //console.log('state after fillInConfigFromRoute', store.state)
}

onMounted(async () => {
  await getPublicConfiguration(false)
  fillInConfigFromRoute()
  //console.log('store.state.publicConfiguration', store.state.publicConfiguration)
  resetDestinationChainIfNotMatched()
  if (!store.state.destinationChain) fillDestinationChainConfiguration()
  resetSourceTokenIfNotMatched()
  if (!store.state.sourceToken) fillSourceTokenConfiguration()
  if (route.params['sourceAmount']) {
    store.state.sourceAmount = route.params['sourceAmount'] as string
    calculateFeeAndDestinationAmount()
  }
  if (route.params['note']) {
    try {
      const parsedMemo = base64url.decode(route.params['note'] as string)
      //console.log('parsedMemo', parsedMemo)
      store.state.memo = parsedMemo
    } catch (e: any) {
      console.error(e)
      toast.add({
        severity: 'error',
        detail: e.message ?? e,
        life: 3000
      })
    }
  }
  resetStateSoft()
  state.mounted = true
  fillInRoute()

  //const modal = getWeb3Modal()
  //console.log('modal', modal)

  if (store.state.memo == 'aramid') store.state.memo = ''
})

watch(
  () => store.state.destinationTokenConfiguration,
  () => {
    fillInRoute()
  }
)
// watch(
//   () => store.state.sourceAmount,
//   () => {
//     fillInRoute()
//   }
// )
watch(
  () => store.state.memo,
  () => {
    fillInRoute()
    makeNoteField()
  }
)
watch(
  () => store.state.destinationAddress,
  () => {
    fillInRoute()
    state.error = ''
  }
)
</script>
<template>
  <MainBox>
    <div class="flex flex-row w-full">
      <div class="text-left font-extrabold text-xl w-full grow flex-1 hidden md:block">
        {{ t('bridge.title') }} <span class="text-[#FB7EFF]">{{ t('bridge.titleCrossChain') }}</span>
      </div>
      <img src="../assets/images/aramid-logo.svg" alt="Aramid" width="150" class="align-right text-right self-right" />
    </div>
    <div class="flex flex-col md:flex-row w-full gap-2">
      <ChainSelectionSource></ChainSelectionSource>
      <AssetSelectionSource></AssetSelectionSource>
      <WalletSource></WalletSource>
      <AmountSource></AmountSource>
    </div>
    <div class="w-full"><SwitchButton></SwitchButton></div>
    <div class="flex flex-col md:flex-row w-full gap-2">
      <ChainSelectionDestination></ChainSelectionDestination>
      <AssetSelectionDestination></AssetSelectionDestination>
      <WalletDestination></WalletDestination>
      <AmountDestination></AmountDestination>
    </div>
    <div class="mt-4 w-full">
      <SimpleLabel>{{ t('transaction.memo') }}</SimpleLabel>
      <input :maxlength="50" class="bg-white-rgba rounded-[10px] focus:outline-none w-full mt-1 3xl:mt-3 4xl:mt-6 p-1 3xl:p-3 4xl:p-6 text-base w-full" type="text" v-model="store.state.memo" />
    </div>
    <Message severity="error" v-if="state.error" class="mt-4 w-full">{{ state.error }}</Message>
    <Message severity="warn" v-if="store.state.escrowBalanceIsSufficient && !store.state.escrowBalanceIsSufficient10x" class="mt-4 w-full">
      {{ t('bridge.lowBalanceWarning') }}
    </Message>
    <MainActionButton @click="reviewButtonClick">{{ t('bridge.reviewTransaction') }}</MainActionButton>
  </MainBox>
</template>
