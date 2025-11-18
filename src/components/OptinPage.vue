<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import logger from "@/scripts/common/conditionalLogger"
import CopyIcon from './ui/CopyIcon.vue'
import MainBox from './ui/MainBox.vue'
import WalletAddress from './ui/WalletAddress.vue'
import { onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainActionButton from './ui/MainActionButton.vue'
import { useToast } from 'primevue/usetoast'
import loader from '@/assets/images/loading-buffering.gif'
import { useWallet } from 'avm-wallet-vue'
import QRCodeVue3 from 'qrcode-vue3'
import getAlgoAccountTokenOptedIn from '@/scripts/algo/getAlgoAccountTokenOptedIn'
import getAlgodClientByChainId from '@/scripts/algo/getAlgodClientByChainId'
import algosdk from 'algosdk'
const { avmActiveWallet, activeAccount } = useWallet()

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const state = reactive({
  signInWallet: false,
  sendingOptin: false
})

const routeToBridgeScreen = () => {
  logger.debug('route', route)
  router.push({ name: 'bridge-sc-dc-st-dt-sa-da-a-n' })
}

onMounted(() => {
  if (!store.state.sourceChainConfiguration?.name) {
    routeToBridgeScreen()
  }
})

const optInQrContent = () => {
  const addNetwork = `&network=${store.state.sourceChainGenesis}`
  return `algorand://${store.state.destinationAddress}?amount=0&asset=${store.state.destinationToken}${addNetwork}&note=aramid-optin`
}

const checkOptIn = async () => {
  try {
    if (!store.state.destinationChain) return
    if (!store.state.destinationAddress) return

    const optin = await getAlgoAccountTokenOptedIn(store.state.destinationChain, store.state.destinationAddress, Number(store.state.destinationToken))
    store.state.destinationAccountOptedIn = !!optin

    if (store.state.destinationAccountOptedIn) {
      router.push({ name: 'review-sc-dc-st-dt-sa-da-a-n' })
    } else {
      toast.add({
        severity: 'error',
        detail: `Account is not yet opted in to asset ${store.state.destinationToken}`,
        life: 3000
      })
    }
  } catch (e: any) {
    logger.error(e)
    toast.add({
      severity: 'error',
      detail: e.message,
      life: 3000
    })
    return false
  }
}

const optinUsingUseWallet = async () => {
  try {
    if (!store.state.destinationChain) return
    if (!store.state.destinationAddress) return
    const algodClient = await getAlgodClientByChainId(store.state.destinationChain)
    if (!algodClient) throw Error('Algod client not initialized')
    const params = await algodClient.getTransactionParams().do()
    const tx = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: store.state.destinationAddress,
      to: store.state.destinationAddress,
      suggestedParams: params,
      note: new Uint8Array(Buffer.from('aramid-optin')),
      assetIndex: Number(store.state.destinationToken)
    })

    state.signInWallet = true
    const signed = await avmActiveWallet.value?.signTransactions([tx])
    state.signInWallet = false
    if (signed && signed[0]) {
      state.sendingOptin = true
      await algodClient.sendRawTransaction(signed[0]).do()
      await algosdk.waitForConfirmation(algodClient, tx.txID(), 5)
      state.sendingOptin = false
      checkOptIn()
    }
  } catch (e: any) {
    logger.error(e)
    state.signInWallet = false
    state.sendingOptin = false
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 3000
    })
  }
}
</script>

<template>
  <MainBox v-if="store && store.state && store.state.publicConfiguration && store.state.sourceAmount">
    <div class="w-[80vw] md:w-full flex flex-row gap-4 items-center mb-4">
      <div
        id="edit-button"
        class="px-2 items-center flex backdrop-blur-xl rounded-full place-content-start select-none justify-between opacity-70 font-semibold text-[14px] cursor-pointer"
        style="border: 1px solid rgba(246, 246, 246, 0.16); background: rgba(246, 246, 246, 0.16)"
        @click="routeToBridgeScreen"
      >
        <div class="flex flex-row-reverse items-center">
          <img alt="CaretLeftIcon" loading="lazy" width="20" height="20" decoding="async" src="../assets/images/CaretLeft.svg" style="color: transparent" />
        </div>
        Back
      </div>
      <div class="font-bold text-xl">Destination account optin required</div>
    </div>

    <p>On {{ store.state.destinationChainConfiguration?.name }} chain the standard assets require to be opted in to the asset before third party can do deposit.</p>

    <p v-if="store.state.destinationToken"><CopyIcon :text="store.state.destinationToken" :title="store.state.destinationToken"></CopyIcon> {{ store.state.destinationToken }}</p>

    <div v-if="activeAccount?.address == store.state.destinationAddress">
      <p v-if="state.signInWallet"><img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> Please sign your transaction in your {{ avmActiveWallet?.name }} wallet</p>
      <p v-if="state.sendingOptin"><img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> Sending optin to the {{ store.state.destinationChainConfiguration?.name }}</p>
      <MainActionButton @click="optinUsingUseWallet">Opt in</MainActionButton>
    </div>
    <div v-else>
      <p>
        If you are owner of the account please opt in by scanning the QR code in ARC26 QR Code capable wallet or do self signed zero amount tx manually with asset {{ store.state.destinationToken }} in
        your wallet. If you want to send the assets to someone else, ask him to opt in to asset {{ store.state.destinationToken }}.
      </p>
      <table class="w-full">
        <tbody>
          <tr>
            <th>Account</th>
            <th><CopyIcon :text="store.state.destinationAddress"></CopyIcon></th>
            <td>
              <div class="w-full block md:hidden">
                <WalletAddress :address="store.state.destinationAddress" :length="4"></WalletAddress>
              </div>
              <div class="w-full hidden md:block lg:hidden">
                <WalletAddress :address="store.state.destinationAddress" :length="6"></WalletAddress>
              </div>
              <div class="w-full hidden lg:block">
                <WalletAddress :address="store.state.destinationAddress" :length="30"></WalletAddress>
              </div>
            </td>
          </tr>
          <tr>
            <th>Asset ID</th>
            <th><CopyIcon :text="store.state.destinationToken"></CopyIcon></th>
            <td>{{ store.state.destinationToken }}</td>
          </tr>
        </tbody>
      </table>
      <QRCodeVue3 :width="200" :height="200" :value="optInQrContent()" class="m-auto w-full" myclass="m-auto w-full" imgclass="m-auto h-40 w-40" />
      <MainActionButton @click="checkOptIn">Account has been opted in</MainActionButton>
    </div>
  </MainBox>
</template>
