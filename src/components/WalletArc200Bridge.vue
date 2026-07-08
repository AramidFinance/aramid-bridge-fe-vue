<script setup lang="ts">
import SelectArc200BridgeWalletAlgoDialog from './dialogs/SelectArc200BridgeWalletAlgoDialog.vue'
import SimpleLabel from './ui/SimpleLabel.vue'

import asyncdelay from '@/scripts/common/asyncDelay'
import { formatTooltip } from '@/scripts/common/formatTooltip'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import getAppKit, { getAppKitNetworkByChainId } from '@/scripts/eth/getAppKit'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import { NetworkId, useNetwork, useWallet } from '@txnlab/use-wallet-vue'
import { useAppKitAccount, useAppKitNetwork, useDisconnect } from '@reown/appkit/vue'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import RoundButton from './ui/RoundButton.vue'
import WalletAddress from './ui/WalletAddress.vue'

const { t } = useI18n()
const wallet = useWallet()
const { activeWallet, activeAccount } = wallet

const network = useNetwork()

const toast = useToast()
const store = useAppStore()

interface IState {
  connected: boolean
  publicConfiguration: PublicConfigurationRoot | null
}
const state: IState = reactive({
  connected: false,
  publicConfiguration: null,
  chain: store.state.arc200BridgeChainConfiguration as ChainItem
})

const fillInState = () => {
  try {
    state.connected = !!store.state.connectedArc200BridgeChain && !!store.state.arc200BridgeAddress
  } catch (e: any) {
    console.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 3000
    })
  }
}

onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  fillInState()
  //console.log('WalletSource.activeAccount.value', activeWallet.value, activeAccount.value)

  if (store.state.arc200BridgeChainConfiguration?.type == 'algo' && activeWallet.value && activeAccount.value?.address) {
    store.state.arc200BridgeAddress = activeAccount.value?.address
    store.state.arc200BridgeAlgoConnectorType = AlgoConnectorType.UseWallet
    store.state.connectedArc200BridgeChain = store.state.arc200BridgeChain
  }
})

watch(
  () => store.state.arc200BridgeChain,
  async () => {
    fillInState()
  }
)
watch(
  () => store.state.arc200BridgeAddress,
  async () => {
    fillInState()
  }
)

watch(
  () => store.state.arc200BridgeChainConfiguration,
  () => {
    fillInState()
    if (store.state.arc200BridgeChainConfiguration?.type == 'algo') {
      //console.log('setActiveNetwork', store.state.arc200BridgeChainConfiguration.name)
      switch (store.state.arc200BridgeChainConfiguration.name) {
        case 'Algorand':
          network.setActiveNetwork(NetworkId.MAINNET)
          break
        case 'Testnet':
          network.setActiveNetwork(NetworkId.TESTNET)
          break
        case 'AramidChain':
          network.setActiveNetwork('aramidmain')
          break
        case 'Voi':
          network.setActiveNetwork('voimain')
          break
      }
    }
  }
)

watch(
  () => store.state.connectedArc200BridgeChain,
  async () => {
    fillInState()
  }
)
const buttonClick = async () => {
  if (store.state.arc200BridgeChainConfiguration?.type == 'algo') {
    if (state.connected) {
      // disconnect
      switch (store.state.arc200BridgeAlgoConnectorType) {
        case AlgoConnectorType.QRCode:
          store.state.connectedArc200BridgeChain = undefined
          store.state.arc200BridgeAddress = ''
          break
        case AlgoConnectorType.UseWallet:
          store.state.connectedArc200BridgeChain = undefined
          store.state.arc200BridgeAddress = ''
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
      store.state.dialogSelectArc200BridgeWalletIsOpen = true
    }
  }
  if (store.state.arc200BridgeChainConfiguration?.type == 'eth') {
    if (state.connected) {
      // disconnect
      //await modal?.close()
      const { disconnect } = useDisconnect()
      disconnect()

      store.state.connectedArc200BridgeChain = undefined
      store.state.arc200BridgeAddress = ''
    } else {
      const modal = getAppKit()
      const account = useAppKitAccount()
      const network = useAppKitNetwork()
      if (store.state.arc200BridgeChain && network.value.chainId != store.state.arc200BridgeChain) {
        const targetNetwork = getAppKitNetworkByChainId(store.state.arc200BridgeChain)
        if (targetNetwork) {
          await network.value.switchNetwork(targetNetwork)
          await asyncdelay(500)
        }
      }

      //console.log('0x1 address is ', account.value.isConnected, account.value.address, new Date())
      if (account.value.isConnected && account.value.address) {
        store.state.connectedArc200BridgeChain = store.state.arc200BridgeChain
        store.state.arc200BridgeAddress = account.value.address
      } else {
        await modal?.open()
        //console.log('0x2 address is ', account.value.isConnected, account.value.address, new Date())
        if (account.value.isConnected && account.value.address) {
          store.state.connectedArc200BridgeChain = store.state.arc200BridgeChain
          store.state.arc200BridgeAddress = account.value.address
          return
        }
        await asyncdelay(1000)
        //console.log('0x3 address is ', account.value.isConnected, account.value.address, new Date())
        if (account.value.isConnected && account.value.address) {
          store.state.connectedArc200BridgeChain = store.state.arc200BridgeChain
          store.state.arc200BridgeAddress = account.value.address
          return
        }
        await asyncdelay(5000)
        //console.log('0x4 address is ', account.value.isConnected, account.value.address, new Date())
        if (account.value.isConnected && account.value.address) {
          store.state.connectedArc200BridgeChain = store.state.arc200BridgeChain
          store.state.arc200BridgeAddress = account.value.address
          return
        }
        await asyncdelay(10000)
        //console.log('0x5 address is ', account.value.isConnected, account.value.address, new Date())
        if (account.value.isConnected && account.value.address) {
          store.state.connectedArc200BridgeChain = store.state.arc200BridgeChain
          store.state.arc200BridgeAddress = account.value.address
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
    <SimpleLabel>Wallet for ARC200 claim</SimpleLabel>
    <RoundButton
      v-tooltip.top="formatTooltip(t('wallet.tooltipOrigin'))"
      v-if="store.state.arc200BridgeChainConfiguration"
      :img="`logos/tokens/${store.state.arc200BridgeChainConfiguration?.logo}.png`"
      :text="store.state.arc200BridgeChainConfiguration.name"
      @click="buttonClick"
    >
      <img alt="wallet" loading="lazy" width="20" height="20" decoding="async" data-nimg="1" class="3xl:w-14 3xl:h-14" :src="getImageUrl()" style="color: transparent" />
      <div
        class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate"
        v-if="store.state.arc200BridgeChainConfiguration?.type == 'algo' && store.state.arc200BridgeAlgoConnectorType == AlgoConnectorType.QRCode"
      >
        QR Code
      </div>

      <div class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate" v-else-if="state.connected">
        <WalletAddress :address="store.state.arc200BridgeAddress"></WalletAddress>
      </div>
      <div class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate" v-else>{{ t('wallet.connectOrigin') }}</div>
    </RoundButton>
    <SelectArc200BridgeWalletAlgoDialog></SelectArc200BridgeWalletAlgoDialog>
  </div>
</template>
