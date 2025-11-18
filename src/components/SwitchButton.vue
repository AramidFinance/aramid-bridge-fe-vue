<script setup lang="ts">
import calculateFeeAndDestinationAmount from '@/scripts/common/calculateFeeAndDestinationAmount'
import formatBaseAmount from '@/scripts/common/formatBaseAmount'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import { useAppStore } from '@/stores/app'
import { useWallet } from 'avm-wallet-vue'
import base64url from 'base64url'
import BigNumber from 'bignumber.js'
import { useRoute, useRouter } from 'vue-router'
const { activeAddress } = useWallet()
const store = useAppStore()
const route = useRoute()
const router = useRouter()

const fillInRoute = () => {
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

const switchClick = () => {
  store.state.lockRouteForSwitch = true
  const currSourceChain = store.state.sourceChain
  store.state.sourceChain = store.state.destinationChain
  store.state.destinationChain = currSourceChain

  const currSourceChainConfiguration = store.state.sourceChainConfiguration
  store.state.sourceChainConfiguration = store.state.destinationChainConfiguration
  store.state.destinationChainConfiguration = currSourceChainConfiguration

  //
  // TODO should only allow this if conditionally to prevent the user from switching to address not connect
  //      in case of clean
  //
  // const currSourceAddress = store.state.sourceAddress
  // store.state.sourceAddress = store.state.destinationAddress
  // store.state.destinationAddress = currSourceAddress
  store.state.sourceAddress = ''
  store.state.destinationAddress = ''

  if (store.state.destinationTokenConfiguration && store.state.sourceTokenConfiguration) {
    // Calculate the difference in decimals between destination and source tokens
    const decimalsDifference = store.state.destinationTokenConfiguration.decimals - store.state.sourceTokenConfiguration.decimals
    // Fee amount in source token decimals
    const feeAmountInSourceDecimals = store.state.feeAmount
    let newFeeAmount

    if (decimalsDifference > 0) {
      // Destination token has more decimals than source token
      // fe. source has 6 decimals, destination has 18 decimals
      // fe. 10^ (18 - 6 ) = 10^12 = 1_000_000_000_000
      const pow = new BigNumber(10).pow(decimalsDifference)

      // Convert fee to destination decimals
      newFeeAmount = new BigNumber(feeAmountInSourceDecimals).multipliedBy(pow).toFixed(0, 1)
    } else if (decimalsDifference < 0) {
      // Source token has more decimals than destination token
      const pow = new BigNumber(10).pow(-decimalsDifference)
      // Convert fee to destination decimals
      newFeeAmount = new BigNumber(feeAmountInSourceDecimals).dividedBy(pow).toFixed(0, 1)
    } else {
      // Both tokens have the same number of decimals, no conversion needed
      newFeeAmount = feeAmountInSourceDecimals
    }

    // Convert source net amount to destination decimals
    // fe. sourceAmountNet = 1_000_000, pow = 1_000_000_000_000
    // fe. newDestinationAmount = 1_000_000 * 1_000_000_000_000 = 1_000_000_000_000_000_000
    const newDestinationAmount = store.state.sourceAmountNet
    // Convert destination amount to source decimals
    // fe. destinationAmount = 1_000_000_000_000_000_000, pow = 1_000_000_000_000
    // fe. newSourceNetAmount = 1_000_000_000_000_000_000 / 1_000_000_000_000 = 1_000_000
    const newSourceNetAmount = store.state.destinationAmount
    const newGrossSourceAmount = new BigNumber(newSourceNetAmount).plus(newFeeAmount).toFixed(0, 0)
    const newGrossSourceAmountFormatted = formatBaseAmount(newGrossSourceAmount, store.state.sourceTokenConfiguration.decimals)
    const newDestinationAmountFormatted = formatBaseAmount(newDestinationAmount, store.state.destinationTokenConfiguration.decimals)
    const feeAmountFormatted = formatBaseAmount(feeAmountInSourceDecimals, store.state.sourceTokenConfiguration.decimals)
    console.log('debug swap', {
      decimalsDifference,
      sourceAmountNet: store.state.sourceAmountNet,
      destinationAmount: store.state.destinationAmount,
      feeAmount: store.state.feeAmount,
      newDestinationAmount,
      newSourceNetAmount,
      newFeeAmount,
      newGrossSourceAmount,
      feeAmountInSourceDecimals
    })
    store.state.sourceAmount = newGrossSourceAmount
    store.state.sourceAmountNet = newSourceNetAmount
    store.state.destinationAmount = newDestinationAmount
    store.state.feeAmount = newFeeAmount
    store.state.sourceAmountFormatted = newGrossSourceAmountFormatted
    store.state.destinationAmountFormatted = newDestinationAmountFormatted
    store.state.feeAmountFormatted = feeAmountFormatted
  }

  const currSourceToken = store.state.sourceToken
  store.state.sourceToken = store.state.destinationToken
  store.state.destinationToken = currSourceToken

  store.state.sourceAmountUpdateEnabled = true

  const currSourceTokenConfiguration = store.state.sourceTokenConfiguration
  store.state.sourceTokenConfiguration = store.state.destinationTokenConfiguration
  store.state.destinationTokenConfiguration = currSourceTokenConfiguration

  store.state.sourceAmountUpdateEnabled = false

  const currConnectedChain = store.state.connectedSourceChain
  store.state.connectedSourceChain = store.state.connectedDestinationChain
  store.state.connectedDestinationChain = currConnectedChain

  const currSourceChainGenesis = store.state.sourceChainGenesis
  store.state.sourceChainGenesis = store.state.destinationChainGenesis
  store.state.destinationChainGenesis = currSourceChainGenesis

  const currSourceAmountFormatted = store.state.sourceAmountFormatted
  store.state.sourceAmountFormatted = store.state.destinationAmountFormatted
  store.state.destinationAmountFormatted = currSourceAmountFormatted
  if (!store.state.sourceAlgoConnectorType) {
    if (store.state.sourceChainConfiguration?.type == 'algo') {
      if (store.state.sourceAddress == activeAddress.value) {
        store.state.sourceAlgoConnectorType = AlgoConnectorType.UseWallet
      } else {
        store.state.sourceAlgoConnectorType = AlgoConnectorType.QRCode
      }
    }
  }

  calculateFeeAndDestinationAmount()
  // console.log('debug switch', {
  //   sourceChain: store.state.sourceChain,
  //   destinationChain: store.state.destinationChain,
  //   sourceToken: store.state.sourceToken,
  //   destinationToken: store.state.destinationToken,
  //   sourceAmount: store.state.sourceAmount,
  //   destinationAmount: store.state.destinationAmount
  // })
  fillInRoute()
}
</script>
<template>
  <div class="text-[12px] text-center 3xl:text-xl 4xl:text-2xl my-2">Origin</div>
  <div class="flex flex-row items-center justify-between">
    <hr class="h-px my-6 w-4/12 md:w-7/12 bg-divider border-0 dark:bg-gray-700" />
    <button
      type="button"
      class="w-10 p-2 cursor-pointer bg-secondary border-accent border-2 rounded-full hover:bg-white-0.2 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
      @click="switchClick"
      @keydown.enter="switchClick"
      @keydown.space.prevent="switchClick"
      aria-label="Switch origin and destination chains"
    >
      <span>
        <img
          color="red"
          id="reverse-button"
          alt="Reverse the direction between origin and destination"
          title="Reverse the direction"
          loading="lazy"
          width="20"
          height="20"
          decoding="async"
          data-nimg="1"
          class="h-20 w-20"
          src="@/assets/images/swapData.svg"
          style="color: transparent; width: 100%; height: auto"
        />
      </span>
    </button>
    <hr class="h-px my-6 w-4/12 md:w-7/12 bg-divider border-0 dark:bg-gray-700" />
  </div>
  <div class="text-[12px] text-center 3xl:text-xl 4xl:text-2xl my-2">Destination</div>
</template>
