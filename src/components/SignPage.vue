<script setup lang="ts">
import loader from '@/assets/images/loading-buffering.gif'
import { checkDestinationAlgoTx } from '@/scripts/algo/checkDestinationAlgoTx'
import { checkSourceAlgoTx } from '@/scripts/algo/checkSourceAlgoTx'
import getAlgoAcountTokenOptin from '@/scripts/algo/getAlgoAccountTokenOptedIn'
import getAlgodClientByChainId from '@/scripts/algo/getAlgodClientByChainId'
import { getClaimTx } from '@/scripts/aramid/getClaimTx'
import { getTxClaimData } from '@/scripts/aramid/getTxClaimData'
import { makeNoteField } from '@/scripts/aramid/makeNoteField'
import { resetStateSoft } from '@/scripts/common/resetStateSoft'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import { useAppStore } from '@/stores/app'
import { populateAppCallResources } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { TransactionComposer } from '@algorandfoundation/algokit-utils/types/composer'
import { useWallet } from '@txnlab/use-wallet-vue'
import algosdk, { Address } from 'algosdk'
import { type Arc200ExchangeInfo, getArc200ASAClient } from 'arc200-client'
import { useWallet as useAvmWallet } from 'avm-wallet-vue'
import { BigNumber } from 'bignumber.js'
import { useToast } from 'primevue/usetoast'
import QRCodeVue3 from 'qrcode-vue3'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import getAlgoClient from '../scripts/algo/getAlgoClient'
import getExchangeInfo from '../scripts/algo/getExchangeInfo'
import getIndexerClientByChainId from '../scripts/algo/getIndexerClientByChainId'
import StatusBar from './status/StatusBar.vue'
import CopyIcon from './ui/CopyIcon.vue'
import FireworksEffect from './ui/FireworksEffect.vue'
import MainActionButton from './ui/MainActionButton.vue'
import MainBox from './ui/MainBox.vue'
import ShortTx from './ui/ShortTx.vue'
import WalletAddress from './ui/WalletAddress.vue'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()
const { activeWallet, signTransactions: useWalletSignTransactions } = useWallet()
const { avmActiveWallet, activeAccount, signTransactions: avmSignTransactions } = useAvmWallet()

const routeToReviewScreen = () => {
  console.log('routeToReviewScreen')
  console.log('route', route)
  router.push({ name: 'review-sc-dc-st-dt-sa-da-a-n' })
}

const matchBridgeTxByDataClick = async () => {
  console.log('matchBridgeTxByDataClick')
  if (!store.state.bridgeTx && store.state.sourceChain) {
    if (store.state.sourceChainConfiguration?.type == 'algo') {
      const txId = await checkSourceAlgoTx()
      if (txId) {
        const algodClient = await getAlgodClientByChainId(store.state.sourceChain)
        try {
          if (algodClient) {
            const txInfo = await algodClient.pendingTransactionInformation(txId).do()
            if (txInfo.confirmedRound) {
              store.state.bridgeTx = txId
            }
          }
        } catch (error) {
          console.error('Error checking transaction confirmation:', error)
        }
      }
    }
  }
  if (!store.state.bridgeTx) {
    toast.add({
      severity: 'error',
      detail: t('sign.transactionNotFound'),
      life: 3000
    })
  }
}

const checkSourceTx = async () => {
  console.log('checkSourceTx', store.state.claimTx, store.state.bridgeTx)
  if (!store.state.claimTx && store.state.bridgeTx) {
    if (store.state.destinationChainConfiguration?.type == 'eth') {
      const claimTx = await getClaimTx(store.state.bridgeTx)
      if (claimTx) {
        store.state.claimTx = claimTx
        const claimData = await getTxClaimData(claimTx)
        if (claimData) {
          store.state.claimData = claimData
        }
        router.push('/claim/' + store.state.bridgeTx)
      }
    }
    if (store.state.destinationChainConfiguration?.type === 'algo') {
      const txId = await checkDestinationAlgoTx()
      if (txId) {
        store.state.claimTx = txId
      }
    }
  }
}

const timerInterval = ref()

onMounted(async () => {
  makeNoteField()
  if (!store.state.publicConfiguration || !store.state.sourceAmount) {
    // route back to bridge screen
    routeToReviewScreen()
  }
  if (store.state.sourceChainConfiguration?.type == 'algo' && !store.state.sourceTxNote) {
    routeToReviewScreen()
  }

  // Add check for destination wallet connection when bridging to Voi with unitAppId
  if (
    store.state.destinationChainConfiguration?.name === 'Voi' &&
    store.state.destinationTokenConfiguration?.arc200TokenId &&
    (!avmActiveWallet?.value || activeAccount.value?.address !== store.state.destinationAddress)
  ) {
    toast.add({
      severity: 'error',
      detail: t('sign.connectDestinationWallet'),
      life: 3000
    })
    routeToReviewScreen()
    return
  }

  timerInterval.value = setInterval(checkSourceTx.bind(this), 3000)
  checkSourceTx()

  if (store.state.sourceChainConfiguration?.type == 'algo' && store.state.sourceAlgoConnectorType == AlgoConnectorType.UseWallet) {
    // trigger the sign action
    await signWithUseWallet()
  }
})

const dummyTransactionSigner = async (txnGroup: algosdk.Transaction[], indexesToSign: number[]): Promise<Uint8Array[]> => {
  return [] as Uint8Array[]
}
const signWithUseWallet = async () => {
  try {
    if (!store.state.sourceChain) return
    if (!store.state.sourceToken) return
    if (!store.state.sourceAddress) return
    if (!store.state.sourceTxNote) return
    if (!activeWallet) throw Error(t('sign.useWalletNotInitialized'))

    const algodClient = await getAlgodClientByChainId(store.state.sourceChain)
    if (!algodClient) throw Error(t('sign.algodClientNotInitialized'))
    const params = await algodClient.getTransactionParams().do()

    let signed: any

    // smart asset (arc200)
    const config = store.state.sourceTokenConfiguration
    if (config && config.asa2arc200BridgeAppId && config.arc200TokenId) {
      const arc200TokenId = config.arc200TokenId
      const asa2arc200BridgeAppId = config.asa2arc200BridgeAppId
      const chainId = config.chainId

      const sourceAddress = store.state?.sourceAddress || ''
      const tokenId = store.state.sourceToken
      const sourceAmount = BigInt(store.state.sourceAmount)
      const asaOptin = await getAlgoAcountTokenOptin(chainId, sourceAddress, Number(tokenId))

      // For ARC200 we need both algod and indexer clients, but we'll use the first available
      // since arc200 library expects specific client instances
      const indexerClient = await getIndexerClientByChainId(chainId)
      const algodClient = await getAlgodClientByChainId(chainId)

      if (!indexerClient || !algodClient) {
        console.error('Failed to get algod or indexer client for ARC200')
        return new BigNumber('0')
      }
      const algoClient = await getAlgoClient(store.state.sourceChain)

      const clientArc200UserSender = getArc200ASAClient({
        algorand: algoClient,
        appId: BigInt(arc200TokenId),
        appName: 'asa2arc200Bridge',
        approvalSourceMap: undefined,
        clearSourceMap: undefined,
        defaultSender: sourceAddress,
        defaultSigner: undefined
      })
      const clientArc200AsaUserSender = getArc200ASAClient({
        algorand: algoClient,
        appId: BigInt(arc200TokenId),
        appName: 'asa2arc200Bridge',
        approvalSourceMap: undefined,
        clearSourceMap: undefined,
        defaultSender: sourceAddress,
        defaultSigner: undefined
      })

      const exchangeInfo: Arc200ExchangeInfo | undefined = await getExchangeInfo('source')

      // withdraw asa from the arc200 contract and send it to the bridge address
      // if user is not opted in to the asa, opt in him

      let txToSign: algosdk.Transaction[] = []

      if (!asaOptin) {
        txToSign.push(
          algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            amount: 0n,
            sender: sourceAddress,
            receiver: sourceAddress,
            suggestedParams: params,
            assetIndex: Number(tokenId)
          })
        )
        console.log('Added optin txn for ASA', tokenId)
      }

      // if exchangeInfo is defined, we use exchange method to withdraw ASA otherwise we use wnnt200
      // for both we need to add approve txn first

      const approveTxs = await clientArc200UserSender.createTransaction.arc200Approve({
        args: {
          spender: exchangeInfo?.sink ?? algosdk.getApplicationAddress(Number(asa2arc200BridgeAppId)).toString(),
          value: sourceAmount
        }
      })
      // there must be only one txn
      approveTxs.transactions.forEach((tx) => txToSign.push(tx))
      console.log('Added approve txn for ARC200', arc200TokenId, sourceAmount)
      if (exchangeInfo?.sink) {
        const exchangeTxs = await clientArc200AsaUserSender.createTransaction.arc200SwapBack({
          args: {
            amount: sourceAmount
          },
          staticFee: AlgoAmount.MicroAlgos(2000)
        })
        exchangeTxs.transactions.forEach((tx) => txToSign.push(tx))
        console.log('Added exchange arc200SwapBack txn for ARC200', arc200TokenId, sourceAmount)
      } else {
        const wnnt200Txs = await clientArc200AsaUserSender.createTransaction.withdraw({
          args: {
            amount: sourceAmount
          },
          staticFee: AlgoAmount.MicroAlgos(2000)
        })
        wnnt200Txs.transactions.forEach((tx) => txToSign.push(tx))
        console.log('Added wnnt200 withdraw txn for ARC200', arc200TokenId, sourceAmount)
      }

      // finally send to bridge address

      const tx =
        Number(store.state.sourceToken) > 0
          ? algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
              amount: BigInt(store.state.sourceAmount),
              sender: store.state.sourceAddress,
              receiver: store.state.sourceBridgeAddress,
              suggestedParams: params,
              note: new Uint8Array(Buffer.from(store.state.sourceTxNote)),
              assetIndex: Number(store.state.sourceToken)
            })
          : algosdk.makePaymentTxnWithSuggestedParamsFromObject({
              amount: BigInt(store.state.sourceAmount),
              sender: store.state.sourceAddress,
              receiver: store.state.sourceBridgeAddress,
              suggestedParams: params,
              note: new Uint8Array(Buffer.from(store.state.sourceTxNote))
            })
      txToSign.push(tx)
      console.log('Added bridge txn', tx, store.state.sourceTxNote)

      // fill in the resources
      const composer = new TransactionComposer({
        algod: algodClient,
        getSigner: (address: string | Address) => dummyTransactionSigner
      })
      txToSign.forEach((txn) => {
        composer.addTransaction(txn)
      })
      const { atc } = await composer.build()
      const populatedAtc = await populateAppCallResources(atc, algodClient)
      const group = populatedAtc.buildGroup()
      const toSignFinal = group.map((txnWithSigner) => {
        return txnWithSigner.txn
      })
      console.log('signing txns', toSignFinal)
      signed = await useWalletSignTransactions(toSignFinal)
    }
    // algo or asa
    else {
      const tx =
        Number(store.state.sourceToken) > 0
          ? algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
              amount: BigInt(store.state.sourceAmount),
              sender: store.state.sourceAddress,
              receiver: store.state.sourceBridgeAddress,
              suggestedParams: params,
              note: new Uint8Array(Buffer.from(store.state.sourceTxNote)),
              assetIndex: Number(store.state.sourceToken)
            })
          : algosdk.makePaymentTxnWithSuggestedParamsFromObject({
              amount: BigInt(store.state.sourceAmount),
              sender: store.state.sourceAddress,
              receiver: store.state.sourceBridgeAddress,
              suggestedParams: params,
              note: new Uint8Array(Buffer.from(store.state.sourceTxNote))
            })

      signed = await useWalletSignTransactions([tx])
    }
    if (signed && signed.length > 0) {
      // res.txId is the txId of the first transaction in the signed array
      // algosdk.decodeSignedTransaction(signed.pop()).txn.txID() is the txId of the last transaction in the signed array
      console.log('Signed txns', signed)
      await algodClient.sendRawTransaction(signed).do()
      const tx = algosdk.decodeSignedTransaction(signed.pop()).txn.txID()
      store.state.bridgeTx = tx
    }
  } catch (e: any) {
    console.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 3000
    })
  }
}

onBeforeUnmount(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})

const resetButtonClick = async () => {
  resetStateSoft()
  console.log('resetButtonClick')
  store.state.claimData = undefined
  await router.push({ name: 'bridge-sc-dc-st-dt-sa-da-a-n' })
}

const claimTxPending = ref(false)

const claimButtonClick = async () => {
  console.log('claimButtonClick')
  try {
    router.push({
      name: 'arc200-claim-t',
      params: {
        network: 'voimain',
        tokenId: store.state.destinationToken,
        amount: store.state.destinationAmount,
        direction: 'ASAToARC200'
      }
    })

    // Reset state and redirect
    //await resetButtonClick()
  } catch (e: any) {
    console.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 3000
    })
  } finally {
    claimTxPending.value = false
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
        @click="routeToReviewScreen"
      >
        <div class="flex flex-row-reverse items-center">
          <img alt="CaretLeftIcon" loading="lazy" width="20" height="20" decoding="async" src="../assets/images/CaretLeft.svg" style="color: transparent" />
        </div>
        {{ t('common.back') }}
      </div>
      <div v-if="!store.state.bridgeTx" class="font-bold text-xl">{{ t('sign.signTransactionTitle') }}</div>
      <div v-else-if="store.state.claimTx" class="font-bold text-xl">{{ t('sign.successfulBridgingTitle') }}</div>
    </div>

    <StatusBar></StatusBar>
    <div v-if="!store.state.bridgeTx">
      <div v-if="store.state.sourceAlgoConnectorType == AlgoConnectorType.QRCode">
        <p>
          {{
            t('sign.sendReminder', {
              amount: store.state.sourceAmountFormatted,
              token: store.state.sourceTokenConfiguration?.name
            })
          }}
          <span v-if="Number(store.state.sourceTokenConfiguration?.tokenId) > 0"> ({{ store.state.sourceTokenConfiguration?.tokenId }}) </span>
          &nbsp;{{ t('sign.toBridgeAddress') }}
          <WalletAddress :address="store.state.sourceBridgeAddress"></WalletAddress>
          <CopyIcon :text="store.state.sourceBridgeAddress"></CopyIcon>
          &nbsp;{{ t('sign.onChain', { chain: store.state.sourceChainConfiguration?.name }) }} &nbsp;{{ t('sign.withNoteField') }}
          <CopyIcon :text="store.state.sourceTxNote"></CopyIcon>
        </p>
        <div class="text-center">
          <p>{{ t('sign.scanQrDescription') }}</p>
          <a v-if="store.state.qrContent" :href="`web+${store.state.qrContent}`" class="m-auto my-2" style="width: 200px; height: 200px; display: inline-block">
            <QRCodeVue3 :width="200" :height="200" :value="store.state.qrContent" myclass="m-auto" />
          </a>
        </div>
        <div class="text-center font-bold m-4">
          <img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> {{ t('sign.scanQrPrompt') }}
          <MainActionButton @click="matchBridgeTxByDataClick">{{ t('sign.transactionSubmitted') }}</MainActionButton>
        </div>
      </div>
      <div v-if="store.state.sourceAlgoConnectorType == AlgoConnectorType.UseWallet" class="text-center font-bold m-4">
        <p>
          <img :src="loader" alt="Loading" height="18" width="18" class="inline-block" />
          {{ t('sign.signInWallet', { wallet: activeWallet?.metadata?.name || '' }) }}
        </p>
      </div>
    </div>
    <div v-else-if="store.state.bridgeTx && !store.state.claimTx">
      <img :src="loader" alt="Loading" height="18" width="18" class="inline-block" />
      {{ t('sign.processingInfo') }} {{ t('sign.yourTransactionId') }}
      <ShortTx :txId="store.state.bridgeTx" :length="6" :chain="store.state.sourceChain"></ShortTx>
    </div>
    <div v-else-if="store.state.claimTx && store.state.destinationChainConfiguration?.type == 'algo'">
      <div v-if="store.state.destinationChainConfiguration?.name === 'Voi' && store.state.destinationTokenConfiguration?.arc200TokenId">
        <p>{{ t('sign.bridgeSuccess') }}</p>
        <p>{{ t('sign.transactionIdLabel') }} <ShortTx :txId="store.state.claimTx" :length="6" :chain="store.state.destinationChain"></ShortTx></p>
        <p>{{ t('sign.verifyAssets') }}</p>
        <MainActionButton @click="claimButtonClick" :tooltip="t('sign.claimTooltip')"> {{ t('sign.claimAssets') }} </MainActionButton>
      </div>
      <div v-if="store.state.destinationChainConfiguration?.name === 'Voi'">
        <p>{{ t('sign.bridgeSuccess') }}</p>
        <p>{{ t('sign.transactionIdLabel') }} <ShortTx :txId="store.state.claimTx" :length="6" :chain="store.state.destinationChain"></ShortTx></p>
        <p>{{ t('sign.verifyAssets') }}</p>

        <FireworksEffect></FireworksEffect>
        <MainActionButton @click="resetButtonClick">{{ t('sign.bridgeAgain') }}</MainActionButton>
      </div>
      <div v-else>
        <p>
          {{ t('sign.bridgeSuccessShort') }} {{ t('sign.txnIdPrefix') }}
          <ShortTx :txId="store.state.claimTx" :length="6" :chain="store.state.destinationChain"></ShortTx>
        </p>
        <FireworksEffect></FireworksEffect>
        <MainActionButton @click="resetButtonClick">{{ t('sign.bridgeAgain') }}</MainActionButton>
      </div>
    </div>
    <div v-else>
      <img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> {{ t('sign.pleaseWait') }}
      <span v-if="store.state.bridgeTx">{{ t('sign.yourTransactionId') }} <ShortTx :txId="store.state.bridgeTx" :length="6" :chain="store.state.sourceChain"></ShortTx></span>
    </div>
  </MainBox>
</template>
