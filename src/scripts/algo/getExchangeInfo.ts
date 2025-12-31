import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import type algosdk from 'algosdk'
import { getArc200ASAClient, type Arc200ExchangeInfo } from 'arc200-client'
import { useAppStore } from '../../stores/app'
import getAlgoClient from './getAlgoClient'
import getAlgodClientByChainId from './getAlgodClientByChainId'

const getExchangeInfo = async (type: 'source' | 'destination' | 'arc200Bridge'): Promise<Arc200ExchangeInfo | undefined> => {
  try {
    const store = useAppStore()
    console.log('Getting exchange info for type', type)

    let arc200Token: bigint | undefined = undefined
    let algoClient: AlgorandClient | null = null
    if (type === 'source') {
      if (!store.state.sourceChain) return undefined
      if (!store.state.sourceTokenConfiguration) return undefined
      arc200Token = BigInt(store.state.sourceTokenConfiguration.arc200TokenId ?? 0n)
      const algodClient = await getAlgodClientByChainId(store.state.sourceChain)
      if (!algodClient) return undefined
      algoClient = await getAlgoClient(store.state.sourceChain)
    } else if (type === 'destination') {
      if (!store.state.destinationChain) return undefined
      if (!store.state.destinationTokenConfiguration) return undefined
      arc200Token = BigInt(store.state.destinationTokenConfiguration.arc200TokenId ?? 0n)
      const algodClient = await getAlgodClientByChainId(store.state.destinationChain)
      if (!algodClient) return undefined
      algoClient = await getAlgoClient(store.state.destinationChain)
    } else if (type === 'arc200Bridge') {
      if (!store.state.arc200BridgeAddress) return undefined
      if (!store.state.arc200BridgeChain) return undefined
      if (!store.state.arc200BridgeTokenConfiguration) return undefined
      arc200Token = BigInt(store.state.arc200BridgeTokenConfiguration.arc200TokenId ?? store.state.arc200BridgeTokenConfiguration.optionalArc200TokenId ?? 0)
      const algodClient = await getAlgodClientByChainId(store.state.arc200BridgeChain)
      if (!algodClient) return undefined
      algoClient = await getAlgoClient(store.state.arc200BridgeChain)
    }
    console.log('arc200Token', arc200Token, 'algoClient', algoClient)
    if (!algoClient) throw new Error('Algo client not initialized')
    if (!arc200Token) throw new Error('ARC200 token not set')

    const dummyAddress = 'TESTNTTTJDHIF5PJZUBTTDYYSKLCLM6KXCTWIOOTZJX5HO7263DPPMM2SU'
    const dummyTransactionSigner = async (txnGroup: algosdk.Transaction[], indexesToSign: number[]): Promise<Uint8Array[]> => {
      console.log('transactionSigner', txnGroup, indexesToSign)
      return [] as Uint8Array[]
    }
    console.log('arc200Token', arc200Token)
    const clientArc200AsaDummySigner = getArc200ASAClient({
      algorand: algoClient,
      appId: arc200Token,
      appName: 'asa2arc200Bridge',
      approvalSourceMap: undefined,
      clearSourceMap: undefined,
      defaultSender: dummyAddress,
      defaultSigner: dummyTransactionSigner
    })

    const loadedExchangeInfo: Arc200ExchangeInfo = await clientArc200AsaDummySigner.arc200Exchange({ args: {} })
    console.log('Loaded exchange info for ARC200 token', arc200Token, loadedExchangeInfo)
    if (loadedExchangeInfo.exchangeAsset >= 0n) {
      return loadedExchangeInfo
    }
  } catch (e) {
    console.error('Error loading exchange info', e)
  }
  return undefined
}
export default getExchangeInfo
