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
import { onMounted, onUnmounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectDestinationWalletDialog from './dialogs/SelectDestinationWalletDialog.vue'
import RoundButton from './ui/RoundButton.vue'
import WalletAddress from './ui/WalletAddress.vue'
import { formatTooltip } from '@/scripts/common/formatTooltip'
import debounce from '@/scripts/common/debounce'
import logger from '@/scripts/common/conditionalLogger'
import TIMEOUTS from '@/config/timeouts'

const { t } = useI18n()
const store = useAppStore()
const toast = useToast()
const { setActiveNetwork, avmActiveWallet, activeAccount } = useWallet()

// Request ID counter for balance fetching race condition prevention
let currentRequestId = 0

// Store watcher stop functions for cleanup
const stopWatchers: Array<() => void> = []

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

stopWatchers.push(watch(
  () => store.state.destinationAddress,
  () => {
    fillInState()
  }
))
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

        // Event-driven connection check with timeout (fixes busy-wait regression)
        const checkConnection = async (): Promise<boolean> => {
          return new Promise((resolve) => {
            // Set up timeout
            const timeoutId = setTimeout(() => {
              unwatch()
              logger.debug('Wallet connection timeout after 30s')
              toast.add({
                severity: 'warn',
                summary: t('wallet.connectionTimeout'),
                detail: t('wallet.connectionTimeoutDetail'),
                life: 5000
              })
              resolve(false)
            }, TIMEOUTS.WALLET_CONNECTION)

            // Watch for connection - reactive, not polling
            const unwatch = watch([isConnected, address], ([conn, addr]) => {
              if (conn && addr) {
                clearTimeout(timeoutId)
                unwatch()
                store.state.connectedDestinationChain = store.state.destinationChain
                store.state.destinationAddress = addr
                resolve(true)
              }
            }, { immediate: true })
          })
        }

        await checkConnection()
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
  // FIX: Increment request ID before any async work to track this request
  const requestId = ++currentRequestId
  logger.debug(`Starting destination balance fetch request ${requestId}`)

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

    // Only proceed if this is still the latest request
    if (requestId !== currentRequestId) {
      logger.debug(`Cancelling stale request ${requestId}, current is ${currentRequestId}`)
      return
    }

    logger.debug('destinationTokenType', destinationTokenType)
    logger.debug('destinationTokenConfig', destinationTokenConfig)

    if (destinationTokenType == 'algo') {
      switch (destinationChainName) {
        case 'Voi': {
          if (destinationTokenConfig?.arc200TokenId) {
            // Set loading state only for current request
            if (requestId === currentRequestId) {
              store.state.loadingDestinationAddressBalance = true
            }

            const balance = await getAlgoAccountARC200TokenBalance(
              store.state.destinationChain,
              store.state.destinationAddress,
              Number(destinationTokenConfig?.arc200TokenId),
              Number(store.state.destinationToken)
            )

            // Only update state if this is still the latest request
            if (requestId === currentRequestId) {
              if (balance !== null) {
                store.state.destinationAddressBalance = balance.toString()
                logger.debug(`Request ${requestId}: Updated destination balance to ${store.state.destinationAddressBalance}`)
              }
              store.state.loadingDestinationAddressBalance = false
            } else {
              logger.debug(`Ignoring stale balance response from request ${requestId}, current is ${currentRequestId}`)
            }
          } else {
            // Set loading state only for current request
            if (requestId === currentRequestId) {
              store.state.loadingDestinationAddressBalance = true
            }

            const balance = await getAlgoAccountTokenBalance(store.state.destinationChain, store.state.destinationAddress, Number(store.state.destinationToken))

            // Only update state if this is still the latest request
            if (requestId === currentRequestId) {
              if (balance !== null) {
                store.state.destinationAddressBalance = balance.toString()
                logger.debug(`Request ${requestId}: Updated destination balance to ${store.state.destinationAddressBalance}`)
              }
              store.state.loadingDestinationAddressBalance = false
            } else {
              logger.debug(`Ignoring stale balance response from request ${requestId}, current is ${currentRequestId}`)
            }
          }
          break
        }
        default: {
          // Set loading state only for current request
          if (requestId === currentRequestId) {
            store.state.loadingDestinationAddressBalance = true
          }

          const balance = await getAlgoAccountTokenBalance(store.state.destinationChain, store.state.destinationAddress, Number(store.state.destinationToken))

          // Only update state if this is still the latest request
          if (requestId === currentRequestId) {
            if (balance !== null) {
              store.state.destinationAddressBalance = balance.toString()
              logger.debug(`Request ${requestId}: Updated destination balance to ${store.state.destinationAddressBalance}`)
            }
            store.state.loadingDestinationAddressBalance = false
          } else {
            logger.debug(`Ignoring stale balance response from request ${requestId}, current is ${currentRequestId}`)
          }
        }
      }

      // Check opt-in status for Algorand chains - only if still current request
      if (requestId === currentRequestId) {
        try {
          const optin = await getAlgoAccountTokenOptedIn(store.state.destinationChain, store.state.destinationAddress, Number(store.state.destinationToken))
          if (requestId === currentRequestId) {
            if (optin !== null) {
              store.state.destinationAccountOptedIn = optin
            } else {
              store.state.destinationAccountOptedIn = false
            }
          }
        } catch (e: any) {
          if (requestId === currentRequestId) {
            store.state.destinationAccountOptedIn = false
            logger.error(`Request ${requestId}: Error checking opt-in status:`, e)
          }
        }
      }
    }

    if (destinationTokenType == 'eth' && store.state.destinationToken) {
      // Set loading state only for current request
      if (requestId === currentRequestId) {
        store.state.loadingDestinationAddressBalance = true
      }

      const balance = await getEthAccountTokenBalance(store.state.destinationChain, store.state.destinationAddress, store.state.destinationToken)

      // Only update state if this is still the latest request
      if (requestId === currentRequestId) {
        if (balance !== null) {
          store.state.destinationAddressBalance = balance.toString()
          logger.debug(`Request ${requestId}: Updated destination balance to ${store.state.destinationAddressBalance}`)
        }
        store.state.loadingDestinationAddressBalance = false
      } else {
        logger.debug(`Ignoring stale balance response from request ${requestId}, current is ${currentRequestId}`)
      }
    }

    // Check bridge balance if bridge address exists - only if still current request
    if (store.state.destinationBridgeAddress && requestId === currentRequestId) {
      try {
        if (requestId === currentRequestId) {
          store.state.loadingDestinationEscrowAddressBalance = true
        }

        let bridgeBalance

        if (destinationTokenType == 'algo') {
          bridgeBalance = await getAlgoAccountTokenBalance(store.state.destinationChain, store.state.destinationBridgeAddress!, Number(store.state.destinationToken))
        } else if (destinationTokenType == 'eth' && store.state.destinationToken) {
          bridgeBalance = await getEthAccountTokenBalance(store.state.destinationChain, store.state.destinationBridgeAddress!, store.state.destinationToken)
        }

        // Only update state if this is still the latest request
        if (requestId === currentRequestId) {
          if (bridgeBalance) {
            store.state.destinationBridgeBalance = bridgeBalance.toFixed(0, 1)
          } else {
            store.state.destinationBridgeBalance = '0'
          }
          store.state.loadingDestinationEscrowAddressBalance = false
          logger.debug(`Request ${requestId}: Updated bridge balance to ${store.state.destinationBridgeBalance}`)
        } else {
          logger.debug(`Ignoring stale bridge balance from request ${requestId}, current is ${currentRequestId}`)
        }
      } catch (e: any) {
        if (requestId === currentRequestId) {
          store.state.destinationBridgeBalance = '0'
          store.state.loadingDestinationEscrowAddressBalance = false
          logger.error(`Request ${requestId}: Error fetching bridge balance:`, e)
          toast.add({
            severity: 'error',
            detail: e.message,
            life: 3000
          })
        }
      }
    }
  } catch (e: any) {
    // Only update error state if this is still the latest request
    if (requestId === currentRequestId) {
      store.state.loadingDestinationAddressBalance = false
      store.state.destinationAddressBalance = '0'
      logger.error(`Request ${requestId} failed:`, e)
      toast.add({
        severity: 'error',
        detail: e.message,
        life: 3000
      })
    } else {
      logger.debug(`Ignoring error from stale request ${requestId}, current is ${currentRequestId}`)
    }
    return false
  }
}

// Debounced version to prevent excessive RPC calls
const debouncedOnDestinationAddressChange = debounce(onDestinationAddressChange, 300)

stopWatchers.push(watch(
  () => store.state.destinationAddress,
  () => {
    debouncedOnDestinationAddressChange()
  }
))

stopWatchers.push(watch(
  () => store.state.destinationBridgeAddress,
  () => {
    debouncedOnDestinationAddressChange()
  }
))
stopWatchers.push(watch(
  () => store.state.destinationToken,
  () => {
    debouncedOnDestinationAddressChange()
  }
))

// Cleanup on unmount to prevent memory leaks
onUnmounted(() => {
  stopWatchers.forEach(stop => stop())
  debouncedOnDestinationAddressChange.cancel()
})
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
