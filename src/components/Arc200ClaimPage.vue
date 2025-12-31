<script setup lang="ts">
import getAlgoAcountTokenOptin from '@/scripts/algo/getAlgoAccountTokenOptedIn'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { resetStateSoft } from '@/scripts/common/resetStateSoft'
import { useAppStore } from '@/stores/app'
import { populateAppCallResources } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { TransactionComposer } from '@algorandfoundation/algokit-utils/types/composer'
import { useNetwork, useWallet } from '@txnlab/use-wallet-vue'
import algosdk, { Address } from 'algosdk'
import { getArc200ASAClient, type Arc200ExchangeInfo } from 'arc200-client'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import dummyTransactionSigner from '../scripts/algo/dummyTransactionSigner'
import getAlgoClient from '../scripts/algo/getAlgoClient'
import getAlgodClientByChainId from '../scripts/algo/getAlgodClientByChainId'
import getExchangeInfo from '../scripts/algo/getExchangeInfo'
import { fillArc200BridgeChainConfiguration } from '../scripts/events/fillArc200BridgeChainConfiguration'
import { fillArc200BridgeTokenConfiguration } from '../scripts/events/fillArc200BridgeTokenConfiguration'
import AmountArc200Bridge from './AmountArc200Bridge.vue'
import AssetSelectionArc200Bridge from './AssetSelectionArc200Bridge.vue'
import ChainSelectionArc200Bridge from './ChainSelectionArc200Bridge.vue'
import Arc200ToASAOptionButton from './ui/Arc200ToASAOptionButton.vue'
import FireworksEffect from './ui/FireworksEffect.vue'
import MainActionButton from './ui/MainActionButton.vue'
import MainBox from './ui/MainBox.vue'
import ShortTx from './ui/ShortTx.vue'
import WalletArc200Bridge from './WalletArc200Bridge.vue'

const { setActiveNetwork, activeNetwork } = useNetwork()
const { signTransactions } = useWallet()
const toast = useToast()
const { t } = useI18n()
const router = useRouter()
const store = useAppStore()
const state = reactive({
  inputTx: '',
  fromRoute: false,
  isSearching: false,
  bridgingIsSuccessful: false,
  resultTx: '',
  bridginig: false,
  claimErrorMessage: '',
  mounted: false
})

onMounted(async () => {
  const route = useRoute()
  state.inputTx = route.params['sourceTxId'] as string
  state.fromRoute = !!state.inputTx

  if (route.params['network']) {
    const chainId = convertNetworkCodeToChainId(route.params['network'] as string)
    if (chainId !== 0) {
      store.state.arc200BridgeChain = chainId
      fillArc200BridgeChainConfiguration()
    }
  }

  if (route.params['tokenId'] && route.params['amount'] && route.params['direction']) {
    store.state.arc200BridgeToken = route.params['tokenId'] as string
    store.state.arc200BridgeAmount = route.params['amount'] as string
    store.state.arc200BridgeDirection = route.params['direction'] as 'ARC200ToASA' | 'ASAToARC200'
    if (store.state.arc200BridgeDirection !== 'ARC200ToASA' && store.state.arc200BridgeDirection !== 'ASAToARC200') {
      store.state.arc200BridgeDirection = 'ARC200ToASA'
    }
    fillArc200BridgeTokenConfiguration(store.state.arc200BridgeToken)
  }

  await getPublicConfiguration(true)
  state.mounted = true
})
const fillInRoute = () => {
  if (!state.mounted) return
  if (!store.state.arc200BridgeToken) return

  router.push({
    name: 'arc200-claim-t',
    params: {
      network: activeNetwork.value ?? 'voimain',
      tokenId: store.state.arc200BridgeToken,
      amount: store.state.arc200BridgeAmount ?? '0',
      direction: store.state.arc200BridgeDirection ?? 'ARC200ToASA'
    }
  })
}

watch(
  () => store.state.arc200BridgeToken,
  () => {
    fillInRoute()
  }
)
watch(
  () => store.state.arc200BridgeAmount,
  () => {
    fillInRoute()
  }
)
watch(
  () => store.state.arc200BridgeDirection,
  () => {
    fillInRoute()
  }
)

const convertToNetworkCode = (chainId: number): string => {
  switch (chainId) {
    case 416101:
      return 'voimain' //Voi mainnet
    case 416001:
      return 'mainnet' //Algorand Mainnet
    case 101003:
      return 'aramidmain' // aramid mainnet
    default:
      return ''
  }
}
const convertNetworkCodeToChainId = (networkCode: string): number => {
  switch (networkCode) {
    case 'voimain':
      return 416101 //Voi mainnet
    case 'mainnet':
      return 416001 //Algorand Mainnet
    case 'aramidmain':
      return 101003 // aramid mainnet
    default:
      return 0
  }
}
const bridginigButtonClick = async () => {
  try {
    state.bridginig = true
    if (!store.state.arc200BridgeChain) throw new Error('No destination chain set')
    const chain = store.state.arc200BridgeChain
    const code = convertToNetworkCode(chain)

    if (store.state.destinationChain) {
      console.log('activeNetwork.value ? store.state.destinationChain', activeNetwork.value, store.state.destinationChain)
      if (activeNetwork.value != code) {
        //provider.open()
        toast.add({
          severity: 'warn',
          detail: t('claim.switchNetworkPrompt', { chain: store.state.destinationChainConfiguration?.name }),
          life: 10000
        })
        console.log('switching network to', store.state.destinationChain)
        state.bridginig = false
        await setActiveNetwork(code)
        console.log('after switching network to', store.state.destinationChain)
        return
      }
    }

    if (store.state.arc200BridgeDirection === 'ARC200ToASA') {
      await bridgeArc200ToAsa()
    } else if (store.state.arc200BridgeDirection === 'ASAToARC200') {
      await bridgeAsaToArc200()
    } else {
      throw new Error('No bridge direction selected')
    }

    state.bridginig = false
  } catch (e: any) {
    state.bridginig = false
    console.error(e)
    toast.add({
      severity: 'error',
      detail: e.message ?? e,
      life: 10000
    })
  }
}

const bridgeArc200ToAsa = async () => {
  console.log('bridgeArc200ToAsa')
  try {
    if (!store.state.arc200BridgeTokenConfiguration) throw new Error('No ARC200 token configuration selected')
    if (!store.state.arc200BridgeToken) throw new Error('No ARC200 token selected')
    const arc200TokenId = store.state.arc200BridgeTokenConfiguration?.arc200TokenId ?? store.state.arc200BridgeTokenConfiguration?.optionalArc200TokenId
    if (!arc200TokenId) throw new Error('No ARC200 token ID found in configuration')
    state.bridginig = true
    if (!store.state.arc200BridgeChain) throw Error('Chain is not selected')
    if (!store.state.arc200BridgeAddress) throw Error('Source address is not set')
    console.log('store.state.arc200BridgeChain', store.state.arc200BridgeChain)
    const algodClient = await getAlgodClientByChainId(store.state.arc200BridgeChain)
    if (!algodClient) throw Error(t('sign.algodClientNotInitialized'))
    // get asset balance
    if (!store.state.arc200BridgeAddress) throw Error(t('sign.destinationAddressMissing'))
    const destinationAddress = store.state.arc200BridgeAddress
    const exchangeInfo: Arc200ExchangeInfo | undefined = await getExchangeInfo('arc200Bridge')
    console.log('exchangeInfo', exchangeInfo)
    // at this point we received ASA on our destination address. now we can swap asa to arc200.
    // when token is excchangeable, we use arc200_exchange arc200_redeem otherwise we use wnnt200 deposit
    if (store.state.arc200BridgeToken === undefined) throw Error(t('sign.destinationTokenMissing'))
    const tokenIdASA = BigInt(store.state.arc200BridgeToken)

    // first tx is the asset transfer from destination address to arc200 contract
    const params = await algodClient.getTransactionParams().do()
    const algoClient = await getAlgoClient(store.state.arc200BridgeChain)

    const clientArc200UserSender = getArc200ASAClient({
      algorand: algoClient,
      appId: BigInt(arc200TokenId),
      appName: 'asa2arc200Bridge',
      approvalSourceMap: undefined,
      clearSourceMap: undefined,
      defaultSender: destinationAddress,
      defaultSigner: undefined
    })
    let txToSign: algosdk.Transaction[] = []

    const asaOptin = await getAlgoAcountTokenOptin(store.state.arc200BridgeChain, store.state.arc200BridgeAddress, Number(tokenIdASA))

    if (!asaOptin) {
      txToSign.push(
        algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          amount: 0n,
          sender: store.state.arc200BridgeAddress,
          receiver: store.state.arc200BridgeAddress,
          suggestedParams: params,
          assetIndex: Number(tokenIdASA)
        })
      )
      console.log('Added optin txn for ASA', tokenIdASA)
    }
    const sourceAmount = BigInt(store.state.arc200BridgeAmount)
    const sinkAddress = exchangeInfo?.sink ?? algosdk.getApplicationAddress(Number(arc200TokenId)).toString()
    const approveTxs = await clientArc200UserSender.createTransaction.arc200Approve({
      args: {
        spender: sinkAddress,
        value: sourceAmount
      }
    })
    // there must be only one txn
    approveTxs.transactions.forEach((tx) => txToSign.push(tx))

    console.log('Added approve tx to sink', tokenIdASA, arc200TokenId, sinkAddress)
    console.log('Added approve txn for ARC200', arc200TokenId, sourceAmount)
    if (exchangeInfo?.sink) {
      const exchangeTxs = await clientArc200UserSender.createTransaction.arc200SwapBack({
        args: {
          amount: sourceAmount
        },
        staticFee: AlgoAmount.MicroAlgos(2000)
      })
      exchangeTxs.transactions.forEach((tx) => txToSign.push(tx))
      console.log('Added exchange arc200SwapBack txn for ARC200', arc200TokenId, sourceAmount)
    } else {
      const wnnt200Txs = await clientArc200UserSender.createTransaction.withdraw({
        args: {
          amount: sourceAmount
        },
        staticFee: AlgoAmount.MicroAlgos(2000)
      })
      wnnt200Txs.transactions.forEach((tx) => txToSign.push(tx))
      console.log('Added wnnt200 withdraw txn for ARC200', arc200TokenId, sourceAmount)
    }

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

    // Sign with destination wallet
    const signed = await signTransactions(toSignFinal)
    // Filter out any null values to satisfy the type requirement
    const filteredSigned = signed.filter((s: Uint8Array | null): s is Uint8Array => s !== null)
    if (filteredSigned.length === 0) {
      throw Error(t('sign.noTransactionsSigned'))
    }
    const result = await algodClient.sendRawTransaction(filteredSigned).do()
    console.log('Claim tx sent with txid', result.txid)
    // Wait for confirmation
    // await algodClient.status().do()
    // await algodClient.pendingTransactionInformation(result.txid).do()
    state.bridgingIsSuccessful = true
    toast.add({
      severity: 'success',
      detail: t('sign.claimSuccess'),
      life: 3000
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
    state.bridginig = false
  }
}

const bridgeAsaToArc200 = async () => {
  console.log('bridgeAsaToArc200')
  try {
    if (!store.state.arc200BridgeTokenConfiguration) throw new Error('No ARC200 token configuration selected')
    if (!store.state.arc200BridgeToken) throw new Error('No ARC200 token selected')
    const arc200TokenId = store.state.arc200BridgeTokenConfiguration?.arc200TokenId ?? store.state.arc200BridgeTokenConfiguration?.optionalArc200TokenId
    if (!arc200TokenId) throw new Error('No ARC200 token ID found in configuration')
    state.bridginig = true
    if (!store.state.arc200BridgeChain) throw Error(t('sign.destinationChainMissing'))
    console.log('store.state.destinationChain', store.state.arc200BridgeChain)
    const algodClient = await getAlgodClientByChainId(store.state.arc200BridgeChain)
    if (!algodClient) throw Error(t('sign.algodClientNotInitialized'))
    // get asset balance
    if (!store.state.arc200BridgeAddress) throw Error(t('sign.destinationAddressMissing'))
    const destinationAddress = store.state.arc200BridgeAddress
    let destinationAmount = BigInt(store.state.arc200BridgeAmount)
    const exchangeInfo: Arc200ExchangeInfo | undefined = await getExchangeInfo('arc200Bridge')
    // at this point we received ASA on our destination address. now we can swap asa to arc200.
    // when token is excchangeable, we use arc200_exchange arc200_redeem otherwise we use wnnt200 deposit
    const tokenIdASA = BigInt(store.state.arc200BridgeToken)

    // first tx is the asset transfer from destination address to arc200 contract
    const params = await algodClient.getTransactionParams().do()

    let txToSign: algosdk.Transaction[] = []
    const sinkAddress = algosdk.getApplicationAddress(Number(arc200TokenId))
    txToSign.push(
      algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        amount: destinationAmount,
        sender: destinationAddress,
        receiver: sinkAddress,
        suggestedParams: params,
        assetIndex: Number(tokenIdASA),
        note: new TextEncoder().encode('ARC200 Bridge ASA to ARC200 optin')
      })
    )
    console.log('Added transfer from destination address to sink to swap asa with arc200', tokenIdASA, arc200TokenId, sinkAddress)
    const algoClient = await getAlgoClient(store.state.arc200BridgeChain)

    const clientArc200AsaUserSender = getArc200ASAClient({
      algorand: algoClient,
      appId: BigInt(arc200TokenId),
      appName: 'asa2arc200Bridge',
      approvalSourceMap: undefined,
      clearSourceMap: undefined,
      defaultSender: destinationAddress,
      defaultSigner: undefined
    })

    if (exchangeInfo?.sink) {
      console.log('addresses sink, appaddress, sender', exchangeInfo?.sink, algosdk.getApplicationAddress(Number(arc200TokenId)).toString(), destinationAddress)
      const exchangeTxs = await clientArc200AsaUserSender.createTransaction.arc200Redeem({
        args: {
          amount: destinationAmount
        },
        staticFee: AlgoAmount.MicroAlgos(2000)
      })
      exchangeTxs.transactions.forEach((tx) => txToSign.push(tx))
      console.log('Added exchange arc200SwapBack txn for ARC200', arc200TokenId, destinationAmount)
    } else {
      const wnnt200Txs = await clientArc200AsaUserSender.createTransaction.deposit({
        args: {
          amount: destinationAmount
        },
        staticFee: AlgoAmount.MicroAlgos(2000)
      })
      wnnt200Txs.transactions.forEach((tx) => txToSign.push(tx))
      console.log('Added wnnt200 deposit txn for ARC200', arc200TokenId, destinationAmount)
    }

    // fill in the resources
    const composer = new TransactionComposer({
      algod: algodClient,
      getSigner: (address: string | Address) => dummyTransactionSigner
    })
    let i = 0
    console.log('Total tx to sign:', txToSign.length, txToSign)
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

    // Sign with destination wallet
    const signed = await signTransactions(toSignFinal)
    // Filter out any null values to satisfy the type requirement
    const filteredSigned = signed.filter((s: Uint8Array | null): s is Uint8Array => s !== null)
    if (filteredSigned.length === 0) {
      throw Error(t('sign.noTransactionsSigned'))
    }
    const result = await algodClient.sendRawTransaction(filteredSigned).do()
    console.log('Claim tx sent with txid', result.txid)
    // Wait for confirmation
    // await algodClient.status().do()
    // await algodClient.pendingTransactionInformation(result.txid).do()
    state.bridgingIsSuccessful = true
    toast.add({
      severity: 'success',
      detail: t('sign.claimSuccess'),
      life: 3000
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
    state.bridginig = false
  }
}

const resetButtonClick = async () => {
  resetStateSoft()
  await router.push('/')
}

onMounted(async () => {
  await getPublicConfiguration(false)
  fillArc200BridgeChainConfiguration()
})
</script>

<template>
  <MainBox>
    <div class="w-[80vw] md:w-full flex flex-col gap-4 items-center mb-4">
      <div class="font-bold text-xl">Aramid ARC200 Bridge</div>
      <div v-if="!state.bridgingIsSuccessful">
        <div class="w-full flex flex-col xl:flex-row gap-4 items-center">
          <WalletArc200Bridge></WalletArc200Bridge>
          <ChainSelectionArc200Bridge :arc200TokensOnly="true"></ChainSelectionArc200Bridge>
          <AssetSelectionArc200Bridge></AssetSelectionArc200Bridge>
          <Arc200ToASAOptionButton></Arc200ToASAOptionButton>
        </div>
        <div class="w-full my-8">
          <AmountArc200Bridge></AmountArc200Bridge>
        </div>

        <div v-if="state.bridginig">
          <p>{{ t('wallet.checkWallet') }}</p>
          <MainActionButton @click="state.bridginig = false">{{ t('common.cancel') }}</MainActionButton>
        </div>
        <div class="w-full" v-else>
          <MainActionButton v-if="activeNetwork == convertToNetworkCode(store.state.arc200BridgeChain ?? 0)" @click="bridginigButtonClick">Bridge</MainActionButton>
          <MainActionButton v-else-if="store.state.claimData" @click="bridginigButtonClick">{{
            t('bridge.switchNetwork', { chain: store.state.destinationChainConfiguration?.name })
          }}</MainActionButton>
          <div v-else>
            <p class="text-red-100 text-center">{{ t('claim.notReady') }} {{ store.state.arc200BridgeChain }}</p>
          </div>
        </div>
      </div>
      <div v-else-if="state.bridgingIsSuccessful">
        <p class="text-center">
          {{ t('sign.bridgeSuccessShort') }}
          <span v-if="state.resultTx">{{ t('sign.txnIdPrefix') }} <ShortTx :txId="state.resultTx" :length="6" :chain="store.state.destinationChain"></ShortTx></span>
        </p>
        <FireworksEffect></FireworksEffect>
        <MainActionButton @click="resetButtonClick">{{ t('sign.bridgeAgain') }}</MainActionButton>
      </div>
    </div>
  </MainBox>
</template>
