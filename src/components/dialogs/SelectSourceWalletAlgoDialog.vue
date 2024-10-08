<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import WalletButton from '../ui/WalletButton.vue'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { onMounted, reactive } from 'vue'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { useWallet, type Wallet } from '@txnlab/use-wallet-vue'
import algosdk from 'algosdk'
import { useToast } from 'primevue/usetoast'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import DialogTitle from '../ui/DialogTitle.vue'
import { isWalletForChain } from '@/scripts/algo/isWalletForChain'

const toast = useToast()

const { wallets, activeWallet, activeAccount } = useWallet()

const store = useAppStore()

const walletButtonClick = async (wallet: Wallet) => {
  console.log('source.wallet', wallet, activeWallet, activeAccount)
  await wallet.connect()
  console.log('source.wallet2', wallet, activeWallet, activeAccount)
  if (activeAccount.value?.address) {
    store.state.sourceAddress = activeAccount.value?.address
    store.state.sourceAlgoConnectorType = AlgoConnectorType.UseWallet
    store.state.connectedSourceChain = store.state.sourceChain
  }
  store.state.dialogSelectSourceWalletIsOpen = false
}
const qrPaymentClick = () => {
  try {
    algosdk.decodeAddress(state.addressInput)
    store.state.dialogSelectSourceWalletIsOpen = false
    store.state.sourceAddress = state.addressInput
    store.state.sourceAlgoConnectorType = AlgoConnectorType.QRCode
    store.state.connectedSourceChain = store.state.sourceChainConfiguration?.chainId
  } catch (e) {
    console.error(`AVM address ${state.addressInput} is not valid`, e)
    toast.add({
      severity: 'error',
      summary: 'AVM address verification',
      detail: 'AVM address is not valid',
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
  <div v-if="store.state.sourceChain" :class="store.state.dialogSelectSourceWalletIsOpen ? '' : 'hidden'">
    <div class="full-screen backdrop-blur-sm z-[100]" @click="store.state.dialogSelectSourceWalletIsOpen = false"></div>
    <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col z-[101]">
      <ul class="bg-gradient-to-r from-topleft-purple to-bottomright-purple drop-shadow-menu-default rounded-[26px] p-3">
        <DialogTitle>Connect AVM origin wallet</DialogTitle>

        <WalletButton
          v-for="wallet in wallets.filter((w) => isWalletForChain(w.id, store.state.sourceChain ?? 0))"
          :key="wallet.id"
          :img="wallet.metadata.icon"
          :text="wallet.metadata.name"
          @click="walletButtonClick(wallet)"
        />
        <div>
          <div>Or enter your AVM address for QR payment</div>
          <textarea
            v-model="state.addressInput"
            class="bg-white-rgba rounded-[10px] focus:outline-none w-full mt-1 3xl:mt-3 4xl:mt-6 p-1 3xl:p-3 4xl:p-6 text-base h-[80px] 3xl:h-[112px] 4xl:h-[157px] w-full"
            rows="3"
          ></textarea>
        </div>
        <WalletButton :img="qrUrl()" text="QR payment" @click="qrPaymentClick()" />
      </ul>
    </div>
  </div>
</template>
