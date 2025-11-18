<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import logger from "@/scripts/common/conditionalLogger"
import CopyIcon from './ui/CopyIcon.vue'
import MainBox from './ui/MainBox.vue'
import WalletAddress from './ui/WalletAddress.vue'
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusBar from './status/StatusBar.vue'
import QRCodeVue3 from 'qrcode-vue3'
import { makeNoteField } from '@/scripts/aramid/makeNoteField'
import loader from '@/assets/images/loading-buffering.gif'
import { checkSourceAlgoTx } from '@/scripts/algo/checkSourceAlgoTx'
import ShortTx from './ui/ShortTx.vue'
import { checkDestinationAlgoTx } from '@/scripts/algo/checkDestinationAlgoTx'
import FireworksEffect from './ui/FireworksEffect.vue'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import { useWallet } from '@txnlab/use-wallet-vue'
import { useWallet as useAvmWallet } from 'avm-wallet-vue'
import algosdk from 'algosdk'
import getAlgodClientByChainId from '@/scripts/algo/getAlgodClientByChainId'
import { useToast } from 'primevue/usetoast'
import MainActionButton from './ui/MainActionButton.vue'
import { getClaimTx } from '@/scripts/aramid/getClaimTx'
import { getTxClaimData } from '@/scripts/aramid/getTxClaimData'
import { resetStateSoft } from '@/scripts/common/resetStateSoft'
import { CONTRACT, abi } from 'ulujs'
import { BigNumber } from 'bignumber.js'
import getAlgoAccountTokenBalance from '@/scripts/algo/getAlgoAccountTokenBalance'
import getAlgoAcountTokenOptin from '@/scripts/algo/getAlgoAccountTokenOptedIn'

const saw200ABI = {
  name: 'saw200',
  desc: 'saw200 is an intra-chain bridge for ARC200 to ASA conversion',
  methods: [
    {
      name: 'deposit',
      args: [
        {
          type: 'uint64'
        }
      ],
      returns: {
        type: 'void'
      }
    },
    {
      name: 'withdraw',
      args: [
        {
          type: 'uint64'
        }
      ],
      returns: {
        type: 'void'
      }
    }
  ],
  events: []
}

const arc200ExchangeABI = {
  name: 'arc200Exchange',
  desc: 'arc200Exchange is an exchange for ARC200 to ASA conversion',
  methods: [
    ...abi.arc200.methods,
    {
      name: 'arc200_exchange',
      args: [],
      readonly: false,
      returns: {
        type: '(uint64,address)'
      },
      desc: 'ARC-200 exchange info (external)'
    },
    {
      name: 'arc200_redeem',
      args: [
        {
          type: 'uint64',
          name: 'amount',
          desc: 'amount of ASA to redeem'
        }
      ],
      readonly: false,
      returns: {
        type: 'void',
        desc: 'None'
      },
      desc: 'Redeem ASA for ARC-200'
    },
    {
      name: 'arc200_swapBack',
      args: [
        {
          type: 'uint64',
          name: 'amount',
          desc: 'amount of ARC-200 to swap back'
        }
      ],
      readonly: false,
      returns: {
        type: 'void',
        desc: 'None'
      },
      desc: 'Swap ARC-200 back to ASA'
    }
  ],
  events: []
}

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { activeWallet } = useWallet()
const { avmActiveWallet, activeAccount } = useAvmWallet()

const routeToReviewScreen = () => {
  logger.debug('routeToReviewScreen')
  logger.debug('route', route)
  router.push({ name: 'review-sc-dc-st-dt-sa-da-a-n' })
}

const matchBridgeTxByDataClick = async () => {
  logger.debug('matchBridgeTxByDataClick')
  if (!store.state.bridgeTx && store.state.sourceChain) {
    if (store.state.sourceChainConfiguration?.type == 'algo') {
      const txId = await checkSourceAlgoTx()
      if (txId) {
        const algodClient = await getAlgodClientByChainId(store.state.sourceChain)
        try {
          if (algodClient) {
            const txInfo = await algodClient.pendingTransactionInformation(txId).do()
            if (txInfo['confirmed-round']) {
              store.state.bridgeTx = txId
            }
          }
        } catch (error) {
          logger.error('Error checking transaction confirmation:', error)
        }
      }
    }
  }
  if (!store.state.bridgeTx) {
    toast.add({
      severity: 'error',
      detail: 'Transaction has not yet been found',
      life: 3000
    })
  }
}

const claimLink = ref('')

const checkSourceTx = async () => {
  logger.debug('checkSourceTx', store.state.claimTx, store.state.bridgeTx)
  if (!store.state.claimTx && store.state.bridgeTx) {
    if (store.state.destinationChainConfiguration?.type == 'eth') {
      const claimTx = await getClaimTx(store.state.bridgeTx)
      if (claimTx) {
        store.state.claimTx = claimTx
        const claimData = await getTxClaimData(claimTx)
        if (claimData) {
          store.state.claimData = claimData
        }
        // Generate the claim link for the user to copy/share
        claimLink.value = window.location.origin + '/claim/' + store.state.bridgeTx
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
      detail: 'Please connect the destination wallet address',
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

const signWithUseWallet = async () => {
  try {
    if (!store.state.sourceChain) return
    if (!store.state.sourceToken) return
    if (!store.state.sourceAddress) return
    if (!store.state.sourceTxNote) return
    if (!activeWallet) throw Error('Use wallet is not initialized properly. Missing activeWallet')

    const algodClient = await getAlgodClientByChainId(store.state.sourceChain)
    if (!algodClient) throw Error('Algod client not initialized')
    const params = await algodClient.getTransactionParams().do()

    let signed: any

    // smart asset (arc200)
    const config = store.state.sourceTokenConfiguration as any
    if (config?.arc200TokenId || config?.asa2arc200BridgeAppId) {
      const { arc200TokenId, asa2arc200BridgeAppId, decimals, name, chainId } = store.state.sourceTokenConfiguration as any

      const sourceAddress = store.state?.sourceAddress || ''
      const tokenId = store.state.sourceToken
      const amount = BigInt(store.state.sourceAmount)
      const asaOptin = await getAlgoAcountTokenOptin(chainId, sourceAddress, Number(tokenId))
      const asaAmount = BigInt((await getAlgoAccountTokenBalance(chainId, sourceAddress, Number(tokenId)))?.toFixed(0) || '0')
      const approveAmount = asaAmount > amount ? BigInt(0) : amount - asaAmount
      const normalizedAmount = new BigNumber(BigInt(store.state.sourceAmount).toString()).div(10 ** decimals).toFixed(decimals)
      // TODO subtract the amount of ASA from the amount of ARC200
      const ci = new CONTRACT(Number(asa2arc200BridgeAppId), algodClient, undefined, abi.custom, {
        addr: sourceAddress,
        sk: new Uint8Array()
      })
      // const ciSaw200 = new CONTRACT(Number(asa2arc200BridgeAppId), algodClient, undefined, abi.custom, {
      //   addr: sourceAddress,
      //   sk: new Uint8Array()
      // })
      const ciArc200 = new CONTRACT(Number(arc200TokenId), algodClient, undefined, arc200ExchangeABI, {
        addr: sourceAddress,
        sk: new Uint8Array()
      })
      const makeConstructor = (contractId: string, abi: any) => {
        return new CONTRACT(
          Number(contractId),
          algodClient,
          undefined,
          abi,
          {
            addr: sourceAddress,
            sk: new Uint8Array()
          },
          true,
          false,
          true
        )
      }
      const builder = {
        arc200: makeConstructor(arc200TokenId, arc200ExchangeABI)
        //saw200: makeConstructor(asa2arc200BridgeAppId, saw200ABI)
      }
      // transaction group
      //   conditional asset optin
      //   arc200_swapBack
      //   aramid bridge txn (axfer w/ note)
      // TODO convert only old UNIT to ARC200 using saw200
      const buildN = []
      // REM converts old UNIT to ARC200 using saw200
      // {
      //   const txnO = (await builder.arc200.arc200_approve(algosdk.getApplicationAddress(Number(unitAppId)), approveAmount))?.obj
      //   const msg = `Approving ARC200 to ASA conversion for ${normalizedAmount} ${name}`
      //   buildN.push({
      //     ...txnO,
      //     note: new TextEncoder().encode(msg)
      //   })
      // }
      // {
      //   const txnO = (await builder.saw200.deposit(approveAmount))?.obj
      //   const msg = `Depositing ${normalizedAmount} ${name} for ARC200 to ASA conversion`
      //   const assetOptin = {
      //     xaid: Number(tokenId),
      //     snd: sourceAddress,
      //     arcv: sourceAddress
      //   }
      //   buildN.push({
      //     ...txnO,
      //     ...assetOptin,
      //     note: new TextEncoder().encode(msg)
      //   })
      // }
      // REM use arc200 exchange to convert stray VSA to ARC200
      if (asaAmount > 0) {
        const txnO = (await builder.arc200.arc200_redeem(asaAmount))?.obj
        const note = new TextEncoder().encode(`Converting ${asaAmount} ${name} VSA to ARC200`)
        const assetTransfer = {
          type: 'axfer',
          xaid: Number(tokenId),
          aamt: asaAmount,
          arcv: algosdk.getApplicationAddress(Number(arc200TokenId))
        }
        buildN.push({
          ...txnO,
          ...assetTransfer,
          note
        })
      }
      // REM use arc200 exchange to convert UNIT to VSA
      // REM <https://docs.google.com/document/d/1Uy9kbWF6yfM7W_VbBp1W5c2VqVdcoCj_hyoXUf1FIV0>
      // REM <https://github.com/NautilusOSS/nautilus-interface/blob/beta/src/components/Tools/Arc200VsaConverter/index.tsx#L687>
      {
        const txnO = (await builder.arc200.arc200_swapBack(BigInt(store.state.sourceAmount)))?.obj // ignored
        const assetOptin =
          asaAmount === BigInt(0)
            ? {
                xaid: Number(tokenId),
                snd: store.state.sourceAddress,
                arcv: store.state.sourceAddress
              }
            : {}
        const note = new TextEncoder().encode(`Converting ${normalizedAmount} ${name} ARC200 to VSA`)
        buildN.push({
          ...txnO,
          ...assetOptin,
          note
        })
      }
      {
        const txnO = (await builder.arc200.arc200_approve(algosdk.getApplicationAddress(Number(arc200TokenId)), 0))?.obj // ignored
        const assetTransfer = {
          xaid: Number(tokenId),
          snd: sourceAddress,
          arcv: store.state.sourceBridgeAddress,
          xamt: BigInt(store.state.sourceAmount),
          xano: new Uint8Array(Buffer.from(store.state.sourceTxNote))
        }
        buildN.push({
          ...txnO,
          ...assetTransfer,
          ignore: true
        })
      }
      ci.setFee(2000)
      ci.setEnableGroupResourceSharing(true)
      ci.setExtraTxns(buildN)
      //ci.setGroupResourceSharingStrategy('merge')
      const customR = await ci.custom()
      if (!customR.success) {
        throw Error(customR.error)
      }
      signed = await activeWallet.value?.signTransactions(customR.txns.map((txn: string) => new Uint8Array(Buffer.from(txn, 'base64'))))
    }
    // algo or asa
    else {
      const tx =
        Number(store.state.sourceToken) > 0
          ? algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
              amount: BigInt(store.state.sourceAmount),
              from: store.state.sourceAddress,
              to: store.state.sourceBridgeAddress,
              suggestedParams: params,
              note: new Uint8Array(Buffer.from(store.state.sourceTxNote)),
              assetIndex: Number(store.state.sourceToken)
            })
          : algosdk.makePaymentTxnWithSuggestedParamsFromObject({
              amount: BigInt(store.state.sourceAmount),
              from: store.state.sourceAddress,
              to: store.state.sourceBridgeAddress,
              suggestedParams: params,
              note: new Uint8Array(Buffer.from(store.state.sourceTxNote))
            })

      signed = await activeWallet.value?.signTransactions([tx])
    }
    if (signed && signed.length > 0) {
      // res.txId is the txId of the first transaction in the signed array
      // algosdk.decodeSignedTransaction(signed.pop()).txn.txID() is the txId of the last transaction in the signed array
      await algodClient.sendRawTransaction(signed).do()
      const tx = algosdk.decodeSignedTransaction(signed.pop()).txn.txID()
      store.state.bridgeTx = tx
    }
  } catch (e: any) {
    logger.error(e)
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
  logger.debug('resetButtonClick')
  store.state.claimData = undefined
  await router.push({ name: 'bridge-sc-dc-st-dt-sa-da-a-n' })
}

const claimTxPending = ref(false)

const claimButtonClick = async () => {
  logger.debug('claimButtonClick')
  try {
    claimTxPending.value = true
    if (!store.state.destinationTokenConfiguration?.arc200TokenId) return

    // Check for destination wallet connection
    if (!avmActiveWallet?.value) throw Error('Destination wallet not connected')
    if (activeAccount.value?.address !== store.state.destinationAddress) {
      throw Error('Please connect the destination wallet address')
    }
    if (!store.state.destinationChain) throw Error('Destination chain is not set')
    const algodClient = await getAlgodClientByChainId(store.state.destinationChain)
    if (!algodClient) throw Error('Algod client not initialized')

    // get asset balance
    if (!store.state.destinationAddress) throw Error('Destination address is not set')
    const accAssetInfo = await algodClient.accountAssetInformation(store.state.destinationAddress, Number(store.state.destinationToken)).do()
    const assetBalance = accAssetInfo['asset-holding']['amount']

    // Initialize the main contract interface
    const ci = new CONTRACT(Number(store.state.destinationTokenConfiguration.arc200TokenId), algodClient, undefined, abi.custom, {
      addr: store.state.destinationAddress,
      sk: new Uint8Array()
    })

    // TODO depreciate saw200 claim
    // Create builder
    const builder = {
      arc200: new CONTRACT(
        Number(store.state.destinationTokenConfiguration.arc200TokenId),
        algodClient,
        undefined,
        arc200ExchangeABI,
        {
          addr: store.state.destinationAddress,
          sk: new Uint8Array()
        },
        true,
        false,
        true
      )
      // saw200: new CONTRACT(
      //   Number(store.state.destinationTokenConfiguration.arc200TokenId),
      //   algodClient,
      //   undefined,
      //   saw200ABI,
      //   {
      //     addr: store.state.destinationAddress,
      //     sk: new Uint8Array()
      //   },
      //   true,
      //   false,
      //   true
      // )
    }

    const buildN = []

    // Add withdrawal transaction (saw200)
    // {
    //   const amount = BigInt(store.state.destinationAmount)
    //   const decimals = store.state.destinationTokenConfiguration.decimals
    //   const txnO = (await builder.saw200.withdraw(assetBalance))?.obj
    //   const assetTransfer = {
    //     type: 'axfer',
    //     xaid: Number(store.state.destinationToken),
    //     aamt: assetBalance,
    //     arcv: algosdk.getApplicationAddress(Number(store.state.destinationTokenConfiguration.arc200TokenId))
    //   }
    //   buildN.push({
    //     ...txnO,
    //     ...assetTransfer,
    //     note: new TextEncoder().encode(`Withdrawing ${store.state.destinationAmountFormatted} ${store.state.destinationTokenConfiguration.name}`)
    //   })
    // }
    // arc200_exchange redeem
    {
      const amount = BigInt(store.state.destinationAmount)
      const decimals = store.state.destinationTokenConfiguration.decimals
      const txnO = (await builder.arc200.arc200_redeem(assetBalance))?.obj
      const assetTransfer = {
        type: 'axfer',
        xaid: Number(store.state.destinationToken),
        aamt: assetBalance,
        arcv: algosdk.getApplicationAddress(Number(store.state.destinationTokenConfiguration.arc200TokenId))
      }
      buildN.push({
        ...txnO,
        ...assetTransfer,
        note: new TextEncoder().encode(`arc200_exchange redeem ${assetBalance} ${store.state.destinationTokenConfiguration.name}`)
      })
    }

    // Configure and execute the transaction group
    ci.setFee(2000)
    ci.setEnableGroupResourceSharing(true)
    ci.setExtraTxns(buildN)
    const customR = await ci.custom()
    if (!customR.success) {
      throw Error(customR.error)
    }

    // Sign with destination wallet
    const signed = await avmActiveWallet.value.signTransactions(customR.txns.map((txn: string) => new Uint8Array(Buffer.from(txn, 'base64'))))

    // Filter out any null values to satisfy the type requirement
    const filteredSigned = signed.filter((s: Uint8Array | null): s is Uint8Array => s !== null)
    if (filteredSigned.length === 0) {
      throw Error('No transactions signed')
    }
    const result = await algodClient.sendRawTransaction(filteredSigned).do()

    // Wait for confirmation
    await algodClient.status().do()
    await algodClient.pendingTransactionInformation(result.txId).do()

    toast.add({
      severity: 'success',
      detail: 'Successfully claimed tokens',
      life: 3000
    })

    // Reset state and redirect
    await resetButtonClick()
  } catch (e: any) {
    logger.error(e)
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
        class="px-2 items-center flex backdrop-blur-xl rounded-full place-content-start select-none justify-between opacity-70 font-semibold text-[14px] cursor-pointer"
        style="border: 1px solid rgba(246, 246, 246, 0.16); background: rgba(246, 246, 246, 0.16)"
        @click="routeToReviewScreen"
      >
        <div class="flex flex-row-reverse items-center">
          <img alt="CaretLeftIcon" loading="lazy" width="20" height="20" decoding="async" src="../assets/images/CaretLeft.svg" style="color: transparent" />
        </div>
        Back
      </div>
      <div v-if="!store.state.bridgeTx" class="font-bold text-xl">Sign the transaction</div>
      <div v-else-if="store.state.claimTx" class="font-bold text-xl">Successful bridging</div>
    </div>

    <StatusBar></StatusBar>
    <div v-if="!store.state.bridgeTx">
      <div v-if="store.state.sourceAlgoConnectorType == AlgoConnectorType.QRCode">
        <p>
          Make sure you send {{ store.state.sourceAmountFormatted }} {{ store.state.sourceTokenConfiguration?.name }}
          <span v-if="Number(store.state.sourceTokenConfiguration?.tokenId) > 0"> ({{ store.state.sourceTokenConfiguration?.tokenId }}) </span> to bridge address
          <WalletAddress :address="store.state.sourceBridgeAddress"></WalletAddress> <CopyIcon :text="store.state.sourceBridgeAddress"></CopyIcon> at the
          {{ store.state.sourceChainConfiguration?.name }} chain with note field <CopyIcon :text="store.state.sourceTxNote"></CopyIcon>
        </p>
        <div class="text-center">
          <p>Scan the QR Code with your wallet, or tap it to use the wallet on the same device.</p>
          <a v-if="store.state.qrContent" :href="`web+${store.state.qrContent}`" class="m-auto my-2" style="width: 200px; height: 200px; display: inline-block">
            <QRCodeVue3 :width="200" :height="200" :value="store.state.qrContent" myclass="m-auto" />
          </a>
        </div>
        <div class="text-center font-bold m-4">
          <img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> Please scan QR code, and send the transaction to the blockchain from your wallet
          <MainActionButton @click="matchBridgeTxByDataClick">Transaction has been submitted</MainActionButton>
        </div>
      </div>
      <div v-if="store.state.sourceAlgoConnectorType == AlgoConnectorType.UseWallet" class="text-center font-bold m-4">
        <p><img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> Please sign your transaction in your {{ activeWallet?.name }} wallet</p>
      </div>
    </div>
    <div v-else-if="store.state.bridgeTx && !store.state.claimTx">
      <img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> This step usually takes less then 3 minutes. Your transaction ID:
      <ShortTx :txId="store.state.bridgeTx" :length="6" :chain="store.state.sourceChain"></ShortTx>

      <!-- Display claim link when ready for EVM destinations -->
      <div v-if="claimLink && store.state.destinationChainConfiguration?.type == 'eth'" class="mt-6 p-4 rounded-lg border border-accent bg-primary/10">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <svg class="h-5 w-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 class="font-semibold text-primary">Claim Link Ready</h3>
          </div>
          <p class="text-sm text-gray-300">
            Once indexing is complete, you or anyone with this link can claim the tokens on the destination chain.
            Save this link to bookmark or share it with the recipient.
          </p>
          <div class="flex items-center gap-2 mt-2">
            <input
              type="text"
              readonly
              :value="claimLink"
              class="flex-1 bg-main border border-accent rounded-lg px-3 py-2 text-sm font-mono text-gray-300 focus:outline-none"
            />
            <CopyIcon :text="claimLink" :title="`Copy claim link: ${claimLink}`"></CopyIcon>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="store.state.claimTx && store.state.destinationChainConfiguration?.type == 'algo'">
      <div v-if="store.state.destinationChainConfiguration?.name === 'Voi'">
        <p>Your assets have been bridged successfully!</p>
        <p>Transaction ID: <ShortTx :txId="store.state.claimTx" :length="6" :chain="store.state.destinationChain"></ShortTx></p>
        <p>Please check your wallet to verify the received assets.</p>
        <div v-if="store.state.destinationTokenConfiguration?.arc200TokenId">
          <template v-if="claimTxPending">
            <p class="text-center" role="status" aria-live="polite">
              <span class="sr-only">Processing claim transaction</span>
              <img :src="loader" alt="Loading" height="18" width="18" class="inline-block" />
              Claiming transaction in progress...
            </p>
          </template>
          <template v-else>
            <MainActionButton @click="claimButtonClick" tooltip="The bridged asset may need to be claimed to be used in the ecosystem"> Claim Assets </MainActionButton>
          </template>
        </div>
        <FireworksEffect></FireworksEffect>
        <MainActionButton @click="resetButtonClick">Bridge again</MainActionButton>
      </div>
      <div v-else>
        <p>Bridging successful! The assets are at the destination account. TXN ID: <ShortTx :txId="store.state.claimTx" :length="6" :chain="store.state.destinationChain"></ShortTx></p>
        <FireworksEffect></FireworksEffect>
        <MainActionButton @click="resetButtonClick">Bridge again</MainActionButton>
      </div>
    </div>
    <div v-else>
      <img :src="loader" alt="Loading" height="18" width="18" class="inline-block" /> Please wait a minute.
      <span v-if="store.state.bridgeTx">Your transaction ID: <ShortTx :txId="store.state.bridgeTx" :length="6" :chain="store.state.sourceChain"></ShortTx></span>
    </div>
  </MainBox>
</template>
