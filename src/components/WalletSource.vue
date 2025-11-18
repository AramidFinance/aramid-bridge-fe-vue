<script setup lang="ts">
import SimpleLabel from './ui/SimpleLabel.vue'
import SelectSourceWalletAlgoDialog from './dialogs/SelectSourceWalletAlgoDialog.vue'

import { useAppStore } from '@/stores/app'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { onMounted, onUnmounted, reactive, watch } from 'vue'
import RoundButton from './ui/RoundButton.vue'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import { useToast } from 'primevue/usetoast'
import { fillSourceTokenConfiguration } from '@/scripts/events/fillSourceTokenConfiguration'
import getAlgoAccountTokenBalance from '@/scripts/algo/getAlgoAccountTokenBalance'
import getAlgoAccountARC200TokenBalance from '@/scripts/algo/getAlgoAccountARC200TokenBalance'
import { NetworkId, useWallet } from '@txnlab/use-wallet-vue'
import getWeb3Modal from '@/scripts/eth/getWeb3Modal'
import { useDisconnect, useWeb3ModalAccount } from '@web3modal/ethers/vue'
import { useSwitchNetwork } from '@web3modal/ethers/vue'
import asyncdelay from '@/scripts/common/asyncDelay'
import getEthAccountTokenBalance from '@/scripts/eth/getEthAccountTokenBalance'
import WalletAddress from './ui/WalletAddress.vue'
import BigNumber from 'bignumber.js'
import { useI18n } from 'vue-i18n'
import { formatTooltip } from '@/scripts/common/formatTooltip'
import debounce from '@/scripts/common/debounce'
import logger from '@/scripts/common/conditionalLogger'
import TIMEOUTS from '@/config/timeouts'

const { t } = useI18n()
const { setActiveNetwork, activeWallet, activeAccount } = useWallet()

const toast = useToast()
const store = useAppStore()

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
  publicConfiguration: null,
  chain: store.state.sourceChainConfiguration as ChainItem
})

const fillInState = () => {
  try {
    fillSourceTokenConfiguration()
    state.connected = !!store.state.connectedSourceChain && !!store.state.sourceAddress
  } catch (e: any) {
    logger.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 3000
    })
  }
}

const onSourceAddressChange = async () => {
  // FIX: Increment request ID before any async work to track this request
  const requestId = ++currentRequestId
  logger.debug(`Starting balance fetch request ${requestId}`)

  try {
    // refresh balance of source account
    if (!store.state.sourceChain) return
    if (!store.state.sourceChainConfiguration) return
    if (!store.state.sourceAddress) return
    if (!store.state.sourceTokenConfiguration) return

    const sourceChainConfiguration = store.state.sourceChainConfiguration
    const { name: sourceChainName, type: sourceChainType, chainId: sourceChainId } = sourceChainConfiguration
    const sourceTokenConfig = store.state.sourceTokenConfiguration as any
    const { type: sourceTokenType, contractId: sourceTokenContractId, unitAppId: sourceTokenUnitAppId, chainId: sourceTokenChainId } = sourceTokenConfig

    // Only proceed if this is still the latest request
    if (requestId !== currentRequestId) {
      logger.debug(`Cancelling stale request ${requestId}, current is ${currentRequestId}`)
      return
    }

    logger.debug('sourceTokenType', sourceTokenType)
    logger.debug('sourceTokenConfig', sourceTokenConfig)

    if (sourceTokenType == 'algo') {
      switch (sourceChainName) {
        case 'Voi': {
          if (sourceTokenConfig?.arc200TokenId) {
            // Set loading state only for current request
            if (requestId === currentRequestId) {
              store.state.loadingSourceAddressBalance = true
            }

            const balance = await getAlgoAccountARC200TokenBalance(store.state.sourceChain, store.state.sourceAddress, Number(sourceTokenConfig?.arc200TokenId), Number(store.state.sourceToken))

            // Only update state if this is still the latest request
            if (requestId === currentRequestId) {
              if (balance !== null) {
                store.state.sourceAddressBalance = balance.toString()
                logger.debug(`Request ${requestId}: Updated balance to ${store.state.sourceAddressBalance}`)
              }
              store.state.loadingSourceAddressBalance = false
            } else {
              logger.debug(`Ignoring stale balance response from request ${requestId}, current is ${currentRequestId}`)
            }
          } else {
            // Set loading state only for current request
            if (requestId === currentRequestId) {
              store.state.loadingSourceAddressBalance = true
            }

            const balance = await getAlgoAccountTokenBalance(store.state.sourceChain, store.state.sourceAddress, Number(store.state.sourceToken))

            // Only update state if this is still the latest request
            if (requestId === currentRequestId) {
              if (balance !== null) {
                store.state.sourceAddressBalance = balance.toString()
                logger.debug(`Request ${requestId}: Updated balance to ${store.state.sourceAddressBalance}`)
              }
              store.state.loadingSourceAddressBalance = false
            } else {
              logger.debug(`Ignoring stale balance response from request ${requestId}, current is ${currentRequestId}`)
            }
          }
          break
        }
        default: {
          // Set loading state only for current request
          if (requestId === currentRequestId) {
            store.state.loadingSourceAddressBalance = true
          }

          const balance = await getAlgoAccountTokenBalance(store.state.sourceChain, store.state.sourceAddress, Number(store.state.sourceToken))

          // Only update state if this is still the latest request
          if (requestId === currentRequestId) {
            if (balance !== null) {
              store.state.sourceAddressBalance = balance.toString()
              logger.debug(`Request ${requestId}: Updated balance to ${store.state.sourceAddressBalance}`)
            }
            store.state.loadingSourceAddressBalance = false
          } else {
            logger.debug(`Ignoring stale balance response from request ${requestId}, current is ${currentRequestId}`)
          }
        }
      }
    }

    if (store.state.sourceChainConfiguration.type == 'eth' && store.state.sourceToken) {
      // Set loading state only for current request
      if (requestId === currentRequestId) {
        store.state.loadingSourceAddressBalance = true
      }

      const balance = await getEthAccountTokenBalance(store.state.sourceChain, store.state.sourceAddress, store.state.sourceToken)

      // Only update state if this is still the latest request
      if (requestId === currentRequestId) {
        if (balance !== null) {
          store.state.sourceAddressBalance = balance.toString()
          logger.debug(`Request ${requestId}: Updated balance to ${store.state.sourceAddressBalance}`)
        }
        store.state.loadingSourceAddressBalance = false
      } else {
        logger.debug(`Ignoring stale balance response from request ${requestId}, current is ${currentRequestId}`)
      }
    }
  } catch (e: any) {
    // Only update error state if this is still the latest request
    if (requestId === currentRequestId) {
      store.state.loadingSourceAddressBalance = false
      store.state.sourceAddressBalance = undefined
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
const debouncedOnSourceAddressChange = debounce(onSourceAddressChange, 300)

onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  fillInState()
  logger.debug('WalletSource.activeAccount.value', activeWallet.value, activeAccount.value)

  if (store.state.sourceChainConfiguration?.type == 'algo' && activeWallet.value && activeAccount.value?.address) {
    store.state.sourceAddress = activeAccount.value?.address
    store.state.sourceAlgoConnectorType = AlgoConnectorType.UseWallet
    store.state.connectedSourceChain = store.state.sourceChain
  }
  if (store.state.sourceAddress) {
    onSourceAddressChange()
  }
})

stopWatchers.push(watch(
  () => store.state.sourceChain,
  () => {
    fillInState()
    debouncedOnSourceAddressChange()
  }
))
stopWatchers.push(watch(
  () => store.state.sourceAddress,
  () => {
    fillInState()
    debouncedOnSourceAddressChange()
  }
))

stopWatchers.push(watch(
  () => store.state.sourceChainConfiguration,
  () => {
    fillInState()
    if (store.state.sourceChainConfiguration?.type == 'algo') {
      logger.debug('setActiveNetwork', store.state.sourceChainConfiguration.name)
      switch (store.state.sourceChainConfiguration.name) {
        case 'Algorand':
          setActiveNetwork(NetworkId.MAINNET)
          break
        case 'Testnet':
          setActiveNetwork(NetworkId.TESTNET)
          break
        case 'AramidChain':
          setActiveNetwork(NetworkId.ARAMIDMAIN)
          break
        case 'Voi':
          setActiveNetwork(NetworkId.VOIMAIN)
          break
      }
    }
  }
))

stopWatchers.push(watch(
  () => store.state.connectedSourceChain,
  () => {
    fillInState()
    debouncedOnSourceAddressChange()
  }
))
stopWatchers.push(watch(
  () => store.state.sourceToken,
  () => {
    debouncedOnSourceAddressChange()
  }
))

// Cleanup on unmount to prevent memory leaks
onUnmounted(() => {
  stopWatchers.forEach(stop => stop())
  debouncedOnSourceAddressChange.cancel()
})
const buttonClick = async () => {
  if (store.state.sourceChainConfiguration?.type == 'algo') {
    if (state.connected) {
      // disconnect
      switch (store.state.sourceAlgoConnectorType) {
        case AlgoConnectorType.QRCode:
          store.state.connectedSourceChain = undefined
          store.state.sourceAddress = ''
          break
        case AlgoConnectorType.UseWallet:
          store.state.connectedSourceChain = undefined
          store.state.sourceAddress = ''
          try {
            activeWallet.value?.disconnect()
          } catch (e: any) {
            logger.error(e)
            toast.add({
              severity: 'error',
              detail: e.message ?? e,
              life: 3000
            })
          }
          break
      }
    } else {
      store.state.dialogSelectSourceWalletIsOpen = true
    }
  }
  if (store.state.sourceChainConfiguration?.type == 'eth') {
    if (state.connected) {
      // disconnect
      //await modal?.close()
      const { disconnect } = useDisconnect()
      disconnect()

      store.state.connectedSourceChain = undefined
      store.state.sourceAddress = ''
    } else {
      const modal = getWeb3Modal()
      const { address, chainId, isConnected } = useWeb3ModalAccount()
      if (store.state.sourceChain && chainId.value != store.state.sourceChain) {
        const { switchNetwork } = useSwitchNetwork()
        switchNetwork(store.state.sourceChain)
        await asyncdelay(500)
      }

      logger.debug('0x1 address is ', isConnected.value, address.value, new Date())
      if (isConnected.value && address.value) {
        store.state.connectedSourceChain = store.state.sourceChain
        store.state.sourceAddress = address.value
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
                store.state.connectedSourceChain = store.state.sourceChain
                store.state.sourceAddress = addr
                resolve(true)
              }
            }, { immediate: true })
          })
        }

        await checkConnection()
      }

      //if (!address) {
      // await modal?.open({ view: 'Account' })
      // address = await modal?.getAddress()
      // //logger.debug('address after open is ', address)
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
    <SimpleLabel>{{ t('wallet.originWallet') }}</SimpleLabel>
    <RoundButton
      v-tooltip.top="formatTooltip(t('wallet.tooltipOrigin'))"
      v-if="store.state.sourceTokenConfiguration"
      :img="`logos/tokens/${store.state.sourceTokenConfiguration?.logo}.png`"
      :text="store.state.sourceTokenConfiguration.name"
      @click="buttonClick"
    >
      <img alt="wallet" loading="lazy" width="20" height="20" decoding="async" data-nimg="1" class="3xl:w-14 3xl:h-14" :src="getImageUrl()" style="color: transparent" />
      <div
        class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate"
        v-if="store.state.sourceChainConfiguration?.type == 'algo' && store.state.sourceAlgoConnectorType == AlgoConnectorType.QRCode"
      >
        QR Code
      </div>

      <div class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate" v-else-if="state.connected">
        <WalletAddress :address="store.state.sourceAddress"></WalletAddress>
      </div>
      <div class="mx-auto self-center text-[14px] font-bold text-center 3xl:text-xl 4xl:text-2xl truncate" v-else>{{ t('wallet.connectOrigin') }}</div>
    </RoundButton>
    <SelectSourceWalletAlgoDialog v-if="store.state.sourceChainConfiguration?.type == 'algo'"></SelectSourceWalletAlgoDialog>
  </div>
</template>
