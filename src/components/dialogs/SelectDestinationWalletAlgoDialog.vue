<script setup lang="ts">
import { isWalletForChain } from '@/scripts/algo/isWalletForChain'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import algosdk from 'algosdk'
import { useWallet, type Wallet } from 'avm-wallet-vue'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogButton from '../ui/DialogButton.vue'
import DialogTitle from '../ui/DialogTitle.vue'
import WalletButton from '../ui/WalletButton.vue'

const toast = useToast()

const { wallets, activeAccount } = useWallet()

const store = useAppStore()
const { t } = useI18n()

const walletButtonClick = async (wallet: Wallet) => {
  console.log('destination.wallet', wallet, activeAccount)
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
onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  if (!state.publicConfiguration) return

  state.chains = Object.keys(state.publicConfiguration.chains2tokens).map((c) => (state.publicConfiguration as PublicConfigurationRoot).chains[c])
})

const closeDialog = () => {
  store.state.dialogSelectDestinationWalletAVMIsOpen = false
}
</script>
<template>
  <div :class="store.state.dialogSelectDestinationWalletAVMIsOpen ? '' : 'hidden'">
    <div class="full-screen backdrop-blur-sm z-[100]" @click="closeDialog"></div>
    <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col z-[101]">
      <ul class="bg-gradient-to-r from-topleft-purple to-bottomright-purple drop-shadow-menu-default rounded-[26px] p-3">
        <DialogTitle>{{ t('dialogs.chooseAvmDestinationWallet') }}</DialogTitle>

        <WalletButton
          v-for="wallet in wallets.filter((w) => isWalletForChain(w.id, store.state.destinationChain ?? 0))"
          :key="wallet.id"
          :img="wallet.metadata.icon"
          :text="wallet.metadata.name"
          @click="walletButtonClick(wallet)"
        />
        <div>
          <div>{{ t('dialogs.enterAvmDestinationAddress') }}</div>
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
