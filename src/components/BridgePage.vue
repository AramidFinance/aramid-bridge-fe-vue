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
      name: 'bridge-sc-dc-st-dt-sa-da-a-n',
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
  } else if (
    store.state.sourceChainConfiguration &&
    store.state.destinationChainConfiguration &&
    store.state.sourceTokenConfiguration &&
    store.state.destinationTokenConfiguration &&
    store.state.sourceAmount
  ) {
    router.push({
      name: 'bridge-sc-dc-st-dt-a-n',
      params: {
        sourceChain: store.state.sourceChainConfiguration.name,
        destinationChain: store.state.destinationChainConfiguration.name,
        sourceToken: store.state.sourceTokenConfiguration.name,
        destinationToken: store.state.destinationTokenConfiguration.name,
        sourceAmount: store.state.sourceAmount,
        note: base64url(store.state.memo ? store.state.memo : 'aramid')
      }
    })
  } else if (store.state.sourceChainConfiguration && store.state.destinationChainConfiguration && store.state.sourceTokenConfiguration && store.state.destinationTokenConfiguration) {
    router.push({
      name: 'bridge-sc-dc-st-dt',
      params: {
        sourceChain: store.state.sourceChainConfiguration.name,
        destinationChain: store.state.destinationChainConfiguration.name,
        sourceToken: store.state.sourceTokenConfiguration.name,
        destinationToken: store.state.destinationTokenConfiguration.name
      }
    })
  }
}

const doValidation = (): boolean => {
  // called when the review button is pressed, right after confirmNetworksAndDestinationAddress
  try {
    if (store.state.loadingDestinationAddressBalance) {
      throw Error('Loading the balance of the destination address, please try again later')
    }
    if (store.state.loadingSourceAddressBalance) {
      throw Error('Loading the balance of the origin address, please try again later')
    }
    if (store.state.loadingDestinationEscrowAddressBalance) {
      throw Error('Loading the balance of the destination escrow address, please try again later')
    }

    if (store.state.sourceChainConfiguration?.type == 'algo') {
      if (!algosdk.isValidAddress(store.state.sourceAddress ?? '')) {
        throw Error('Origin address is in invalid format')
      }
    }
    if (store.state.sourceChainConfiguration?.type == 'eth') {
      if (!ethers.isAddress(store.state.sourceAddress)) {
        throw Error('Origin address is in invalid format')
      }
    }

    if (store.state.destinationChainConfiguration?.type == 'algo') {
      if (!algosdk.isValidAddress(store.state.destinationAddress ?? '')) {
        throw Error('Destination address is in invalid format')
      }
    }
    if (store.state.destinationChainConfiguration?.type == 'eth') {
      if (!ethers.isAddress(store.state.destinationAddress)) {
        throw Error('Destination address is in invalid format')
      }
    }

    if (!store.state.sourceAddress) {
      throw Error('Please select the address from which you will bridge the assets by connecting source chain wallet')
    } else if (
      store.state.sourceChainConfiguration?.type == 'algo' &&
      store.state.sourceAlgoConnectorType !== AlgoConnectorType.QRCode &&
      store.state.sourceAlgoConnectorType !== AlgoConnectorType.UseWallet
    ) {
      console.log('store.state.sourceAlgoConnectorType', store.state.sourceAlgoConnectorType)
      throw Error('Please select if you want to sign the AVM tx using the QR code or wallet connector')
    } else if (!store.state.destinationAddress) {
      throw Error('Please select the address where you want to send the assets')
    } else if (!store.state.sourceToken) {
      throw Error('A source asset must be selected before continuing.')
    } else if (!store.state.destinationToken) {
      throw Error('A destination asset must be selected before continuing.')
    } else if (new BigNumber(store.state.sourceAmount).lte(0) || store.state.sourceAmount === 'NaN') {
      throw Error('Amount entered is near or equal to zero.')
    } else if (!store.state.sourceAddressBalance || new BigNumber(store.state.sourceAmount).gt(new BigNumber(store.state.sourceAddressBalance))) {
      throw Error('Amount requested to bridge is greater than your account balance.')
    } else if (!store.state.sourceTokenConfiguration) {
      throw Error('sourceTokenConfiguration is empty.')
    } else if (!store.state.destinationTokenConfiguration) {
      throw Error('destinationTokenConfiguration is empty.')
    } else if (!store.state.escrowBalanceIsSufficient) {
      throw Error('Insufficient liquidity to fulfill bridge request, please try again later.')
    } else if (
      !store.state.destinationBridgeBalance ||
      !store.state.destinationAddressBalance ||
      new BigNumber(store.state.destinationBridgeBalance).lt(new BigNumber(store.state.destinationAddressBalance))
    ) {
      throw Error('Amount requested to bridge is greater than destination bridge account balance.')
    }
    const memoWhiteList = /^[\p{L}\p{N}\s\.,\-_\/@\*\+\$%]*$/u
    if (store.state.memo && !store.state.memo.match(memoWhiteList)) {
      throw Error('Memo contains invalid characters. Please use alphanumerical characters only please.')
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
      throw Error(
        `Source asset amount after fees are substracted should be at least ${Number(ethers.formatUnits(store.state.routeConfig.feeAlternatives[0].minimumAmount, store.state.sourceTokenConfiguration.decimals)).toFixed(2)}.`
      )
    }
    if (
      store.state.routeConfig &&
      store.state.routeConfig.feeAlternatives &&
      store.state.routeConfig.feeAlternatives[0] &&
      new BigNumber(store.state.sourceAmount).gt(store.state.routeConfig.feeAlternatives[0].maximumAmount)
    ) {
      throw Error(
        `Source Asset amount should be less than ${Number(ethers.formatUnits(store.state.routeConfig.feeAlternatives[0].maximumAmount, store.state.sourceTokenConfiguration.decimals)).toFixed(2)}.`
      )
    }

    if (Math.abs(Number(store.state.sourceAmountFormatted) - Number(store.state.feeAmountFormatted) - Number(store.state.destinationAmountFormatted)) > 0.001) {
      throw Error(
        `Source and Destination Amount (${store.state.sourceAmountFormatted} - ${store.state.feeAmountFormatted}, ${store.state.destinationAmountFormatted}) are not compatible, Please re-enter the Amount.`
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

onMounted(async () => {
  await getPublicConfiguration(false)
  console.log('store.state.publicConfiguration', store.state.publicConfiguration)
  resetDestinationChainIfNotMatched()
  if (!store.state.destinationChain) fillDestinationChainConfiguration()
  resetSourceTokenIfNotMatched()
  if (!store.state.sourceToken) fillSourceTokenConfiguration()
  if (route.params['sourceAmount']) {
    store.state.sourceAmount = route.params['sourceAmount'] as string
  }
  if (route.params['note']) {
    try {
      const parsedMemo = base64url.decode(route.params['note'] as string)
      console.log('parsedMemo', parsedMemo)
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

  const modal = getWeb3Modal()
  console.log('modal', modal)

  if (store.state.memo == 'aramid') store.state.memo = ''
})

watch(
  () => store.state.destinationTokenConfiguration,
  () => {
    fillInRoute()
  }
)
watch(
  () => store.state.sourceAmount,
  () => {
    fillInRoute()
  }
)
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
      <div class="text-left font-extrabold text-xl w-full grow flex-1 hidden md:block">Bridge your assets <span class="text-[#FB7EFF]">cross-chain</span></div>
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
      <SimpleLabel>Cross-chain Note/Memo/Payment reference</SimpleLabel>
      <input :maxlength="50" class="bg-white-rgba rounded-[10px] focus:outline-none w-full mt-1 3xl:mt-3 4xl:mt-6 p-1 3xl:p-3 4xl:p-6 text-base w-full" type="text" v-model="store.state.memo" />
    </div>
    <Message severity="error" v-if="state.error" class="mt-4 w-full">{{ state.error }}</Message>
    <Message severity="warn" v-if="store.state.escrowBalanceIsSufficient && !store.state.escrowBalanceIsSufficient10x" class="mt-4 w-full">
      The bridge balance has less than 10x your transfer amount and your request may potentially not be fulfilled.
    </Message>
    <MainActionButton @click="reviewButtonClick">Review your transaction</MainActionButton>
  </MainBox>
</template>
