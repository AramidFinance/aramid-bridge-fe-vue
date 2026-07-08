CopyIcon
<script setup lang="ts">
import loader from '@/assets/images/loading-buffering.gif'
import { executeEthApproveTx } from '@/scripts/eth/executeEthApproveTx'
import { executeEthLockNativeTx } from '@/scripts/eth/executeEthLockNativeTx'
import { executeEthLockTokensTx } from '@/scripts/eth/executeEthLockTokensTx'
import getAppKit, { getAppKitNetworkByChainId } from '@/scripts/eth/getAppKit'
import { useAppStore } from '@/stores/app'
import { useAppKitNetwork, useAppKitProvider } from '@reown/appkit/vue'
import type { Eip1193Provider } from 'ethers'
import base64url from 'base64url'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import StatusBar from './status/StatusBar.vue'
import CopyIcon from './ui/CopyIcon.vue'
import MainActionButton from './ui/MainActionButton.vue'
import MainBox from './ui/MainBox.vue'
import ShortTx from './ui/ShortTx.vue'
import WalletAddress from './ui/WalletAddress.vue'
const store = useAppStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()

const state = reactive({
  switchingNetwork: false,
  inApproval: false,
  inApprovalMinting: false,
  approvalHash: '',
  approved: false,
  inSign: false,
  inSignMinting: false,
  signHash: ''
})

const modal = getAppKit()
const network = useAppKitNetwork()
const appKitProvider = useAppKitProvider<Eip1193Provider>('eip155')

const getSourceChainImageUrl = () => {
  const ret = new URL(`../assets/logos/chains/${store.state.sourceChainConfiguration?.logo}.png`, import.meta.url)
  return ret.toString()
}
const getDestinationChainImageUrl = () => {
  const ret = new URL(`../assets/logos/chains/${store.state.destinationChainConfiguration?.logo}.png`, import.meta.url)
  return ret.toString()
}

const routeToBridgeScreen = () => {
  console.log('route', route)
  if (route.name == 'review-sc-dc-st-dt-sa-da-a-n') {
    router.push({ name: 'bridge-sc-dc-st-dt-sa-da-a-n' })
  }
}

onMounted(() => {
  if (!store.state.publicConfiguration || !store.state.sourceAmount) {
    // route back to bridge screen
    routeToBridgeScreen()
  }
  store.state.bridgeTx = undefined
  store.state.claimTx = undefined
  if (!store.state.memo) store.state.memo = 'aramid'
})

const signButtonClick = async () => {
  try {
    if (!store.state.sourceChainConfiguration) throw Error('store.state.sourceChainConfiguration is missing')

    await router.push({
      name: 'sign-n',
      params: {
        sourceChain: store.state.sourceChainConfiguration.name,
        destinationChain: store.state.destinationChainConfiguration?.name,
        sourceToken: store.state.sourceTokenConfiguration?.name,
        destinationToken: store.state.destinationTokenConfiguration?.name,
        sourceAmount: store.state.sourceAmount,
        note: base64url(store.state.memo ?? 'aramid-fe-2'),
        sourceAddress: store.state.sourceAddress,
        destinationAddress: store.state.destinationAddress
      }
    })
  } catch (e: any) {
    console.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 10000
    })
  }
}
const switchNetworkClick = async () => {
  try {
    if (!appKitProvider.walletProvider) {
      //console.log('modal', modal)
      await modal?.open()
    }
    if (!appKitProvider.walletProvider) {
      throw Error(`Please connect ${store.state.sourceChainConfiguration?.name} in your wallet`)
    }

    if (store.state.sourceChain) {
      //console.log('network.value.chainId ? store.state.sourceChain', network.value.chainId, store.state.sourceChain)
      if (network.value.chainId != store.state.sourceChain) {
        const targetNetwork = getAppKitNetworkByChainId(store.state.sourceChain)
        if (targetNetwork) {
          //provider.open()
          toast.add({
            severity: 'warn',
            detail: `Please switch to ${store.state.sourceChainConfiguration?.name} in your wallet`,
            life: 10000
          })
          state.switchingNetwork = true
          await network.value.switchNetwork(targetNetwork)

          state.switchingNetwork = false
        }
      }
    }
  } catch (e: any) {
    state.switchingNetwork = false
    console.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 10000
    })
  }
}
const approveButtonClick = async () => {
  try {
    if (!store.state.sourceChainConfiguration) throw Error('store.state.sourceChainConfiguration is missing')
    state.inApproval = true
    if (!appKitProvider.walletProvider) {
      //console.log('modal', modal)
      await modal?.open({ view: 'Account' })
    }
    if (!appKitProvider.walletProvider) {
      throw Error(`Please connect ${store.state.sourceChainConfiguration?.name} in your wallet`)
    }

    const approveInfo = await executeEthApproveTx()
    //console.log('approveInfo', approveInfo)
    state.approvalHash = approveInfo.hash
    state.inApproval = false
    state.inApprovalMinting = true
    await approveInfo.wait()
    state.inApprovalMinting = false

    if (approveInfo.hash) {
      state.approved = true
    } else {
      return
    }
    await lockButtonClick()
  } catch (e: any) {
    state.inApproval = false
    state.inApprovalMinting = false
    state.inSign = false
    console.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 10000
    })
  }
}

const lockButtonClick = async () => {
  try {
    //console.log('lockButtonClick')
    if (!store.state.sourceChainConfiguration) throw Error('store.state.sourceChainConfiguration is missing')
    state.inSign = true
    const signInfo = await executeEthLockTokensTx()
    state.inSign = false
    state.signHash = signInfo.hash
    state.inSignMinting = true
    //console.log('signInfo', signInfo)
    await signInfo.wait()
    state.inSignMinting = false
    if (signInfo.hash) {
      store.state.bridgeTx = signInfo.hash

      await router.push({
        name: 'bridging',
        params: {
          sourceChain: store.state.sourceChainConfiguration.name,
          destinationChain: store.state.destinationChainConfiguration?.name,
          sourceToken: store.state.sourceTokenConfiguration?.name,
          destinationToken: store.state.destinationTokenConfiguration?.name,
          sourceAmount: store.state.sourceAmount,
          note: base64url(store.state.memo ?? 'aramid-fe-2'),
          sourceAddress: store.state.sourceAddress,
          destinationAddress: store.state.destinationAddress
        }
      })
      return
    }
  } catch (e: any) {
    state.inSign = false
    state.inSignMinting = false
    console.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 10000
    })
  }
}

const payNativeButtonClick = async () => {
  try {
    //console.log('lockButtonClick')
    if (!store.state.sourceChainConfiguration) throw Error('store.state.sourceChainConfiguration is missing')
    state.inSign = true
    const signInfo = await executeEthLockNativeTx()
    state.inSign = false
    state.signHash = signInfo.hash
    state.inSignMinting = true
    //console.log('signInfo', signInfo)
    await signInfo.wait()
    state.inSignMinting = false
    if (signInfo.hash) {
      store.state.bridgeTx = signInfo.hash

      await router.push({
        name: 'bridging',
        params: {
          sourceChain: store.state.sourceChainConfiguration.name,
          destinationChain: store.state.destinationChainConfiguration?.name,
          sourceToken: store.state.sourceTokenConfiguration?.name,
          destinationToken: store.state.destinationTokenConfiguration?.name,
          sourceAmount: store.state.sourceAmount,
          note: base64url(store.state.memo ?? 'aramid-fe-2'),
          sourceAddress: store.state.sourceAddress,
          destinationAddress: store.state.destinationAddress
        }
      })
      return
    }
  } catch (e: any) {
    state.inSign = false
    state.inSignMinting = false
    console.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 10000
    })
  }
}
watch(
  () => network.value.chainId,
  () => {
    if (network.value.chainId == store.state.sourceChain) {
      state.switchingNetwork = false
    }
  }
)
</script>

<template>
  <MainBox v-if="store && store.state && store.state.publicConfiguration && store.state.sourceAmount">
    <div class="w-[80vw] md:w-full flex flex-row gap-4 items-center mb-4">
      <div
        id="edit-button"
        class="px-2 items-center flex backdrop-blur-xl rounded-[80px] place-content-start select-none justify-between opacity-70 font-semibold text-[14px] cursor-pointer"
        style="border: 1px solid rgba(246, 246, 246, 0.16); background: rgba(246, 246, 246, 0.16)"
        @click="routeToBridgeScreen"
      >
        <div class="flex flex-row-reverse items-center">
          <img alt="CaretLeftIcon" loading="lazy" width="20" height="20" decoding="async" src="../assets/images/CaretLeft.svg" style="color: transparent" />
        </div>
        {{ t('common.back') }}
      </div>
      <div class="font-bold text-xl">{{ t('transaction.review') }}</div>
    </div>

    <div class="text-sm border border-bottom-1 border-[#F6F6F61A] border-x-0 w-full pb-8">
      <div class="flex flex-row mt-4">
        <div class="min-w-20">
          <div class="flex flex-col w-12 md:p-1.5 m-1 bg-[#15002E] border-[#FB7EFF99] border rounded-full m-auto">
            <img class="m-auto" color="red" id="reverse-button" alt="Source chain image" loading="lazy" width="50" height="50" decoding="async" :src="getSourceChainImageUrl()" />
          </div>
        </div>
        <div class="text-lg font-bold my-2 mr-4">{{ store.state.sourceChainConfiguration?.name }}</div>
        <hr class="h-[1px] my-6 w-full bg-[#F6F6F629] border-0 dark:bg-gray-700" />
        <div class="my-3 min-w-32 mx-auto text-center">{{ t('chain.source') }}</div>
        <hr class="h-[1px] my-6 w-full bg-[#F6F6F629] border-0 dark:bg-gray-700" />
      </div>
      <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
        <div class="md:min-w-44 font-bold">{{ t('amount.toSend') }}</div>
        <div class="w-full" :title="`Base amount: ${store.state.sourceAmount}`">{{ store.state.sourceAmountFormatted }}</div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
        <div class="md:min-w-44 font-bold">{{ t('asset.tokenName') }}</div>
        <div class="w-full">{{ store.state.sourceTokenConfiguration?.name }}</div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 text-center md:text-left" v-if="store.state.sourceTokenConfiguration?.arc200TokenId">
        <div class="md:min-w-44 font-bold">ARC200 Token ID</div>
        <div class="w-full">
          {{ store.state.sourceTokenConfiguration.arc200TokenId }}
          <CopyIcon
            :text="store.state.sourceTokenConfiguration.arc200TokenId.toString()"
            :title="t('address.copyToken', { tokenId: store.state.sourceTokenConfiguration.arc200TokenId.toString() })"
          ></CopyIcon>
        </div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
        <div class="md:min-w-44 font-bold">{{ t('asset.tokenId') }}</div>
        <div class="w-full">
          {{ store.state.sourceTokenConfiguration?.tokenId }}
          <CopyIcon :text="store.state.sourceTokenConfiguration?.tokenId" :title="t('address.copyToken', { tokenId: store.state.sourceTokenConfiguration?.tokenId })"></CopyIcon>
        </div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
        <div class="md:min-w-44 font-bold">{{ t('address.origin') }}</div>
        <div class="w-full block md:hidden">
          <WalletAddress :address="store.state.sourceAddress" :length="4"></WalletAddress>
          <CopyIcon :text="store.state.sourceAddress" :title="t('address.copyOrigin', { address: store.state.sourceAddress })"></CopyIcon>
        </div>
        <div class="w-full hidden md:block lg:hidden">
          <WalletAddress :address="store.state.sourceAddress" :length="6"></WalletAddress>
          <CopyIcon :text="store.state.sourceAddress" :title="t('address.copyOrigin', { address: store.state.sourceAddress })"></CopyIcon>
        </div>
        <div class="w-full hidden lg:block">
          <WalletAddress :address="store.state.sourceAddress" :length="30"></WalletAddress>
          <CopyIcon :text="store.state.sourceAddress" :title="t('address.copyOrigin', { address: store.state.sourceAddress })"></CopyIcon>
        </div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
        <div class="md:min-w-44 font-bold">{{ t('address.bridge') }}</div>
        <div class="w-full block md:hidden">
          <WalletAddress :address="store.state.sourceBridgeAddress" :length="4"></WalletAddress>
          <CopyIcon :text="store.state.sourceBridgeAddress" :title="t('address.copyBridgeSource', { address: store.state.sourceBridgeAddress })"></CopyIcon>
        </div>
        <div class="w-full hidden md:block lg:hidden">
          <WalletAddress :address="store.state.sourceBridgeAddress" :length="6"></WalletAddress>
          <CopyIcon :text="store.state.sourceBridgeAddress" :title="t('address.copyBridgeSource', { address: store.state.sourceBridgeAddress })"></CopyIcon>
        </div>
        <div class="w-full hidden lg:block">
          <WalletAddress :address="store.state.sourceBridgeAddress" :length="30"></WalletAddress>
          <CopyIcon :text="store.state.sourceBridgeAddress" :title="t('address.copyBridgeSource', { address: store.state.sourceBridgeAddress })"></CopyIcon>
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
        <div class="my-3 min-w-32 mx-auto text-center">{{ t('chain.destination') }}</div>
        <hr class="h-[1px] my-6 w-full bg-[#F6F6F629] border-0 dark:bg-gray-700" />
      </div>

      <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
        <div class="md:min-w-44 font-bold">{{ t('amount.toReceive') }}</div>
        <div class="w-full" :title="`Base amount: ${store.state.destinationAmount}`">{{ store.state.destinationAmountFormatted }}</div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
        <div class="md:min-w-44 font-bold">{{ t('asset.tokenName') }}</div>
        <div class="w-full">{{ store.state.destinationTokenConfiguration?.name }}</div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
        <div class="md:min-w-44 font-bold">{{ t('asset.tokenId') }}</div>
        <div class="w-full">
          {{ store.state.destinationTokenConfiguration?.tokenId }}
          <CopyIcon :text="store.state.destinationTokenConfiguration?.tokenId" :title="t('address.copyToken', { tokenId: store.state.destinationTokenConfiguration?.tokenId })"></CopyIcon>
        </div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 text-center md:text-left" v-if="store.state.destinationTokenConfiguration?.arc200TokenId">
        <div class="md:min-w-44 font-bold">ARC200 Token ID</div>
        <div class="w-full">
          {{ store.state.destinationTokenConfiguration.arc200TokenId }}
          <CopyIcon
            :text="store.state.destinationTokenConfiguration.arc200TokenId.toString()"
            :title="t('address.copyToken', { tokenId: store.state.destinationTokenConfiguration.arc200TokenId.toString() })"
          ></CopyIcon>
        </div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
        <div class="md:min-w-44 font-bold">{{ t('address.destination') }}</div>
        <div class="w-full block md:hidden">
          <WalletAddress :address="store.state.destinationAddress" :length="4"></WalletAddress>
          <CopyIcon :text="store.state.destinationAddress" :title="t('address.copyDestination', { address: store.state.destinationAddress })"></CopyIcon>
        </div>
        <div class="w-full hidden md:block lg:hidden">
          <WalletAddress :address="store.state.destinationAddress" :length="6"></WalletAddress>
          <CopyIcon :text="store.state.destinationAddress" :title="t('address.copyDestination', { address: store.state.destinationAddress })"></CopyIcon>
        </div>
        <div class="w-full hidden lg:block">
          <WalletAddress :address="store.state.destinationAddress" :length="30"></WalletAddress>
          <CopyIcon :text="store.state.destinationAddress" :title="t('address.copyDestination', { address: store.state.destinationAddress })"></CopyIcon>
        </div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 text-center md:text-left" v-if="store.state.memo && store.state.memo != 'aramid'">
        <div class="md:min-w-44 font-bold">{{ t('transaction.dataTransfer') }}</div>
        <div class="w-full">{{ store.state.memo }} <CopyIcon :text="store.state.memo" :title="t('address.copyMemo', { memo: store.state.memo })"></CopyIcon></div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 text-center md:text-left">
        <div class="md:min-w-44 font-bold">{{ t('address.bridge') }}</div>
        <div class="w-full block md:hidden">
          <WalletAddress :address="store.state.destinationBridgeAddress" :length="4"></WalletAddress>
          <CopyIcon :text="store.state.destinationBridgeAddress" :title="t('address.copyBridgeDestination', { address: store.state.destinationBridgeAddress })"></CopyIcon>
        </div>
        <div class="w-full hidden md:block lg:hidden">
          <WalletAddress :address="store.state.destinationBridgeAddress" :length="6"></WalletAddress>
          <CopyIcon :text="store.state.destinationBridgeAddress" :title="t('address.copyBridgeDestination', { address: store.state.destinationBridgeAddress })"></CopyIcon>
        </div>
        <div class="w-full hidden lg:block">
          <WalletAddress :address="store.state.destinationBridgeAddress" :length="30"></WalletAddress>
          <CopyIcon :text="store.state.destinationBridgeAddress" :title="t('address.copyBridgeDestination', { address: store.state.destinationBridgeAddress })"></CopyIcon>
        </div>
      </div>
    </div>
    <StatusBar></StatusBar>
    <MainActionButton @click="signButtonClick" v-if="store.state.sourceChainConfiguration?.type == 'algo'">{{ t('transaction.sign') }}</MainActionButton>

    <div v-if="state.inApproval"><img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> {{ t('wallet.checkWalletApprove') }}</div>
    <div v-if="state.inApprovalMinting">
      <img :src="loader" alt="Loading" height="18" width="18" class="inline-block" />
      {{ t('transaction.submittingApproval', { chain: store.state.sourceChainConfiguration?.name }) }}
      <span v-if="state.approvalHash"><ShortTx :txId="state.approvalHash" :length="6" :chain="store.state.sourceChain"></ShortTx></span>
    </div>
    <div v-if="state.inSign"><img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> {{ t('wallet.checkWallet') }}</div>
    <div v-if="state.inSignMinting">
      <img :src="loader" alt="Loading" height="18" width="18" class="inline-block" />
      {{ t('transaction.submitting', { chain: store.state.sourceChainConfiguration?.name }) }}
    </div>
    <div v-if="state.switchingNetwork"><img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> {{ t('wallet.checkWalletSwitch') }}</div>
    <div v-if="store.state.sourceChainConfiguration?.type == 'eth'" class="w-full">
      <MainActionButton v-if="network.chainId != store.state.sourceChain" @click="switchNetworkClick">{{ t('bridge.switchNetwork', { chain: store.state.sourceChainConfiguration?.name }) }}</MainActionButton>
      <div v-else-if="store.state.sourceToken == '0x0000000000000000000000000000000000000000'">
        <MainActionButton @click="payNativeButtonClick"> {{ t('bridge.bridgeNativeToken') }} </MainActionButton>
      </div>
      <div v-else class="w-full">
        <MainActionButton @click="approveButtonClick" v-if="store.state.sourceChainConfiguration?.type == 'eth' && !state.approved && !state.inApproval && !state.inApprovalMinting">
          {{ t('common.approve') }}
        </MainActionButton>
        <MainActionButton @click="lockButtonClick" v-if="store.state.sourceChainConfiguration?.type == 'eth' && state.approved && !state.inSign && !state.inSignMinting">
          {{ t('bridge.signTransaction') }}
        </MainActionButton>
      </div>
    </div>
  </MainBox>
</template>
