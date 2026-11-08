<script setup lang="ts">
import { isWalletForChain } from '@/scripts/algo/isWalletForChain'
import { useWalletNetwork } from '@/scripts/algo/useWalletSync'
import { arc200BridgeWalletSlot } from '@/scripts/algo/walletSlots'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import { useWallet, type Wallet } from '@txnlab/use-wallet-vue'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogTitle from '../ui/DialogTitle.vue'
import WalletButton from '../ui/WalletButton.vue'

const toast = useToast()
const useWalletState = useWallet()
const { wallets, activeWallet, activeAccount } = useWalletState
const { isActiveWalletUsable, switchToChain } = useWalletNetwork(useWalletState)

const store = useAppStore()

const walletButtonClick = async (wallet: Wallet) => {
  console.log('source.wallet', wallet, activeWallet, activeAccount)
  await wallet.connect()
  console.log('source.wallet2', wallet, activeWallet.value, activeAccount.value)
  // align the shared manager with the chain (not before connect(): popup wallets need the click),
  // then bind only a wallet that can sign there
  const chainId = store.state.arc200BridgeChainConfiguration?.chainId
  try {
    if (chainId) await switchToChain(chainId)
  } catch (e: any) {
    console.error(e)
  }
  if (activeAccount.value?.address && chainId && isActiveWalletUsable(chainId)) {
    arc200BridgeWalletSlot(store).connect(activeAccount.value.address)
  } else {
    toast.add({
      severity: 'error',
      detail: t('sign.useWalletNotInitialized'),
      life: 3000
    })
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
</script>
<template>
  <div v-if="store.state.arc200BridgeChain" :class="store.state.dialogSelectArc200BridgeWalletIsOpen ? '' : 'hidden'">
    <div class="full-screen backdrop-blur-sm z-[100]" @click="store.state.dialogSelectArc200BridgeWalletIsOpen = false"></div>
    <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col z-[101]">
      <ul class="bg-gradient-to-r from-topleft-purple to-bottomright-purple drop-shadow-menu-default rounded-[26px] p-3">
        <DialogTitle>{{ t('dialogs.connectWalletDialog') }}</DialogTitle>

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
