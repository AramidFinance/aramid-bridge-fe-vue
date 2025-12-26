import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { getArc200Client } from 'arc200-client'
import BigNumber from 'bignumber.js'
import asyncdelay from '../common/asyncDelay'
import getSecureConfiguration from '../common/getSecureConfiguration'
import getAlgodClientByChainId from './getAlgodClientByChainId'
import getIndexerClientByChainId from './getIndexerClientByChainId'

const getAlgoAccountTokenBalance = async (chainId: number, accountAddress: string, contractId: number, assetId: number): Promise<BigNumber | null> => {
  try {
    if (!algosdk.isValidAddress(accountAddress)) return new BigNumber('0')
    const secureConfiguration = await getSecureConfiguration()
    if (!secureConfiguration?.chains || !secureConfiguration.chains[chainId]) return null

    await asyncdelay(200)

    // For ARC200 we need both algod and indexer clients, but we'll use the first available
    // since arc200 library expects specific client instances
    const indexerClient = await getIndexerClientByChainId(chainId)
    const algodClient = await getAlgodClientByChainId(chainId)

    if (!indexerClient || !algodClient) {
      console.error('Failed to get algod or indexer client for ARC200')
      return new BigNumber('0')
    }
    const dummyAddress = 'TESTNTTTJDHIF5PJZUBTTDYYSKLCLM6KXCTWIOOTZJX5HO7263DPPMM2SU'
    const dummyTransactionSigner = async (txnGroup: algosdk.Transaction[], indexesToSign: number[]): Promise<Uint8Array[]> => {
      console.log('transactionSigner', txnGroup, indexesToSign)
      return [] as Uint8Array[]
    }
    var algoClient = AlgorandClient.fromClients({
      algod: algodClient,
      indexer: indexerClient
    })
    const client = getArc200Client({
      algorand: algoClient,
      appId: BigInt(contractId),
      defaultSender: dummyAddress,
      defaultSigner: dummyTransactionSigner,
      appName: 'arc200',
      approvalSourceMap: undefined,
      clearSourceMap: undefined
    })

    const balance = await client.arc200BalanceOf({ args: { owner: accountAddress } })

    if (balance == BigInt(0)) return new BigNumber('0') // if no ARC200-ASA and no ARC200, return 0

    const ret = new BigNumber(balance.toString())
    return ret
  } catch (e) {
    console.error(e)
    return new BigNumber('0')
  }
}
export default getAlgoAccountTokenBalance
