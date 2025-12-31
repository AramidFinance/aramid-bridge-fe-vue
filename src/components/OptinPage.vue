<script setup lang="ts">
import loader from '@/assets/images/loading-buffering.gif'
import getAlgoAccountTokenOptedIn from '@/scripts/algo/getAlgoAccountTokenOptedIn'
import getAlgodClientByChainId from '@/scripts/algo/getAlgodClientByChainId'
import { useAppStore } from '@/stores/app'
import algosdk from 'algosdk'
import { useWallet } from 'avm-wallet-vue'
import { useToast } from 'primevue/usetoast'
import QRCodeVue3 from 'qrcode-vue3'
import { computed, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import CopyIcon from './ui/CopyIcon.vue'
import MainActionButton from './ui/MainActionButton.vue'
import MainBox from './ui/MainBox.vue'
import WalletAddress from './ui/WalletAddress.vue'
const { avmActiveWallet, activeAccount, signTransactions: avmSignTransactions } = useWallet()

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()

const state = reactive({
  signInWallet: false,
  sendingOptin: false
})

const walletName = computed(() => avmActiveWallet.value?.metadata?.name)

const routeToBridgeScreen = () => {
  console.log('route', route)
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
        detail: t('error.accountNotOptedIn', { assetId: store.state.destinationToken }),
        life: 3000
      })
    }
  } catch (e: any) {
    console.error(e)
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
      sender: store.state.destinationAddress,
      receiver: store.state.destinationAddress,
      suggestedParams: params,
      note: new Uint8Array(Buffer.from('aramid-optin')),
      assetIndex: Number(store.state.destinationToken)
    })

    state.signInWallet = true
    const signed = await avmSignTransactions([tx])
    state.signInWallet = false
    if (signed && signed[0]) {
      state.sendingOptin = true
      await algodClient.sendRawTransaction(signed[0]).do()
      await algosdk.waitForConfirmation(algodClient, tx.txID(), 5)
      state.sendingOptin = false
      checkOptIn()
    }
  } catch (e: any) {
    console.error(e)
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
        class="px-2 items-center flex backdrop-blur-xl rounded-[80px] place-content-start select-none justify-between opacity-70 font-semibold text-[14px] cursor-pointer"
        style="border: 1px solid rgba(246, 246, 246, 0.16); background: rgba(246, 246, 246, 0.16)"
        @click="routeToBridgeScreen"
      >
        <div class="flex flex-row-reverse items-center">
          <img alt="CaretLeftIcon" loading="lazy" width="20" height="20" decoding="async" src="../assets/images/CaretLeft.svg" style="color: transparent" />
        </div>
        {{ t('common.back') }}
      </div>
      <div class="font-bold text-xl">{{ t('optin.destinationAccountRequired') }}</div>
    </div>

    <p>{{ t('optin.chainRequirement', { chain: store.state.destinationChainConfiguration?.name }) }}</p>

    <p v-if="store.state.destinationToken"><CopyIcon :text="store.state.destinationToken" :title="store.state.destinationToken"></CopyIcon> {{ store.state.destinationToken }}</p>

    <div v-if="activeAccount?.address == store.state.destinationAddress">
      <p v-if="state.signInWallet"><img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> {{ t('sign.signInWallet', { wallet: walletName || '' }) }}</p>
      <p v-if="state.sendingOptin">
        <img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> {{ t('optin.sending', { chain: store.state.destinationChainConfiguration?.name }) }}
      </p>
      <MainActionButton @click="optinUsingUseWallet">{{ t('optin.optInButton') }}</MainActionButton>
    </div>
    <div v-else>
      <p>{{ t('optin.instructions', { token: store.state.destinationToken }) }}</p>
      <table class="w-full">
        <tbody>
          <tr>
            <th>{{ t('optin.accountLabel') }}</th>
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
            <th>{{ t('optin.assetIdLabel') }}</th>
            <th><CopyIcon :text="store.state.destinationToken"></CopyIcon></th>
            <td>{{ store.state.destinationToken }}</td>
          </tr>
        </tbody>
      </table>
      <QRCodeVue3 :width="200" :height="200" :value="optInQrContent()" class="m-auto w-full" myclass="m-auto w-full" imgclass="m-auto h-40 w-40" />
      <MainActionButton @click="checkOptIn">{{ t('optin.accountOptedInButton') }}</MainActionButton>
    </div>
  </MainBox>
</template>
