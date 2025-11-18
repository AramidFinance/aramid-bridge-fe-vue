<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import logger from "@/scripts/common/conditionalLogger"
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { onMounted, reactive, ref, computed } from 'vue'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import WalletAddress from '../ui/WalletAddress.vue'
import DialogTitle from '../ui/DialogTitle.vue'
import DialogButton from '../ui/DialogButton.vue'
import algosdk from 'algosdk'
import { ethers } from 'ethers'
import { useToast } from 'primevue/usetoast'
import { useFocusTrap } from '@/composables/useFocusTrap'

const store = useAppStore()
const toast = useToast()
const dialogRef = ref<HTMLElement | null>(null)
const isOpen = computed(() => store.state.dialogSelectDestinationWalletIsOpen)

useFocusTrap(dialogRef, isOpen)

interface IState {
  publicConfiguration: PublicConfigurationRoot | null
  chains: ChainItem[] | null
  addressInput: string
  step2: boolean
}
const state: IState = reactive({
  publicConfiguration: null,
  chains: null,
  addressInput: '',
  step2: false
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
  store.state.connectedDestinationChain = store.state.destinationChainConfiguration?.chainId
  store.state.dialogSelectDestinationWalletIsOpen = false
}
const differentAddressClick = () => {
  if (store.state.sourceChainConfiguration?.type == 'algo') {
    store.state.dialogSelectDestinationWalletIsOpen = false
    store.state.dialogSelectDestinationWalletAVMIsOpen = true
  }
}

const closeDialog = () => {
  store.state.dialogSelectDestinationWalletIsOpen = false
}
const useAddressClick = () => {
  try {
    state.addressInput = state.addressInput.trim()
    if (store.state.sourceChainConfiguration?.type == 'algo') {
      if (!algosdk.isValidAddress(state.addressInput ?? '')) {
        throw new Error('Address is invalid')
      }
    }
    if (store.state.sourceChainConfiguration?.type == 'eth') {
      if (!ethers.isAddress(state.addressInput ?? '')) {
        throw new Error('Address is invalid')
      }
    }

    store.state.destinationAddress = state.addressInput
    store.state.connectedDestinationChain = store.state.destinationChainConfiguration?.chainId
    store.state.dialogSelectDestinationWalletIsOpen = false
  } catch (e: any) {
    logger.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 3000
    })
  }
}
</script>
<template>
  <div :class="store.state.dialogSelectDestinationWalletIsOpen ? '' : 'hidden'">
    <div class="full-screen backdrop-blur-sm z-[100]" @click="closeDialog"></div>
    <div
      ref="dialogRef"
      class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col z-[101]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-destination-wallet-title"
      @keydown.esc="closeDialog"
    >
      <ul class="bg-gradient-brand drop-shadow-menu-default rounded-2xl p-3">
        <DialogTitle id="select-destination-wallet-title">Choose destination wallet</DialogTitle>
        <div v-if="store.state.sourceAddress">
          <div>Do you want to use address <WalletAddress :address="store.state.sourceAddress"></WalletAddress>?</div>
          <DialogButton @click="sameAddressYesClick">Yes</DialogButton>
          <DialogButton @click="differentAddressClick">No</DialogButton>
        </div>
        <div v-else>Please select the origin address first</div>
        <div>
          <div>Or enter third party address</div>
          <label for="destination-wallet-address" class="sr-only">Enter third party wallet address</label>
          <textarea
            id="destination-wallet-address"
            v-model="state.addressInput"
            class="bg-bg-elevated rounded-lg focus:outline-none w-full mt-1 3xl:mt-3 4xl:mt-6 p-1 3xl:p-3 4xl:p-6 text-base h-[80px] 3xl:h-[112px] 4xl:h-[157px] w-full"
            rows="3"
            aria-label="Third party wallet address"
          ></textarea>
          <DialogButton @click="useAddressClick">Use this address</DialogButton>
        </div>
      </ul>
    </div>
  </div>
</template>
