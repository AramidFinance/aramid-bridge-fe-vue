<script setup lang="ts">
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import algosdk from 'algosdk'
import { ethers } from 'ethers'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogButton from '../ui/DialogButton.vue'
import DialogTitle from '../ui/DialogTitle.vue'
import WalletAddress from '../ui/WalletAddress.vue'

const store = useAppStore()
const toast = useToast()
const { t } = useI18n()

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
        throw new Error(t('dialogs.addressInvalid'))
      }
    }
    if (store.state.sourceChainConfiguration?.type == 'eth') {
      if (!ethers.isAddress(state.addressInput ?? '')) {
        throw new Error(t('dialogs.addressInvalid'))
      }
    }

    store.state.destinationAddress = state.addressInput
    store.state.connectedDestinationChain = store.state.destinationChainConfiguration?.chainId
    store.state.dialogSelectDestinationWalletIsOpen = false
  } catch (e: any) {
    console.error(e)
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
    <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col z-[101]">
      <ul class="bg-gradient-to-r from-topleft-purple to-bottomright-purple drop-shadow-menu-default rounded-[26px] p-3">
        <DialogTitle>{{ t('dialogs.chooseDestinationWallet') }}</DialogTitle>
        <div v-if="store.state.sourceAddress">
          <div>{{ t('dialogs.useSourceAddressQuestion') }} <WalletAddress :address="store.state.sourceAddress"></WalletAddress>?</div>
          <DialogButton @click="sameAddressYesClick">{{ t('common.yes') }}</DialogButton>
          <DialogButton @click="differentAddressClick">{{ t('common.no') }}</DialogButton>
        </div>
        <div v-else>{{ t('dialogs.selectOriginFirst') }}</div>
        <div>
          <div>{{ t('dialogs.enterThirdPartyAddress') }}</div>
          <textarea
            v-model="state.addressInput"
            class="bg-white-rgba rounded-[10px] focus:outline-none w-full mt-1 3xl:mt-3 4xl:mt-6 p-1 3xl:p-3 4xl:p-6 text-base h-[80px] 3xl:h-[112px] 4xl:h-[157px] w-full"
            rows="3"
          ></textarea>
          <DialogButton @click="useAddressClick">{{ t('dialogs.useThisAddress') }}</DialogButton>
        </div>
      </ul>
    </div>
  </div>
</template>
