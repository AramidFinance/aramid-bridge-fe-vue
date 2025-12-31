<script setup lang="ts">
import { isWalletForChain } from '@/scripts/algo/isWalletForChain'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import { useWallet, type Wallet } from '@txnlab/use-wallet-vue'
import algosdk from 'algosdk'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogTitle from '../ui/DialogTitle.vue'
import WalletButton from '../ui/WalletButton.vue'

const toast = useToast()

const { wallets, activeWallet, activeAccount } = useWallet()

const store = useAppStore()

const walletButtonClick = async (wallet: Wallet) => {
  console.log('source.wallet', wallet, activeWallet, activeAccount)
  await wallet.connect()
  console.log('source.wallet2', wallet, activeWallet.value, activeAccount.value)
  if (activeAccount.value?.address) {
    store.state.arc200BridgeAddress = activeAccount.value?.address
    store.state.arc200BridgeAlgoConnectorType = AlgoConnectorType.UseWallet
    store.state.connectedArc200BridgeChain = store.state.arc200BridgeChain
  }
  // else {
  //   if (wallet.accounts.length > 0) {
  //     console.log('setting active account to first account', wallet.accounts[0].address)
  //     await wallet.setActive()
  //     await wallet.setActiveAccount(wallet.accounts[0].address)

  //     store.state.arc200BridgeAddress = wallet.accounts[0].address
  //     store.state.arc200BridgeAlgoConnectorType = AlgoConnectorType.UseWallet
  //     store.state.connectedArc200BridgeChain = store.state.arc200BridgeChain
  //   }
  // }
  store.state.dialogSelectArc200BridgeWalletIsOpen = false
}
const qrPaymentClick = () => {
  try {
    algosdk.decodeAddress(state.addressInput)
    store.state.dialogSelectArc200BridgeWalletIsOpen = false
    store.state.arc200BridgeAddress = state.addressInput
    store.state.arc200BridgeAlgoConnectorType = AlgoConnectorType.QRCode
    store.state.connectedArc200BridgeChain = store.state.arc200BridgeChainConfiguration?.chainId
  } catch (e) {
    console.error(`AVM address ${state.addressInput} is not valid`, e)
    toast.add({
      severity: 'error',
      summary: t('dialogs.avmAddressVerification'),
      detail: t('dialogs.avmAddressInvalid'),
      life: 3000
    })
  }
}
interface IState {
  publicConfiguration: PublicConfigurationRoot | null
  chains: ChainItem[] | null
  addressInput: string
}
const state: IState = reactive({
  publicConfiguration: null,
  chains: null,
  addressInput: ''
})
const { t } = useI18n()
onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  if (!state.publicConfiguration) return

  state.chains = Object.keys(state.publicConfiguration.chains2tokens).map((c) => (state.publicConfiguration as PublicConfigurationRoot).chains[c])
})
const qrUrl = () => {
  const ret = new URL(`../../assets/images/qr-code.png`, import.meta.url)
  return ret.toString()
}
</script>
<template>
  <div v-if="store.state.arc200BridgeChain" :class="store.state.dialogSelectArc200BridgeWalletIsOpen ? '' : 'hidden'">
    <div class="full-screen backdrop-blur-sm z-[100]" @click="store.state.dialogSelectArc200BridgeWalletIsOpen = false"></div>
    <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col z-[101]">
      <ul class="bg-gradient-to-r from-topleft-purple to-bottomright-purple drop-shadow-menu-default rounded-[26px] p-3">
        <DialogTitle>Connect your wallet</DialogTitle>

        <WalletButton
          v-for="wallet in wallets.filter((w) => isWalletForChain(w.id, store.state.arc200BridgeChain ?? 0))"
          :key="wallet.id"
          :img="wallet.metadata.icon"
          :text="wallet.metadata.name"
          @click="walletButtonClick(wallet)"
        />
      </ul>
    </div>
  </div>
</template>
