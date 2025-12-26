<script setup lang="ts">
import validAlgoTxHash from '@/scripts/algo/validAlgoTxHash'
import { getClaimTx } from '@/scripts/aramid/getClaimTx'
import { getTxClaimData } from '@/scripts/aramid/getTxClaimData'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { resetStateSoft } from '@/scripts/common/resetStateSoft'
import { executeEthRedeemTx } from '@/scripts/eth/executeEthRedeemTx'
import getWeb3Modal from '@/scripts/eth/getWeb3Modal'
import validEthTxHash from '@/scripts/eth/validEthTxHash'
import { fillInStateFromClaimData } from '@/scripts/events/fillInStateFromClaimData'
import { useAppStore } from '@/stores/app'
import { useSwitchNetwork, useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/vue'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CopyIcon from './ui/CopyIcon.vue'
import FireworksEffect from './ui/FireworksEffect.vue'
import MainActionButton from './ui/MainActionButton.vue'
import MainBox from './ui/MainBox.vue'
import ShortTx from './ui/ShortTx.vue'
import SimpleLabel from './ui/SimpleLabel.vue'
import WalletAddress from './ui/WalletAddress.vue'
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
  console.log('searching for eth tx: 1', searchTxHash)
  //TODO: have to change with respect to near chain
  // validTxHash not working because of near tx hash on index 1
  // if (validEthTxHash(searchTxHash) || validAlgoTxHash(searchTxHash)) {
  //   console.log('searching for eth tx: 2', searchTxHash);

  //   resetDefaultState();
  // } else {
  //   console.log('searching for eth tx: 3', searchTxHash);

  // }
  setIsSearching(true)
  if (validAlgoTxHash(searchTxHash)) {
    console.log('validAlgoTxHash:', searchTxHash)
    setIsSearching(true)
    const claimTx = await getClaimTx(searchTxHash)
    console.log('claimTx', claimTx)
    if (claimTx) {
      const claimData = await getTxClaimData(claimTx)
      console.log('claimData', claimData)

      if (claimData) {
        await fillInStateFromClaimData(claimData)
      }
      setIsSearching(false)
    }
    setIsSearching(false)
  } else if (validEthTxHash(searchTxHash)) {
    console.log('validEthTxHash:', searchTxHash)
    setIsSearching(true)
    getClaimTx(searchTxHash).then((res: string | undefined) => {
      console.log('claim tx:', res)
      if (!res) {
        setClaimErrorMessage('Transaction not found.')
        setIsSearching(false)
        return
      }
      getTxClaimData(res).then(async (data) => {
        if (data) {
          console.log('claimData', data)
          await fillInStateFromClaimData(data)
          store.state.claimData = data
        }
        setIsSearching(false)
      })
    })
  } else if (searchTxHash) {
    // // this condition handles near search hash
    // setIsSearching(true)
    // // const claimTimer = setInterval((_, ms: any): any => {
    // getClaimTx(searchTxHash).then((res) => {
    //   if (!res) {
    //     setClaimErrorMessage('Transaction not found.')
    //     setIsSearching(false)
    //     return
    //   }
    //   getTxClaimData(res).then((data) => {
    //     appData.claimDataTxHash = res
    //     appData.claimData = data
    //     if (!appData.destinationChainConfiguration) appData.destinationChainConfiguration = appData.chainConfigs[data.destinationChainData.chainId]
    //     appData.transferApproved = true
    //     appData.assetLocked = true
    //     appData.destinationChainConfiguration = appData.chainConfigs[data.destinationChainData.chainId]
    //     appData.isClaimTabOpen = true
    //     appData.isReviewTabOpen = false
    //     appData.setAppData(appData)
    //   })
    //   setIsSearching(false)
    // })
    // console.log('searching for eth tx:', searchTxHash, isSearching)
    // }, 4000);
    // return (): any => {
    //   clearInterval(claimTimer);
    // };
  }
  setIsSearching(false)
}
onMounted(async () => {
  const route = useRoute()
  state.inputTx = route.params['sourceTxId'] as string
  state.fromRoute = !!state.inputTx

  await getPublicConfiguration(true)

  if (state.inputTx) {
    searchForTx(state.inputTx)
  }

  //console.log('modal', modal)
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
      //console.log('modal', modal)
      await modal?.open()
    }
    if (!web3ModalProvider.walletProvider.value) {
      throw Error(`Please connect ${store.state.destinationChainConfiguration?.name} in your wallet`)
    }

    if (store.state.destinationChain) {
      console.log('chainId.value ? store.state.destinationChain', chainId.value, store.state.destinationChain)
      if (chainId.value != store.state.destinationChain) {
        //provider.open()
        toast.add({
          severity: 'warn',
          detail: `Please switch to ${store.state.destinationChainConfiguration?.name} in your wallet, and claim again`,
          life: 10000
        })
        console.log('switching network to', store.state.destinationChain)
        state.claiming = false
        await switchNetwork(store.state.destinationChain)
        console.log('after switching network to', store.state.destinationChain)
        //return
      }
    }
    const releaseInfo = await executeEthRedeemTx()
    state.resultTx = releaseInfo.hash
    console.log('releaseInfo', releaseInfo)
    state.claimed = true
    state.claiming = false
  } catch (e: any) {
    state.claiming = false
    console.error(e)
    if ((e.message as string).indexOf('Transaction ID already processed') > 0) {
      state.claimed = true
      return
    }
    console.error(e)
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
          class="bg-white-rgba rounded-[10px] focus:outline-none w-full mt-1 3xl:mt-3 4xl:mt-6 p-1 3xl:p-3 4xl:p-6 text-base w-full p-3"
          type="text"
          v-model="state.inputTx"
        />
      </div>

      <div class="text-sm border border-bottom-1 border-[#F6F6F61A] border-x-0 w-full pb-8" v-if="store.state.claimData?.maxClaimRound">
        <div class="flex flex-row mt-4">
          <div class="min-w-20">
            <div class="flex flex-col w-12 md:p-1.5 m-1 bg-[#15002E] border-[#FB7EFF99] border rounded-full m-auto">
              <img class="m-auto" color="red" id="reverse-button" alt="Source chain image" loading="lazy" width="50" height="50" decoding="async" :src="getSourceChainImageUrl()" />
            </div>
          </div>
          <div class="text-lg font-bold my-2 mr-4">{{ store.state.sourceChainConfiguration?.name }}</div>
          <hr class="h-[1px] my-6 w-full bg-[#F6F6F629] border-0 dark:bg-gray-700" />
          <div class="my-3 min-w-32 mx-auto text-center">Source chain</div>
          <hr class="h-[1px] my-6 w-full bg-[#F6F6F629] border-0 dark:bg-gray-700" />
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
            <div class="flex flex-col w-12 md:p-1.5 m-1 bg-[#15002E] border-[#FB7EFF99] border rounded-full m-auto">
              <img class="m-auto" color="red" id="reverse-button" alt="Destination chain image" loading="lazy" width="50" height="50" decoding="async" :src="getDestinationChainImageUrl()" />
            </div>
          </div>
          <div class="text-lg font-bold my-2 mr-4">{{ store.state.destinationChainConfiguration?.name }}</div>
          <hr class="h-[1px] my-6 w-full bg-[#F6F6F629] border-0 dark:bg-gray-700" />
          <div class="my-3 min-w-32 mx-auto text-center">Destination chain</div>
          <hr class="h-[1px] my-6 w-full bg-[#F6F6F629] border-0 dark:bg-gray-700" />
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
