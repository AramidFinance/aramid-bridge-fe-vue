<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import logger from "@/scripts/common/conditionalLogger"
import WalletButton from '../ui/WalletButton.vue'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { onMounted, reactive, ref, computed } from 'vue'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { useWallet, type Wallet } from 'avm-wallet-vue'
import algosdk from 'algosdk'
import { useToast } from 'primevue/usetoast'
import WalletAddress from '../ui/WalletAddress.vue'
import DialogTitle from '../ui/DialogTitle.vue'
import DialogButton from '../ui/DialogButton.vue'
import { isWalletForChain } from '@/scripts/algo/isWalletForChain'
import { useFocusTrap } from '@/composables/useFocusTrap'

const toast = useToast()

const { wallets, activeAccount } = useWallet()

const store = useAppStore()
const dialogRef = ref<HTMLElement | null>(null)
const isOpen = computed(() => store.state.dialogSelectDestinationWalletAVMIsOpen)

useFocusTrap(dialogRef, isOpen)

const walletButtonClick = async (wallet: Wallet) => {
  logger.debug('destination.wallet', wallet, activeAccount)
  await wallet.connect()
  if (activeAccount.value?.address) {
    store.state.destinationAddress = activeAccount.value?.address
  }
  store.state.dialogSelectDestinationWalletAVMIsOpen = false
}
const useAddressClick = () => {
  try {
    algosdk.decodeAddress(state.addressInput)
    store.state.destinationAddress = state.addressInput
    store.state.connectedDestinationChain = store.state.destinationChainConfiguration?.chainId
    store.state.dialogSelectDestinationWalletAVMIsOpen = false
  } catch (e) {
    logger.error(`AVM address ${state.addressInput} is not valid`, e)
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

const sameAddressYesClick = () => {
  store.state.destinationAddress = store.state.sourceAddress
  store.state.dialogSelectDestinationWalletAVMIsOpen = false
}

const closeDialog = () => {
  store.state.dialogSelectDestinationWalletAVMIsOpen = false
}
</script>
<template>
  <div :class="store.state.dialogSelectDestinationWalletAVMIsOpen ? '' : 'hidden'">
    <div class="full-screen backdrop-blur-sm z-[100]" @click="closeDialog"></div>
    <div
      ref="dialogRef"
      class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col z-[101]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-destination-wallet-avm-title"
      @keydown.esc="closeDialog"
    >
      <ul class="bg-gradient-brand drop-shadow-menu-default rounded-2xl p-3">
        <DialogTitle id="select-destination-wallet-avm-title">Choose AVM destination wallet</DialogTitle>

        <WalletButton
          v-for="wallet in wallets.filter((w) => isWalletForChain(w.id, store.state.destinationChain ?? 0))"
          :key="wallet.id"
          :img="wallet.metadata.icon"
          :text="wallet.metadata.name"
          @click="walletButtonClick(wallet)"
        />
        <div>
          <div>Or enter your AVM address</div>
          <label for="destination-wallet-avm-address" class="sr-only">Enter your AVM wallet address</label>
          <textarea
            id="destination-wallet-avm-address"
            v-model="state.addressInput"
            class="bg-bg-elevated rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 w-full mt-1 3xl:mt-3 4xl:mt-6 p-1 3xl:p-3 4xl:p-6 text-base h-[80px] 3xl:h-[112px] 4xl:h-[157px] w-full"
            rows="3"
            aria-label="AVM wallet address"
          ></textarea>
          <DialogButton @click="useAddressClick">Use this address</DialogButton>
        </div>
      </ul>
    </div>
  </div>
</template>
