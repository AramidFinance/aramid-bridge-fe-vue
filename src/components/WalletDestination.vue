<script setup lang="ts">
import SelectDestinationWalletAlgoDialog from './dialogs/SelectDestinationWalletAlgoDialog.vue'
import SimpleLabel from './ui/SimpleLabel.vue'

import getAlgoAccountARC200TokenBalance from '@/scripts/algo/getAlgoAccountARC200TokenBalance'
import getAlgoAccountTokenBalance from '@/scripts/algo/getAlgoAccountTokenBalance'
import getAlgoAccountTokenOptedIn from '@/scripts/algo/getAlgoAccountTokenOptedIn'
import asyncdelay from '@/scripts/common/asyncDelay'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import getEthAccountTokenBalance from '@/scripts/eth/getEthAccountTokenBalance'
import getWeb3Modal from '@/scripts/eth/getWeb3Modal'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import { useAppStore } from '@/stores/app'
import { useWeb3ModalAccount } from '@web3modal/ethers/vue'
import { useWallet } from 'avm-wallet-vue'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectDestinationWalletDialog from './dialogs/SelectDestinationWalletDialog.vue'
import RoundButton from './ui/RoundButton.vue'
import WalletAddress from './ui/WalletAddress.vue'
import { formatTooltip } from '@/scripts/common/formatTooltip'
import debounce from '@/scripts/common/debounce'
import logger from '@/scripts/common/conditionalLogger'

const { t } = useI18n()
const store = useAppStore()
const toast = useToast()
const { setActiveNetwork, avmActiveWallet, activeAccount } = useWallet()
interface IState {
  connected: boolean
  publicConfiguration: PublicConfigurationRoot | null
}
const state: IState = reactive({
  connected: false,
  publicConfiguration: null
})

const fillInState = () => {
  state.connected = !!store.state.destinationAddress
}

onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  logger.debug('WalletDestination.activeAccount.value', avmActiveWallet.value, activeAccount.value)
  if (store.state.destinationChainConfiguration?.type == 'algo' && avmActiveWallet.value && activeAccount.value?.address) {
    store.state.destinationAddress = activeAccount.value?.address
    store.state.connectedDestinationChain = store.state.destinationChain
  }

  fillInState()
})

watch(
  () => store.state.destinationAddress,
  () => {
    fillInState()
  }
)
const buttonClick = async () => {
  if (state.connected) {
    // disconnect
    store.state.destinationAddress = ''
  } else {
    if (store.state.sourceChainConfiguration?.type && store.state.sourceChainConfiguration?.type == store.state.destinationChainConfiguration?.type) {
      store.state.dialogSelectDestinationWalletIsOpen = true
    } else if (store.state.destinationChainConfiguration?.type == 'algo') {
      store.state.dialogSelectDestinationWalletAVMIsOpen = true
    } else if (store.state.destinationChainConfiguration?.type == 'eth') {
      // select address from wc
      const modal = getWeb3Modal()
      const { address, chainId, isConnected } = useWeb3ModalAccount()

      if (isConnected.value && address.value) {
        store.state.connectedDestinationChain = store.state.destinationChain
        store.state.destinationAddress = address.value
      } else {
        await modal?.open()

        // Use Promise.race to wait for connection with timeout (Task 4.3)
        const connectionTimeout = 5000
        const startTime = Date.now()

        const checkConnection = async () => {
          while (Date.now() - startTime < connectionTimeout) {
            if (isConnected.value && address.value) {
              store.state.connectedDestinationChain = store.state.destinationChain
              store.state.destinationAddress = address.value
              return true
            }
            await asyncdelay(100)
          }
          return false
        }

        const connected = await checkConnection()
        if (!connected) {
          logger.warn('Wallet connection timeout after 5s')
          toast.add({
            severity: 'warn',
            detail: 'Wallet connection timed out. Please try again.',
            life: 3000
          })
        }
      }
    }
  }
}

const getImageUrl = () => {
  if (state.connected) {
    // eth does not allow manual address entry
    if (store.state.destinationChainConfiguration?.type == 'eth') {
      const ret = new URL(`../assets/images/WalletConnected.svg`, import.meta.url)
      return ret.toString()
    } else {
      // if the address is not the same as the active account, show the wallet icon
      if (activeAccount.value?.address !== store.state.destinationAddress) {
        const ret = new URL(`../assets/images/Wallet.svg`, import.meta.url)
        return ret.toString()
      }
      // is manual address entry and not connected
      else {
        const ret = new URL(`../assets/images/WalletConnected.svg`, import.meta.url)
        return ret.toString()
      }
    }
  } else {
    const ret = new URL(`../assets/images/Wallet.svg`, import.meta.url)
    return ret.toString()
  }
}

const onDestinationAddressChange = async () => {
  try {
    // refresh balance of destination account
    if (!store.state.destinationChain) return
    if (!store.state.destinationChainConfiguration) return
    if (!store.state.destinationAddress) return
    if (!store.state.destinationTokenConfiguration) return

    const destinationChainConfiguration = store.state.destinationChainConfiguration
    const { name: destinationChainName, type: destinationChainType, chainId: destinationChainId } = destinationChainConfiguration
    const destinationTokenConfig = store.state.destinationTokenConfiguration as any
    const { type: destinationTokenType, contractId: destinationTokenContractId, unitAppId: destinationTokenUnitAppId, chainId: destinationTokenChainId } = destinationTokenConfig

    logger.debug('destinationTokenType', destinationTokenType)
    logger.debug('destinationTokenConfig', destinationTokenConfig)

    if (destinationTokenType == 'algo') {
      switch (destinationChainName) {
        case 'Voi': {
          if (destinationTokenConfig?.arc200TokenId) {
            const balance = await getAlgoAccountARC200TokenBalance(
              store.state.destinationChain,
              store.state.destinationAddress,
              Number(destinationTokenConfig?.arc200TokenId),
              Number(store.state.destinationToken)
            )
            if (balance !== null) {
              store.state.destinationAddressBalance = balance.toString()
              store.state.loadingDestinationAddressBalance = false
              logger.debug('onDestinationAddressChange.balance', store.state.destinationAddressBalance, store.state.destinationChain, store.state.destinationAddress, Number(store.state.destinationToken))
            }
          } else {
            store.state.loadingDestinationAddressBalance = true
            const balance = await getAlgoAccountTokenBalance(store.state.destinationChain, store.state.destinationAddress, Number(store.state.destinationToken))
            if (balance !== null) {
              store.state.destinationAddressBalance = balance.toString()
              store.state.loadingDestinationAddressBalance = false
              logger.debug('onDestinationAddressChange.balance', store.state.destinationAddressBalance, store.state.destinationChain, store.state.destinationAddress, Number(store.state.destinationToken))
            }
          }
          break
        }
        default: {
          store.state.loadingDestinationAddressBalance = true
          const balance = await getAlgoAccountTokenBalance(store.state.destinationChain, store.state.destinationAddress, Number(store.state.destinationToken))
          if (balance !== null) {
            store.state.destinationAddressBalance = balance.toString()
            store.state.loadingDestinationAddressBalance = false
            logger.debug('onDestinationAddressChange.balance', store.state.destinationAddressBalance, store.state.destinationChain, store.state.destinationAddress, Number(store.state.destinationToken))
          }
        }
      }

      // Check opt-in status for Algorand chains
      try {
        const optin = await getAlgoAccountTokenOptedIn(store.state.destinationChain, store.state.destinationAddress, Number(store.state.destinationToken))
        if (optin !== null) {
          store.state.destinationAccountOptedIn = optin
        } else {
          store.state.destinationAccountOptedIn = false
        }
      } catch (e: any) {
        store.state.destinationAccountOptedIn = false
        logger.error('Error checking opt-in status:', e)
      }
    }

    if (destinationTokenType == 'eth' && store.state.destinationToken) {
      store.state.loadingDestinationAddressBalance = true
      const balance = await getEthAccountTokenBalance(store.state.destinationChain, store.state.destinationAddress, store.state.destinationToken)
      if (balance !== null) {
        store.state.destinationAddressBalance = balance.toString()
        store.state.loadingDestinationAddressBalance = false
        logger.debug('onDestinationAddressChange.balance', store.state.destinationAddressBalance, store.state.destinationChain, store.state.destinationAddress, store.state.destinationToken)
      }
    }

    // Check bridge balance if bridge address exists
    if (store.state.destinationBridgeAddress) {
      try {
        store.state.loadingDestinationEscrowAddressBalance = true
        let bridgeBalance

        if (destinationTokenType == 'algo') {
          bridgeBalance = await getAlgoAccountTokenBalance(store.state.destinationChain, store.state.destinationBridgeAddress!, Number(store.state.destinationToken))
        } else if (destinationTokenType == 'eth' && store.state.destinationToken) {
          bridgeBalance = await getEthAccountTokenBalance(store.state.destinationChain, store.state.destinationBridgeAddress!, store.state.destinationToken)
        }

        if (bridgeBalance) {
          store.state.destinationBridgeBalance = bridgeBalance.toFixed(0, 1)
        } else {
          store.state.destinationBridgeBalance = '0'
        }
        store.state.loadingDestinationEscrowAddressBalance = false
      } catch (e: any) {
        store.state.destinationBridgeBalance = '0'
        store.state.loadingDestinationEscrowAddressBalance = false
        logger.error('Error fetching bridge balance:', e)
        toast.add({
          severity: 'error',
          detail: e.message,
          life: 3000
        })
      }
    }
  } catch (e: any) {
    store.state.loadingDestinationAddressBalance = false
    store.state.destinationAddressBalance = '0'
    logger.error(e)
    toast.add({
      severity: 'error',
      detail: e.message,
      life: 3000
    })
    return false
  }
}

// Debounced version to prevent excessive RPC calls
const debouncedOnDestinationAddressChange = debounce(onDestinationAddressChange, 300)

watch(
  () => store.state.destinationAddress,
  () => {
    debouncedOnDestinationAddressChange()
  }
)

watch(
  () => store.state.destinationBridgeAddress,
  () => {
    debouncedOnDestinationAddressChange()
  }
)
watch(
  () => store.state.destinationToken,
  () => {
    debouncedOnDestinationAddressChange()
  }
)
</script>
<template>
  <div>
    <SimpleLabel>{{ t('address.destination') }}</SimpleLabel>
    <RoundButton
      v-if="store.state.destinationTokenConfiguration"
      :img="`logos/tokens/${store.state.destinationTokenConfiguration?.logo}.png`"
      :text="store.state.destinationTokenConfiguration.name"
      v-tooltip.top="formatTooltip(t('wallet.tooltipDestination'))"
      @click="buttonClick"
    >
      <img alt="wallet" loading="lazy" width="20" height="20" decoding="async" data-nimg="1" class="3xl:w-14 3xl:h-14" :src="getImageUrl()" style="color: transparent" />
      <div class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate" v-if="state.connected">
        <WalletAddress :address="store.state.destinationAddress"></WalletAddress>
      </div>
      <div class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate" v-else>{{ t('wallet.selectDestAddress') }}</div>
    </RoundButton>
    <SelectDestinationWalletDialog></SelectDestinationWalletDialog>
    <SelectDestinationWalletAlgoDialog v-if="store.state.destinationChainConfiguration?.type == 'algo'"></SelectDestinationWalletAlgoDialog>
  </div>
</template>
