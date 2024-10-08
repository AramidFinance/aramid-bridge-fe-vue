<script setup lang="ts">
import SimpleLabel from './ui/SimpleLabel.vue'
import SelectSourceWalletAlgoDialog from './dialogs/SelectSourceWalletAlgoDialog.vue'

import { useAppStore } from '@/stores/app'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { onMounted, reactive, watch } from 'vue'
import RoundButton from './ui/RoundButton.vue'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import { useToast } from 'primevue/usetoast'
import { fillSourceTokenConfiguration } from '@/scripts/events/fillSourceTokenConfiguration'
import getAlgoAccountTokenBalance from '@/scripts/algo/getAlgoAccountTokenBalance'
import { NetworkId, useWallet } from '@txnlab/use-wallet-vue'
import getWeb3Modal from '@/scripts/eth/getWeb3Modal'
import { useDisconnect, useWeb3ModalAccount } from '@web3modal/ethers/vue'
import { useSwitchNetwork } from '@web3modal/ethers/vue'
import asyncdelay from '@/scripts/common/asyncDelay'
import getEthAccountTokenBalance from '@/scripts/eth/getEthAccountTokenBalance'
import WalletAddress from './ui/WalletAddress.vue'

const { setActiveNetwork, activeWallet, activeAccount } = useWallet()

const toast = useToast()
const store = useAppStore()

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

const onSourceAddressChange = async () => {
  try {
    // refresh balance of source account
    if (!store.state.sourceChain) return
    if (!store.state.sourceChainConfiguration) return
    if (!store.state.sourceAddress) return
    if (store.state.sourceChainConfiguration.type == 'algo') {
      store.state.loadingSourceAddressBalance = true
      const balance = await getAlgoAccountTokenBalance(store.state.sourceChain, store.state.sourceAddress, Number(store.state.sourceToken))
      if (balance !== null) {
        store.state.sourceAddressBalance = balance.toString()
        store.state.loadingSourceAddressBalance = false
        console.log('onSourceAddressChange.balance', store.state.sourceAddressBalance, store.state.sourceChain, store.state.sourceAddress, Number(store.state.sourceToken))
      }
    }
    if (store.state.sourceChainConfiguration.type == 'eth' && store.state.sourceToken) {
      store.state.loadingSourceAddressBalance = true
      const balance = await getEthAccountTokenBalance(store.state.sourceChain, store.state.sourceAddress, store.state.sourceToken)
      if (balance !== null) {
        store.state.sourceAddressBalance = balance.toString()
        store.state.loadingSourceAddressBalance = false
        console.log('onSourceAddressChange.balance', store.state.sourceAddressBalance, store.state.sourceChain, store.state.sourceAddress, Number(store.state.sourceToken))
      }
    }
  } catch (e: any) {
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
  console.log('WalletSource.activeAccount.value', activeWallet.value, activeAccount.value)

  if (store.state.sourceChainConfiguration?.type == 'algo' && activeWallet.value && activeAccount.value?.address) {
    store.state.sourceAddress = activeAccount.value?.address
    store.state.sourceAlgoConnectorType = AlgoConnectorType.UseWallet
    store.state.connectedSourceChain = store.state.sourceChain
  }
  if (store.state.sourceAddress) {
    onSourceAddressChange()
  }
})

watch(
  () => store.state.sourceChain,
  async () => {
    fillInState()
    await onSourceAddressChange()
  }
)
watch(
  () => store.state.sourceAddress,
  async () => {
    fillInState()
    await onSourceAddressChange()
  }
)

watch(
  () => store.state.sourceChainConfiguration,
  () => {
    fillInState()
    if (store.state.sourceChainConfiguration?.type == 'algo') {
      console.log('setActiveNetwork', store.state.sourceChainConfiguration.name)
      switch (store.state.sourceChainConfiguration.name) {
        case 'Algorand':
          setActiveNetwork(NetworkId.MAINNET)
          break
        case 'Testnet':
          setActiveNetwork(NetworkId.TESTNET)
          break
        case 'AramidChain':
          setActiveNetwork(NetworkId.ARAMIDMAIN)
          break
        case 'Voi':
          setActiveNetwork(NetworkId.VOIMAIN)
          break
      }
    }
  }
)

watch(
  () => store.state.connectedSourceChain,
  async () => {
    fillInState()
    await onSourceAddressChange()
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
      // disconnect
      switch (store.state.sourceAlgoConnectorType) {
        case AlgoConnectorType.QRCode:
          store.state.connectedSourceChain = undefined
          store.state.sourceAddress = ''
          break
        case AlgoConnectorType.UseWallet:
          store.state.connectedSourceChain = undefined
          store.state.sourceAddress = ''
          try {
            activeWallet.value?.disconnect()
          } catch (e: any) {
            console.error(e)
            toast.add({
              severity: 'error',
              detail: e.message ?? e,
              life: 3000
            })
          }
          break
      }
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

      store.state.connectedSourceChain = undefined
      store.state.sourceAddress = ''
    } else {
      const modal = getWeb3Modal()
      const { address, chainId, isConnected } = useWeb3ModalAccount()
      if (store.state.sourceChain && chainId.value != store.state.sourceChain) {
        const { switchNetwork } = useSwitchNetwork()
        switchNetwork(store.state.sourceChain)
        await asyncdelay(500)
      }

      console.log('0x1 address is ', isConnected.value, address.value, new Date())
      if (isConnected.value && address.value) {
        store.state.connectedSourceChain = store.state.sourceChain
        store.state.sourceAddress = address.value
      } else {
        await modal?.open()
        console.log('0x2 address is ', isConnected.value, address.value, new Date())
        if (isConnected.value && address.value) {
          store.state.connectedSourceChain = store.state.sourceChain
          store.state.sourceAddress = address.value
          return
        }
        await asyncdelay(1000)
        console.log('0x3 address is ', isConnected.value, address.value, new Date())
        if (isConnected.value && address.value) {
          store.state.connectedSourceChain = store.state.sourceChain
          store.state.sourceAddress = address.value
          return
        }
        await asyncdelay(5000)
        console.log('0x4 address is ', isConnected.value, address.value, new Date())
        if (isConnected.value && address.value) {
          store.state.connectedSourceChain = store.state.sourceChain
          store.state.sourceAddress = address.value
          return
        }
        await asyncdelay(10000)
        console.log('0x5 address is ', isConnected.value, address.value, new Date())
        if (isConnected.value && address.value) {
          store.state.connectedSourceChain = store.state.sourceChain
          store.state.sourceAddress = address.value
          return
        }
      }

      //if (!address) {
      // await modal?.open({ view: 'Account' })
      // address = await modal?.getAddress()
      // console.log('address after open is ', address)
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
    <SimpleLabel>Origin wallet</SimpleLabel>
    <RoundButton
      v-tooltip.top="
        'Before proceeding, connect your wallet. Once connected, your origin account will be auto-filled.\n On AVM chains, you can initiate bridging using the QR payment option by entering your account address.'
      "
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
      <div class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate" v-else>Connect origin wallet</div>
    </RoundButton>
    <SelectSourceWalletAlgoDialog v-if="store.state.sourceChainConfiguration?.type == 'algo'"></SelectSourceWalletAlgoDialog>
  </div>
</template>
