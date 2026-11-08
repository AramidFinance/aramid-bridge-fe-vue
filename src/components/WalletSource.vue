<script setup lang="ts">
import SelectSourceWalletAlgoDialog from './dialogs/SelectSourceWalletAlgoDialog.vue'
import SimpleLabel from './ui/SimpleLabel.vue'

import getAlgoAccountARC200TokenBalance from '@/scripts/algo/getAlgoAccountARC200TokenBalance'
import getAlgoAccountTokenBalance from '@/scripts/algo/getAlgoAccountTokenBalance'
import asyncdelay from '@/scripts/common/asyncDelay'
import { formatTooltip } from '@/scripts/common/formatTooltip'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import getEthAccountTokenBalance from '@/scripts/eth/getEthAccountTokenBalance'
import getAppKit, { getAppKitNetworkByChainId } from '@/scripts/eth/getAppKit'
import { fillSourceTokenConfiguration } from '@/scripts/events/fillSourceTokenConfiguration'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import { useWalletSync } from '@/scripts/algo/useWalletSync'
import { sourceWalletSlot } from '@/scripts/algo/walletSlots'
import { useAppKitAccount, useAppKitNetwork, useDisconnect } from '@reown/appkit/vue'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import RoundButton from './ui/RoundButton.vue'
import WalletAddress from './ui/WalletAddress.vue'

const { t } = useI18n()
const toast = useToast()
const store = useAppStore()

const slot = sourceWalletSlot(store)
const { disconnect } = useWalletSync(slot)

interface IState {
  connected: boolean
  publicConfiguration: PublicConfigurationRoot | null
}
const state: IState = reactive({
  connected: false,
  publicConfiguration: null,
  chain: store.state.sourceChainConfiguration as ChainItem
})

const fillInState = () => {
  try {
    fillSourceTokenConfiguration()
    state.connected = !!store.state.connectedSourceChain && !!store.state.sourceAddress
  } catch (e: any) {
    console.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 3000
    })
  }
}

// address/chain/token can change while a balance request is in flight (e.g. wallet sync): only the
// latest request may write the balance, and any newer call clears the loading flag of older ones
let balanceRequestId = 0
const onSourceAddressChange = async () => {
  const requestId = ++balanceRequestId
  const isCurrent = () => requestId === balanceRequestId
  store.state.loadingSourceAddressBalance = false
  try {
    // refresh balance of source account
    if (!store.state.sourceChain) return
    if (!store.state.sourceChainConfiguration) return
    if (!store.state.sourceAddress) return
    if (!store.state.sourceTokenConfiguration) return
    const sourceChainConfiguration = store.state.sourceChainConfiguration
    const { name: sourceChainName } = sourceChainConfiguration
    const sourceTokenConfig = store.state.sourceTokenConfiguration
    const { type: sourceTokenType } = sourceTokenConfig
    console.log('sourceTokenType', sourceTokenType)
    console.log('sourceTokenConfig', sourceTokenConfig)
    if (sourceTokenType == 'algo') {
      switch (sourceChainName) {
        case 'Voi': {
          if (sourceTokenConfig?.arc200TokenId) {
            const balance = await getAlgoAccountARC200TokenBalance(store.state.sourceChain, store.state.sourceAddress, Number(sourceTokenConfig?.arc200TokenId))
            if (balance !== null && isCurrent()) {
              store.state.sourceAddressBalance = balance.toString()
              store.state.loadingSourceAddressBalance = false
              //console.log('onSourceAddressChange.balance', store.state.sourceAddressBalance, store.state.sourceChain, store.state.sourceAddress, Number(store.state.sourceToken))
            }
          } else {
            store.state.loadingSourceAddressBalance = true
            const balance = await getAlgoAccountTokenBalance(store.state.sourceChain, store.state.sourceAddress, Number(store.state.sourceToken))
            if (balance !== null && isCurrent()) {
              store.state.sourceAddressBalance = balance.toString()
              store.state.loadingSourceAddressBalance = false
              //console.log('onSourceAddressChange.balance', store.state.sourceAddressBalance, store.state.sourceChain, store.state.sourceAddress, Number(store.state.sourceToken))
            }
          }
          break
        }
        default: {
          store.state.loadingSourceAddressBalance = true
          const balance = await getAlgoAccountTokenBalance(store.state.sourceChain, store.state.sourceAddress, Number(store.state.sourceToken))
          if (balance !== null && isCurrent()) {
            store.state.sourceAddressBalance = balance.toString()
            store.state.loadingSourceAddressBalance = false
            //console.log('onSourceAddressChange.balance', store.state.sourceAddressBalance, store.state.sourceChain, store.state.sourceAddress, Number(store.state.sourceToken))
          }
        }
      }
    }
    if (store.state.sourceChainConfiguration.type == 'eth' && store.state.sourceToken) {
      store.state.loadingSourceAddressBalance = true
      const balance = await getEthAccountTokenBalance(store.state.sourceChain, store.state.sourceAddress, store.state.sourceToken)
      if (balance !== null && isCurrent()) {
        store.state.sourceAddressBalance = balance.toString()
        store.state.loadingSourceAddressBalance = false
        //console.log('onSourceAddressChange.balance', store.state.sourceAddressBalance, store.state.sourceChain, store.state.sourceAddress, Number(store.state.sourceToken))
      }
    }
  } catch (e: any) {
    if (!isCurrent()) return false
    store.state.loadingSourceAddressBalance = false
    console.error(e)
    toast.add({
      severity: 'error',
      detail: e.message,
      life: 3000
    })
    return false
  }
}

onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  fillInState()
  if (store.state.sourceAddress) {
    onSourceAddressChange()
  }
})

// one watcher, so that changing several of these at once (e.g. a wallet sync) makes one balance request
watch(
  () => [store.state.sourceChain, store.state.sourceAddress, store.state.connectedSourceChain],
  async () => {
    fillInState()
    await onSourceAddressChange()
  }
)

watch(
  () => store.state.sourceChainConfiguration,
  () => {
    fillInState()
  }
)

watch(
  () => store.state.sourceToken,
  async () => {
    await onSourceAddressChange()
  }
)
const buttonClick = async () => {
  if (store.state.sourceChainConfiguration?.type == 'algo') {
    if (state.connected) {
      await disconnect()
    } else {
      store.state.dialogSelectSourceWalletIsOpen = true
    }
  }
  if (store.state.sourceChainConfiguration?.type == 'eth') {
    if (state.connected) {
      // disconnect
      //await modal?.close()
      const { disconnect } = useDisconnect()
      disconnect()

      slot.disconnect()
    } else {
      const modal = getAppKit()
      const account = useAppKitAccount()
      const network = useAppKitNetwork()
      if (store.state.sourceChain && network.value.chainId != store.state.sourceChain) {
        const targetNetwork = getAppKitNetworkByChainId(store.state.sourceChain)
        if (targetNetwork) {
          await network.value.switchNetwork(targetNetwork)
          await asyncdelay(500)
        }
      }

      //console.log('0x1 address is ', account.value.isConnected, account.value.address, new Date())
      if (account.value.isConnected && account.value.address) {
        store.state.connectedSourceChain = store.state.sourceChain
        store.state.sourceAddress = account.value.address
      } else {
        await modal?.open()
        //console.log('0x2 address is ', account.value.isConnected, account.value.address, new Date())
        if (account.value.isConnected && account.value.address) {
          store.state.connectedSourceChain = store.state.sourceChain
          store.state.sourceAddress = account.value.address
          return
        }
        await asyncdelay(1000)
        //console.log('0x3 address is ', account.value.isConnected, account.value.address, new Date())
        if (account.value.isConnected && account.value.address) {
          store.state.connectedSourceChain = store.state.sourceChain
          store.state.sourceAddress = account.value.address
          return
        }
        await asyncdelay(5000)
        //console.log('0x4 address is ', account.value.isConnected, account.value.address, new Date())
        if (account.value.isConnected && account.value.address) {
          store.state.connectedSourceChain = store.state.sourceChain
          store.state.sourceAddress = account.value.address
          return
        }
        await asyncdelay(10000)
        //console.log('0x5 address is ', account.value.isConnected, account.value.address, new Date())
        if (account.value.isConnected && account.value.address) {
          store.state.connectedSourceChain = store.state.sourceChain
          store.state.sourceAddress = account.value.address
          return
        }
      }

      //if (!address) {
      // await modal?.open({ view: 'Account' })
      // address = await modal?.getAddress()
      // //console.log('address after open is ', address)
      // //}

      // if (address) {
      // }
    }
  }
}
const getImageUrl = () => {
  if (state.connected) {
    const ret = new URL(`../assets/images/WalletConnected.svg`, import.meta.url)
    return ret.toString()
  } else {
    const ret = new URL(`../assets/images/Wallet.svg`, import.meta.url)
    return ret.toString()
  }
}
</script>
<template>
  <div>
    <SimpleLabel>{{ t('wallet.originWallet') }}</SimpleLabel>
    <RoundButton
      v-tooltip.top="formatTooltip(t('wallet.tooltipOrigin'))"
      v-if="store.state.sourceTokenConfiguration"
      :img="`logos/tokens/${store.state.sourceTokenConfiguration?.logo}.png`"
      :text="store.state.sourceTokenConfiguration.name"
      @click="buttonClick"
    >
      <img alt="wallet" loading="lazy" width="20" height="20" decoding="async" data-nimg="1" class="3xl:w-14 3xl:h-14" :src="getImageUrl()" style="color: transparent" />
      <div
        class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate"
        v-if="store.state.sourceChainConfiguration?.type == 'algo' && store.state.sourceAlgoConnectorType == AlgoConnectorType.QRCode"
      >
        QR Code
      </div>

      <div class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate" v-else-if="state.connected">
        <WalletAddress :address="store.state.sourceAddress"></WalletAddress>
      </div>
      <div class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate" v-else>{{ t('wallet.connectOrigin') }}</div>
    </RoundButton>
    <SelectSourceWalletAlgoDialog v-if="store.state.sourceChainConfiguration?.type == 'algo'"></SelectSourceWalletAlgoDialog>
  </div>
</template>
