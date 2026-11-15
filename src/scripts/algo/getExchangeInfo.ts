import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import type algosdk from 'algosdk'
import { getArc200ASAClient, type Arc200ExchangeInfo } from 'arc200-client'
import getAlgoClient from './getAlgoClient'

/** Exchange info of an ARC200 app on a chain: the values the caller builds its transactions for. */
const getExchangeInfo = async ({ chainId, arc200TokenId }: { chainId: number; arc200TokenId: bigint | number | string }): Promise<Arc200ExchangeInfo | undefined> => {
  try {
    const arc200Token = BigInt(arc200TokenId)
    const algoClient: AlgorandClient | null = await getAlgoClient(chainId)
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
