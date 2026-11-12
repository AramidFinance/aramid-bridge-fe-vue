<script setup lang="ts">
import type { TokenItem } from '@/scripts/interface/mapping/TokenItem'
import getAlgoAcountTokenOptin from '@/scripts/algo/getAlgoAccountTokenOptedIn'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { resetStateSoft } from '@/scripts/common/resetStateSoft'
import { useAppStore } from '@/stores/app'
import { Config, populateAppCallResources } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { TransactionComposer } from '@algorandfoundation/algokit-utils/types/composer'
import { getChainIdByUseWalletNetwork, getUseWalletNetworkId, useWalletNetwork } from '@/scripts/algo/useWalletSync'
import { isPositiveBaseUnits } from '@/scripts/common/baseUnits'
import { showError } from '@/scripts/common/showError'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import { useWallet } from '@txnlab/use-wallet-vue'
import algosdk, { Address } from 'algosdk'
import { getArc200ASAClient, type Arc200ExchangeInfo } from 'arc200-client'
import { useToast } from 'primevue/usetoast'
import { onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import dummyTransactionSigner from '../scripts/algo/dummyTransactionSigner'
import getAlgoAccountARC200TokenBalance from '../scripts/algo/getAlgoAccountARC200TokenBalance'
import getAlgoClient from '../scripts/algo/getAlgoClient'
import getAlgodClientByChainId from '../scripts/algo/getAlgodClientByChainId'
import getExchangeInfo from '../scripts/algo/getExchangeInfo'
import { DEFAULT_ARC200_CHAIN, fillArc200BridgeChainConfiguration } from '../scripts/events/fillArc200BridgeChainConfiguration'
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

Config.configure({ debug: true })

const useWalletState = useWallet()
const { activeNetwork, assertSigner, signAs, switchToChain } = useWalletNetwork(useWalletState)
const toast = useToast()
const { t } = useI18n()
const router = useRouter()
const store = useAppStore()
const route = useRoute()
/** The ARC200 chain the route asks for (none: the Voi default), and whether its network is unknown. */
const routeChain = () => {
  const network = route.params['network']
  const chainId = typeof network === 'string' ? getChainIdByUseWalletNetwork(network) : undefined
  return { chainId, unknown: typeof network === 'string' && !chainId }
}
/** The chain the route asks for, or the default ARC200 chain. */
const routeTargetChain = () => routeChain().chainId ?? DEFAULT_ARC200_CHAIN
/** Whether the chain is selected together with its configuration. */
const isOnChain = (chainId: number) => store.state.arc200BridgeChain === chainId && store.state.arc200BridgeChainConfiguration?.chainId === chainId
// Arc200ClaimView renders this page right after (re)loading the public configuration: (re)select the
// route's chain with the fresh configuration before child components read it
fillArc200BridgeChainConfiguration(routeTargetChain())
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

/**
 * Applies the route: selects the route's chain (a chain without configuration falls back to the default
 * one, which drops the token selected for another chain), then applies the route's token params. Only
 * the latest run applies anything when the route changes while one is waiting.
 */
// params of the last token URL this page navigated to (route.params lags while that navigation runs);
// cleared when an external navigation is applied
let lastTokenRoute: Record<string, string> | undefined
// URLs of navigations this page makes from the store while they are in flight (counted: two
// navigations to the same URL can overlap)
const ownNavigations = new Map<string, number>()
const navigate = async (to: RouteLocationRaw, replace = false) => {
  let fullPath: string | undefined
  try {
    fullPath = router.resolve(to).fullPath
    ownNavigations.set(fullPath, (ownNavigations.get(fullPath) ?? 0) + 1)
    await (replace ? router.replace(to) : router.push(to))
  } catch (e: any) {
    console.error(e)
  } finally {
    if (fullPath) {
      const count = (ownNavigations.get(fullPath) ?? 1) - 1
      if (count > 0) ownNavigations.set(fullPath, count)
      else ownNavigations.delete(fullPath)
    }
  }
}

let routeRun = 0
let unmounted = false
onBeforeUnmount(() => {
  unmounted = true
})
const applyRoute = async () => {
  const run = ++routeRun
  try {
    const { chainId, unknown } = routeChain()
    const targetChainId = routeTargetChain()
    const onTargetChain = isOnChain(targetChainId)
    const { tokenId, amount, direction } = route.params
    // nothing to apply when the route already matches the store (e.g. it was just written from the store)
    if (
      !unknown &&
      onTargetChain &&
      (tokenId ? tokenId === store.state.arc200BridgeToken && amount === store.state.arc200BridgeAmount && direction === store.state.arc200BridgeDirection : !store.state.arc200BridgeToken)
    ) {
      return
    }
    await getPublicConfiguration(false)
    if (unmounted || run !== routeRun || !store.state.publicConfiguration) return
    if (!isOnChain(targetChainId)) fillArc200BridgeChainConfiguration(targetChainId)
    if (unknown || (chainId && store.state.arc200BridgeChain !== chainId)) {
      // the route's network is unknown or has no configuration: its token params belong to another chain
      await navigate({ name: 'arc200-claim' }, true)
      return
    }
    if (route.params['tokenId'] && route.params['amount'] && route.params['direction']) {
      // select the token first and only then set the route's amount (in that token's units), so the
      // token change does not re-derive it from the input
      store.state.arc200BridgeToken = route.params['tokenId'] as string
      fillArc200BridgeTokenConfiguration(store.state.arc200BridgeToken)
      store.state.arc200BridgeAmount = route.params['amount'] as string
      store.state.arc200BridgeDirection = route.params['direction'] as 'ARC200ToASA' | 'ASAToARC200'
      if (store.state.arc200BridgeDirection !== 'ARC200ToASA' && store.state.arc200BridgeDirection !== 'ASAToARC200') {
        store.state.arc200BridgeDirection = 'ARC200ToASA'
      }
    } else if (!route.params['tokenId'] && store.state.arc200BridgeToken) {
      // a URL without a token (e.g. Back to /arc200-claim/) clears the token selection
      store.state.arc200BridgeToken = undefined
      store.state.arc200BridgeTokenConfiguration = undefined
    }
  } catch (e: any) {
    showError(toast, e)
  }
}

onMounted(async () => {
  state.inputTx = route.params['sourceTxId'] as string
  state.fromRoute = !!state.inputTx
  // Arc200ClaimView has just (re)loaded the public configuration
  await applyRoute()
  state.mounted = true
})
// the arc200-claim routes share this component instance, so back/forward between them does not remount it
// (navigations this page made from the store are not applied back: the store may have moved on since)
watch(
  [() => route.params['network'], () => route.params['tokenId'], () => route.params['amount'], () => route.params['direction']],
  () => {
    if (ownNavigations.has(route.fullPath)) return
    lastTokenRoute = undefined
    applyRoute()
  },
  { flush: 'sync' }
)
const fillInRoute = () => {
  if (!state.mounted) return
  if (!store.state.arc200BridgeToken) {
    // no token selected (e.g. dropped by a chain change): the URL must not keep the old token params
    lastTokenRoute = undefined
    if (route.params['network']) navigate({ name: 'arc200-claim' }, true)
    return
  }
  const network = getUseWalletNetworkId(store.state.arc200BridgeChain ?? DEFAULT_ARC200_CHAIN)
  if (!network) return

  const params = {
    network,
    tokenId: store.state.arc200BridgeToken,
    amount: store.state.arc200BridgeAmount || '0',
    direction: store.state.arc200BridgeDirection ?? 'ARC200ToASA'
  }
  // typing an amount should not add a history entry per keystroke: only a new network, token or
  // direction is a new entry
  // several watchers can ask for the same URL in one flush: a second identical request must not turn the
  // first one's push into a replace
  if (lastTokenRoute && (['network', 'tokenId', 'amount', 'direction'] as const).every((key) => lastTokenRoute?.[key] === params[key])) return
  const current = lastTokenRoute ?? (route.name === 'arc200-claim-t' ? route.params : undefined)
  const amountOnly = !!current && current['network'] === params.network && current['tokenId'] === params.tokenId && current['direction'] === params.direction
  lastTokenRoute = params
  navigate({ name: 'arc200-claim-t', params }, amountOnly)
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

// the use-wallet manager is shared with other pages: sign only with the account this page is bound to,
// checked before building the transactions and again right before signing them (with their sender)
/** Everything the bridge transactions are built from, captured and validated when Bridge was clicked. */
interface BridgeOrder {
  chainId: number
  sender: string
  tokenId: string
  tokenConfiguration: TokenItem
  arc200TokenId: NonNullable<TokenItem['arc200TokenId']>
  amount: string
}

const boundChain = (chain: number | undefined): number => {
  if (!chain || store.state.arc200BridgeAlgoConnectorType !== AlgoConnectorType.UseWallet) throw Error(t('sign.useWalletNotInitialized'))
  return chain
}
const signBound = (sender: string, chain: number | undefined, txns: algosdk.Transaction[]) => signAs(boundChain(chain), sender, txns)

const bridginigButtonClick = async () => {
  try {
    state.bridginig = true
    if (!store.state.arc200BridgeChain) throw new Error('No destination chain set')
    const chain = store.state.arc200BridgeChain
    const code = getUseWalletNetworkId(chain)
    if (!code) throw Error(t('sign.useWalletNotInitialized'))

    if (activeNetwork.value != code) {
      toast.add({
        severity: 'warn',
        detail: t('claim.switchNetworkPrompt', { chain: store.state.arc200BridgeChainConfiguration?.name }),
        life: 10000
      })
      state.bridginig = false
      await switchToChain(chain)
      return
    }

    assertSigner(boundChain(store.state.arc200BridgeChain), store.state.arc200BridgeAddress)
    // the inputs stay editable while bridging: build everything from the values checked here
    const tokenConfiguration = store.state.arc200BridgeTokenConfiguration
    const tokenId = store.state.arc200BridgeToken
    if (!tokenConfiguration) throw new Error('No ARC200 token configuration selected')
    if (!tokenId) throw new Error('No ARC200 token selected')
    const arc200TokenId = tokenConfiguration.arc200TokenId ?? tokenConfiguration.optionalArc200TokenId
    if (!arc200TokenId) throw new Error('No ARC200 token ID found in configuration')
    if (!store.state.arc200BridgeAddress) throw Error(t('sign.destinationAddressMissing'))
    const order: BridgeOrder = {
      chainId: boundChain(store.state.arc200BridgeChain),
      sender: store.state.arc200BridgeAddress,
      tokenId,
      tokenConfiguration,
      arc200TokenId,
      amount: store.state.arc200BridgeAmount
    }
    if (!isPositiveBaseUnits(order.amount)) throw Error(t('bridge.amountZero'))

    if (store.state.arc200BridgeDirection === 'ARC200ToASA') {
      await bridgeArc200ToAsa(order)
    } else if (store.state.arc200BridgeDirection === 'ASAToARC200') {
      await bridgeAsaToArc200(order)
    } else {
      throw new Error('No bridge direction selected')
    }

    state.bridginig = false
  } catch (e: any) {
    state.bridginig = false
    showError(toast, e, 10000)
  }
}

const bridgeArc200ToAsa = async (order: BridgeOrder) => {
  console.log('bridgeArc200ToAsa')
  try {
    // the transactions below are built for this chain and sender
    const { arc200TokenId, chainId: builtChain, sender: destinationAddress } = order
    state.bridginig = true
    const algodClient = await getAlgodClientByChainId(builtChain)
    if (!algodClient) throw Error(t('sign.algodClientNotInitialized'))
    const exchangeInfo: Arc200ExchangeInfo | undefined = await getExchangeInfo('arc200Bridge')
    console.log('exchangeInfo', exchangeInfo)
    // at this point we received ASA on our destination address. now we can swap asa to arc200.
    // when token is excchangeable, we use arc200_exchange arc200_redeem otherwise we use wnnt200 deposit
    const tokenIdASA = BigInt(order.tokenId)

    // first tx is the asset transfer from destination address to arc200 contract
    const params = await algodClient.getTransactionParams().do()
    const algoClient = await getAlgoClient(builtChain)

    const clientArc200UserSender = getArc200ASAClient({
      algorand: algoClient,
      appId: BigInt(arc200TokenId),
      appName: 'asa2arc200Bridge',
      approvalSourceMap: undefined,
      clearSourceMap: undefined,
      defaultSender: destinationAddress,
      defaultSigner: undefined
    })
    const sourceAmount = BigInt(order.amount)
    const contractAddress = algosdk.getApplicationAddress(Number(arc200TokenId)).toString()
    const txToSign: algosdk.Transaction[] = []

    const asaOptin = await getAlgoAcountTokenOptin(builtChain, destinationAddress, Number(tokenIdASA))

    if (!asaOptin) {
      txToSign.push(
        algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          amount: 0n,
          sender: destinationAddress,
          receiver: destinationAddress,
          suggestedParams: params,
          assetIndex: Number(tokenIdASA)
        })
      )
      console.log('Added optin txn for ASA', tokenIdASA)
    }

    if (!exchangeInfo?.sink) {
      // wnnt200 protocol requires to create box first if it does not exists
      let needCreateBox = false
      try {
        const balance = await getAlgoAccountARC200TokenBalance(builtChain, contractAddress, arc200TokenId)
        console.log('balance of arc200 for address before box creation check', balance)
        if (balance === 0n) {
          needCreateBox = true
        }
      } catch (e) {
        console.log('box for arc200 does not exist, creating it', e)
        needCreateBox = true
      }

      if (needCreateBox) {
        txToSign.push(
          algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            amount: 28500,
            sender: destinationAddress,
            receiver: contractAddress,
            suggestedParams: params,
            note: new TextEncoder().encode('ARC200 Bridge ASA to ARC200 funding for box creation')
          })
        )

        const createBoxTxs = await clientArc200UserSender.createTransaction.createBalanceBox({ args: { owner: contractAddress } })
        createBoxTxs.transactions.forEach((tx) => txToSign.push(tx))
        console.log('Added createBalanceBox app call', contractAddress)
      }
    }

    console.log('Added approve tx to address', tokenIdASA, arc200TokenId, contractAddress)
    console.log('Added approve txn for ARC200', arc200TokenId, sourceAmount)
    if (exchangeInfo?.sink) {
      const approveTxs = await clientArc200UserSender.createTransaction.arc200Approve({
        args: {
          spender: contractAddress,
          value: sourceAmount
        }
      })
      // there must be only one txn
      approveTxs.transactions.forEach((tx) => txToSign.push(tx))

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
      getSigner: (_address: string | Address) => dummyTransactionSigner
    })
    txToSign.forEach((txn) => {
      composer.addTransaction(txn)
    })
    const { atc } = await composer.build()
    console.log('to populate resources', txToSign)
    const populatedAtc = await populateAppCallResources(atc, algodClient)
    const group = populatedAtc.buildGroup()
    const toSignFinal = group.map((txnWithSigner) => {
      return txnWithSigner.txn
    })
    console.log('signing txns', toSignFinal)

    // Sign with destination wallet
    const signed = await signBound(destinationAddress, builtChain, toSignFinal)
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
    showError(toast, e)
  } finally {
    state.bridginig = false
  }
}

const bridgeAsaToArc200 = async (order: BridgeOrder) => {
  console.log('bridgeAsaToArc200')
  try {
    // the transactions below are built for this chain and sender
    const { arc200TokenId, chainId: builtChain, sender: destinationAddress } = order
    state.bridginig = true
    const algodClient = await getAlgodClientByChainId(builtChain)
    if (!algodClient) throw Error(t('sign.algodClientNotInitialized'))
    const destinationAmount = BigInt(order.amount)
    const exchangeInfo: Arc200ExchangeInfo | undefined = await getExchangeInfo('arc200Bridge')
    // at this point we received ASA on our destination address. now we can swap asa to arc200.
    // when token is excchangeable, we use arc200_exchange arc200_redeem otherwise we use wnnt200 deposit
    const tokenIdASA = BigInt(order.tokenId)

    // first tx is the asset transfer from destination address to arc200 contract
    const params = await algodClient.getTransactionParams().do()

    const algoClient = await getAlgoClient(builtChain)

    const clientArc200AsaUserSender = getArc200ASAClient({
      algorand: algoClient,
      appId: BigInt(arc200TokenId),
      appName: 'asa2arc200Bridge',
      approvalSourceMap: undefined,
      clearSourceMap: undefined,
      defaultSender: destinationAddress,
      defaultSigner: undefined
    })

    const contractAddress = algosdk.getApplicationAddress(Number(arc200TokenId))
    const txToSign: algosdk.Transaction[] = []

    if (!exchangeInfo?.sink) {
      // wnnt200 protocol requires to create box first if it does not exists
      let needCreateBox = false
      try {
        const balance = await getAlgoAccountARC200TokenBalance(builtChain, destinationAddress, arc200TokenId)
        console.log('balance of arc200 for address before box creation check', balance)
        if (balance === 0n) {
          needCreateBox = true
        }
      } catch (e) {
        console.log('box for arc200 does not exist, creating it', e)
        needCreateBox = true
      }

      if (needCreateBox) {
        txToSign.push(
          algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            amount: 28500,
            sender: destinationAddress,
            receiver: contractAddress,
            suggestedParams: params,
            note: new TextEncoder().encode('ARC200 Bridge ASA to ARC200 funding for box creation')
          })
        )

        const createBoxTxs = await clientArc200AsaUserSender.createTransaction.createBalanceBox({ args: { owner: destinationAddress } })
        createBoxTxs.transactions.forEach((tx) => txToSign.push(tx))
        console.log('Added createBalanceBox app call', destinationAddress)
      }
    }
    txToSign.push(
      algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        amount: destinationAmount,
        sender: destinationAddress,
        receiver: contractAddress,
        suggestedParams: params,
        assetIndex: Number(tokenIdASA),
        note: new TextEncoder().encode('ARC200 Bridge ASA to ARC200 optin')
      })
    )
    console.log('Added transfer from destination address to address to swap asa with arc200', tokenIdASA, arc200TokenId, contractAddress)
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
      getSigner: (_address: string | Address) => dummyTransactionSigner
    })
    console.log('Total tx to sign:', txToSign.length, txToSign)
    txToSign.forEach((txn) => {
      composer.addTransaction(txn)
    })
    const { atc } = await composer.build()
    txToSign.map((tx, idx) => {
      tx.group = undefined
      console.log('Built tx', idx, tx.txID())
    })
    // const sim = await algoClient.setSigner(txToSign[1].sender, dummyTransactionSigner).newGroup().addTransaction(txToSign[0]).addTransaction(txToSign[1]).addTransaction(txToSign[2]).simulate({
    //   skipSignatures: true,
    //   allowMoreLogging: true,
    //   allowUnnamedResources: true
    // })
    // const source = await algodClient.getApplicationByID(Number(arc200TokenId)).do()
    // const disassembled = await algodClient.disassemble(source.params.approvalProgram).do()
    // console.log('Disassembled approval program:', disassembled)
    // const compile = await algodClient.compile(disassembled.result).sourcemap(true).do()
    // if (compile.sourcemap) {
    //   const raw = compile.sourcemap.data as Map<string, any>
    //   const map = {
    //     version: Number(raw.get('version')),
    //     sources: raw.get('sources'),
    //     names: raw.get('names'),
    //     mappings: raw.get('mappings')
    //   } as {
    //     version: number
    //     sources: string[]
    //     names: string[]
    //     mappings: string
    //   }
    //   console.log('Compiled approval program with sourcemap:', compile, map.version, map)

    //   const sm = new ProgramSourceMap(map) // { version, sources, names, mappings }
    //   const pcs = sm.getPcs()
    //   let sourceLines = disassembled.result.split('\n')
    //   pcs.map((pc) => {
    //     const lines = sm.getLocationForPc(pc)
    //     if (lines?.line) {
    //       const line = lines.line
    //       if (sourceLines.length > line) {
    //         // fill in white spaces to length at least 30 chars
    //         while (sourceLines[line].length < 30) {
    //           sourceLines[line] = sourceLines[line] + ' '
    //         }

    //         sourceLines[line] = sourceLines[line] + ` // PC: ${pc}`
    //       }
    //     }
    //   })
    //   console.log('ProgramSourceMap:', sm, pcs, sourceLines.join('\n'))
    // }
    // const sim = await composer.simulate({
    //   skipSignatures: true,
    //   allowMoreLogging: true,
    //   allowUnnamedResources: true
    // })
    // console.log('Simulation results:', sim)

    const populatedAtc = await populateAppCallResources(atc, algodClient)
    const group = populatedAtc.buildGroup()
    const toSignFinal = group.map((txnWithSigner) => {
      return txnWithSigner.txn
    })
    console.log('toSignFinal', toSignFinal)
    // Sign with destination wallet
    const signed = await signBound(destinationAddress, builtChain, toSignFinal)
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
    showError(toast, e)
  } finally {
    state.bridginig = false
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
          <MainActionButton v-if="activeNetwork == getUseWalletNetworkId(store.state.arc200BridgeChain)" @click="bridginigButtonClick">Bridge</MainActionButton>
          <MainActionButton v-else-if="store.state.claimData" @click="bridginigButtonClick">{{
            t('bridge.switchNetwork', { chain: store.state.arc200BridgeChainConfiguration?.name })
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
