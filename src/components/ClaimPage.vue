<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import MainBox from './ui/MainBox.vue'
import WalletAddress from './ui/WalletAddress.vue'
import { onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SimpleLabel from './ui/SimpleLabel.vue'
import validEthTxHash from '@/scripts/eth/validEthTxHash'
import { getClaimTx } from '@/scripts/aramid/getClaimTx'
import { getTxClaimData } from '@/scripts/aramid/getTxClaimData'
import validAlgoTxHash from '@/scripts/algo/validAlgoTxHash'
import CopyIcon from './ui/CopyIcon.vue'
import MainActionButton from './ui/MainActionButton.vue'
import { useToast } from 'primevue/usetoast'
import getWeb3Modal from '@/scripts/eth/getWeb3Modal'
import { useSwitchNetwork, useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/vue'
import FireworksEffect from './ui/FireworksEffect.vue'
import ShortTx from './ui/ShortTx.vue'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { executeEthRedeemTx } from '@/scripts/eth/executeEthRedeemTx'
import { fillInStateFromClaimData } from '@/scripts/events/fillInStateFromClaimData'
import { resetStateSoft } from '@/scripts/common/resetStateSoft'
import logger from '@/scripts/common/conditionalLogger'
import { sanitizeInput, isValidTxHash } from '@/utils/sanitize'
const toast = useToast()
const router = useRouter()
const store = useAppStore()
const state = reactive({
  inputTx: '',
  fromRoute: false,
  isSearching: false,
  claimed: false,
  resultTx: '',
  claiming: false,
  claimErrorMessage: ''
})

const modal = getWeb3Modal()
const { chainId } = useWeb3ModalAccount()
const web3ModalProvider = useWeb3ModalProvider()

const setIsSearching = (val: boolean) => {
  state.isSearching = val
}
const setClaimErrorMessage = (val: string) => {
  state.claimErrorMessage = val
}

const searchForTx = async (searchTxHash: string) => {
  logger.debug('searching for eth tx: 1', searchTxHash)

  // Sanitize input to prevent XSS attacks
  const sanitizedTxHash = sanitizeInput(searchTxHash, 100)

  // Clear previous errors when starting a new search
  setClaimErrorMessage('')
  setIsSearching(true)

  try {
    if (validAlgoTxHash(sanitizedTxHash)) {
      logger.debug('validAlgoTxHash:', sanitizedTxHash)
      const claimTx = await getClaimTx(sanitizedTxHash)
      logger.debug('claimTx', claimTx)
      if (claimTx) {
        const claimData = await getTxClaimData(claimTx)
        logger.debug('claimData', claimData)

        if (claimData) {
          await fillInStateFromClaimData(claimData)
        }
      } else {
        setClaimErrorMessage('Transaction not found in the indexer.')
      }
      setIsSearching(false)
    } else if (validEthTxHash(sanitizedTxHash)) {
      logger.debug('validEthTxHash:', sanitizedTxHash)
      try {
        const res = await getClaimTx(sanitizedTxHash)
        logger.debug('claim tx:', res)
        if (!res) {
          setClaimErrorMessage('Transaction not found in the indexer.')
          setIsSearching(false)
          return
        }
        const data = await getTxClaimData(res)
        if (data) {
          logger.debug('claimData', data)
          await fillInStateFromClaimData(data)
          store.state.claimData = data
        }
        setIsSearching(false)
      } catch (error: any) {
        logger.error('Error searching for transaction:', error)
        setClaimErrorMessage(error.message || 'Failed to search for transaction. Please try again.')
        setIsSearching(false)
      }
    } else if (sanitizedTxHash) {
      setClaimErrorMessage('Invalid transaction hash format.')
      setIsSearching(false)
    } else {
      setIsSearching(false)
    }
  } catch (error: any) {
    logger.error('Error during transaction search:', error)
    setClaimErrorMessage(error.message || 'An unexpected error occurred. Please try again.')
    setIsSearching(false)
  }
}
onMounted(async () => {
  const route = useRoute()
  state.inputTx = route.params['sourceTxId'] as string
  state.fromRoute = !!state.inputTx

  await getPublicConfiguration(true)

  if (state.inputTx) {
    searchForTx(state.inputTx)
  }
})

const getSourceChainImageUrl = () => {
  const ret = new URL(`../assets/logos/chains/${store.state.sourceChainConfiguration?.logo}.png`, import.meta.url)
  return ret.toString()
}
const getDestinationChainImageUrl = () => {
  const ret = new URL(`../assets/logos/chains/${store.state.destinationChainConfiguration?.logo}.png`, import.meta.url)
  return ret.toString()
}

const claimButtonClick = async () => {
  try {
    state.claiming = true

    const { switchNetwork } = useSwitchNetwork()
    if (!web3ModalProvider.walletProvider.value) {
      await modal?.open()
    }
    if (!web3ModalProvider.walletProvider.value) {
      throw Error(`Please connect ${store.state.destinationChainConfiguration?.name} in your wallet`)
    }

    if (store.state.destinationChain) {
      logger.debug('chainId.value ? store.state.destinationChain', chainId.value, store.state.destinationChain)
      if (chainId.value != store.state.destinationChain) {
        //provider.open()
        toast.add({
          severity: 'warn',
          detail: `Please switch to ${store.state.destinationChainConfiguration?.name} in your wallet, and claim again`,
          life: 10000
        })
        logger.debug('switching network to', store.state.destinationChain)
        state.claiming = false
        await switchNetwork(store.state.destinationChain)
        logger.debug('after switching network to', store.state.destinationChain)
        //return
      }
    }
    const releaseInfo = await executeEthRedeemTx()
    state.resultTx = releaseInfo.hash
    logger.debug('releaseInfo', releaseInfo)
    state.claimed = true
    state.claiming = false
  } catch (e: any) {
    state.claiming = false
    logger.error(e)
    if ((e.message as string).indexOf('Transaction ID already processed') > 0) {
      state.claimed = true
      return
    }
    logger.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 10000
    })
  }
}

const resetButtonClick = async () => {
  resetStateSoft()
  await router.push('/')
}
</script>

<template>
  <MainBox>
    <div class="w-[80vw] md:w-full flex flex-col gap-4 items-center mb-4">
      <div class="font-bold text-xl">Claim EVM transaction</div>

      <div v-if="!store.state.claimData?.maxClaimRound" class="w-full">
        <SimpleLabel>Source chain TXN ID</SimpleLabel>
        <input
          :disabled="state.fromRoute"
          :maxlength="50"
          class="bg-bg-elevated rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 w-full mt-1 3xl:mt-3 4xl:mt-6 p-1 3xl:p-3 4xl:p-6 text-base w-full p-3"
          type="text"
          v-model="state.inputTx"
        />

        <!-- Loading spinner during search -->
        <div v-if="state.isSearching" class="mt-4 text-center" role="status" aria-live="polite">
          <span class="sr-only">Searching for transaction...</span>
          <div class="inline-flex items-center gap-2 text-accent font-medium">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Searching for transaction in the indexer... This usually takes 2-5 seconds.</span>
          </div>
        </div>

        <!-- Error message display -->
        <div v-if="state.claimErrorMessage && !state.isSearching" class="mt-4 p-4 rounded-lg border border-red-500 bg-red-500/10" role="alert" aria-live="assertive">
          <div class="flex items-start gap-3">
            <svg class="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div class="flex-1">
              <h3 class="font-semibold text-red-500">Transaction Not Found</h3>
              <p class="text-sm text-red-400 mt-1">{{ state.claimErrorMessage }}</p>
              <p class="text-sm text-red-400 mt-2">
                This could mean:
              </p>
              <ul class="text-sm text-red-400 mt-1 list-disc list-inside space-y-1">
                <li>The transaction hasn't been indexed yet (wait a few minutes and try again)</li>
                <li>The transaction ID is incorrect</li>
                <li>The transaction hasn't been bridged yet</li>
              </ul>
              <MainActionButton class="mt-3" @click="() => { state.claimErrorMessage = ''; searchForTx(state.inputTx); }">
                Retry Search
              </MainActionButton>
            </div>
          </div>
        </div>
      </div>

      <div class="text-sm border border-bottom-1 border-subtle border-x-0 w-full pb-8" v-if="store.state.claimData?.maxClaimRound">
        <div class="flex flex-row mt-4">
          <div class="min-w-20">
            <div class="flex flex-col w-12 md:p-1.5 m-1 bg-main border-accent border rounded-full m-auto">
              <img class="m-auto" color="red" id="reverse-button" alt="Source chain image" loading="lazy" width="50" height="50" decoding="async" :src="getSourceChainImageUrl()" />
            </div>
          </div>
          <div class="text-lg font-bold my-2 mr-4">{{ store.state.sourceChainConfiguration?.name }}</div>
          <hr class="h-[1px] my-6 w-full bg-divider border-0 dark:bg-gray-700" />
          <div class="my-3 min-w-32 mx-auto text-center">Source chain</div>
          <hr class="h-[1px] my-6 w-full bg-divider border-0 dark:bg-gray-700" />
        </div>
        <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
          <div class="md:min-w-44 font-bold">Transaction ID</div>
          <div class="w-full block md:hidden">
            <WalletAddress :address="state.inputTx" :length="4"></WalletAddress> <CopyIcon :text="state.inputTx" :title="`Source chain TXN ID: ${state.inputTx}`"></CopyIcon>
          </div>
          <div class="w-full hidden md:block lg:hidden">
            <WalletAddress :address="state.inputTx" :length="6"></WalletAddress> <CopyIcon :text="state.inputTx" :title="`Source chain TXN ID: ${state.inputTx}`"></CopyIcon>
          </div>
          <div class="w-full hidden lg:block">
            <WalletAddress :address="state.inputTx" :length="30"></WalletAddress> <CopyIcon :text="state.inputTx" :title="`Source chain TXN ID: ${state.inputTx}`"></CopyIcon>
          </div>
        </div>
        <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
          <div class="md:min-w-44 font-bold">Origin address</div>
          <div class="w-full block md:hidden">
            <WalletAddress :address="store.state.sourceAddress" :length="4"></WalletAddress>
            <CopyIcon :text="store.state.sourceAddress" :title="`Copy origin address: ${store.state.sourceAddress}`"></CopyIcon>
          </div>
          <div class="w-full hidden md:block lg:hidden">
            <WalletAddress :address="store.state.sourceAddress" :length="6"></WalletAddress>
            <CopyIcon :text="store.state.sourceAddress" :title="`Copy origin address: ${store.state.sourceAddress}`"></CopyIcon>
          </div>
          <div class="w-full hidden lg:block">
            <WalletAddress :address="store.state.sourceAddress" :length="30"></WalletAddress>
            <CopyIcon :text="store.state.sourceAddress" :title="`Copy origin address: ${store.state.sourceAddress}`"></CopyIcon>
          </div>
        </div>
        <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
          <div class="md:min-w-44 font-bold">Amount</div>
          <div class="w-full" :title="`Base amount: ${store.state.sourceAmount}`">{{ store.state.sourceAmountFormatted }}</div>
        </div>
        <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
          <div class="md:min-w-44 font-bold">Token name</div>
          <div class="w-full">{{ store.state.sourceTokenConfiguration?.name }}</div>
        </div>
        <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
          <div class="md:min-w-44 font-bold">Token ID</div>
          <div class="w-full">
            {{ store.state.sourceTokenConfiguration?.tokenId }}
            <CopyIcon :text="store.state.sourceTokenConfiguration?.tokenId" :title="`Copy token ID: ${store.state.sourceTokenConfiguration?.tokenId}`"></CopyIcon>
          </div>
        </div>

        <div class="flex flex-row mt-4">
          <div class="min-w-20">
            <div class="flex flex-col w-12 md:p-1.5 m-1 bg-main border-accent border rounded-full m-auto">
              <img class="m-auto" color="red" id="reverse-button" alt="Destination chain image" loading="lazy" width="50" height="50" decoding="async" :src="getDestinationChainImageUrl()" />
            </div>
          </div>
          <div class="text-lg font-bold my-2 mr-4">{{ store.state.destinationChainConfiguration?.name }}</div>
          <hr class="h-[1px] my-6 w-full bg-divider border-0 dark:bg-gray-700" />
          <div class="my-3 min-w-32 mx-auto text-center">Destination chain</div>
          <hr class="h-[1px] my-6 w-full bg-divider border-0 dark:bg-gray-700" />
        </div>

        <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
          <div class="md:min-w-44 font-bold">Destination address</div>
          <div class="w-full block md:hidden">
            <WalletAddress :address="store.state.destinationAddress" :length="4"></WalletAddress>
            <CopyIcon :text="store.state.destinationAddress" :title="`Copy origin address: ${store.state.destinationAddress}`"></CopyIcon>
          </div>
          <div class="w-full hidden md:block lg:hidden">
            <WalletAddress :address="store.state.destinationAddress" :length="6"></WalletAddress>
            <CopyIcon :text="store.state.destinationAddress" :title="`Copy origin address: ${store.state.destinationAddress}`"></CopyIcon>
          </div>
          <div class="w-full hidden lg:block">
            <WalletAddress :address="store.state.destinationAddress" :length="30"></WalletAddress>
            <CopyIcon :text="store.state.destinationAddress" :title="`Copy origin address: ${store.state.destinationAddress}`"></CopyIcon>
          </div>
        </div>
        <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
          <div class="md:min-w-44 font-bold">Amount to receive</div>
          <div class="w-full" :title="`Base amount: ${store.state.destinationAmount}`">{{ store.state.destinationAmountFormatted }}</div>
        </div>
        <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
          <div class="md:min-w-44 font-bold">Token name</div>
          <div class="w-full">{{ store.state.destinationTokenConfiguration?.name }}</div>
        </div>
        <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
          <div class="md:min-w-44 font-bold">Token ID</div>
          <div class="w-full">
            {{ store.state.destinationTokenConfiguration?.tokenId }}
            <CopyIcon :text="store.state.destinationTokenConfiguration?.tokenId" :title="`Copy token ID: ${store.state.destinationTokenConfiguration?.tokenId}`"></CopyIcon>
          </div>
        </div>

        <div class="flex flex-col md:flex-row mt-2 text-center md:text-left" v-if="store.state.memo && store.state.memo != 'aramid'">
          <div class="md:min-w-44 font-bold">Data transfer</div>
          <div class="w-full">{{ store.state.memo }} <CopyIcon :text="store.state.memo" :title="`Copy origin address: ${store.state.memo}`"></CopyIcon></div>
        </div>
      </div>
      <div v-if="state.claiming">
        <p>Please check your wallet to sign the transaction</p>
        <MainActionButton @click="state.claiming = false">Cancel</MainActionButton>
      </div>
      <div class="w-full" v-else-if="!state.claimed">
        <MainActionButton v-if="chainId == store.state.destinationChain" @click="claimButtonClick">Claim</MainActionButton>
        <MainActionButton v-else-if="store.state.claimData" @click="claimButtonClick">Switch your wallet to {{ store.state.destinationChainConfiguration?.name }}</MainActionButton>
        <div v-else>
          <p class="text-red-100 text-center">It seems that the transaction has not been bridged yet or has been bridged too long time ago</p>
        </div>
      </div>
      <div v-else-if="state.claimed">
        <p>
          Bridging successful! The assets are at the destination account.
          <span v-if="state.resultTx">TXN ID: <ShortTx :txId="state.resultTx" :length="6" :chain="store.state.destinationChain"></ShortTx></span>
        </p>
        <FireworksEffect></FireworksEffect>
        <MainActionButton @click="resetButtonClick">Bridge again</MainActionButton>
      </div>
    </div>
  </MainBox>
</template>
