import BigNumber from 'bignumber.js'
import getSecureConfiguration from '../common/getSecureConfiguration'
import getIndexerClientByChainId from './getIndexerClientByChainId'
import asyncdelay from '../common/asyncDelay'
import algosdk from 'algosdk'
import getAlgodClientByChainId from './getAlgodClientByChainId'
import { arc200 } from 'ulujs'
import logger from '@/scripts/common/conditionalLogger'
import { indexerLimiter } from '@/utils/rateLimit'

const getAlgoAccountTokenBalance = async (chainId: number, accountAddress: string, contractId: number, assetId: number): Promise<BigNumber | null> => {
  try {
    if (!algosdk.isValidAddress(accountAddress)) return new BigNumber('0')
    const secureConfiguration = await getSecureConfiguration()
    if (!secureConfiguration?.chains || !secureConfiguration.chains[chainId]) return null

    // Apply rate limiting for indexer queries
    await indexerLimiter.throttle()
    await asyncdelay(200)

    // For ARC200 we need both algod and indexer clients, but we'll use the first available
    // since arc200 library expects specific client instances
    const indexerClient = await getIndexerClientByChainId(chainId)
    const algodClient = await getAlgodClientByChainId(chainId)

    if (!indexerClient || !algodClient) {
      logger.error('Failed to get algod or indexer client for ARC200')
      return new BigNumber('0')
    }

    // balance, how much ARC200 is in the account
    const ci = new arc200(contractId, algodClient, indexerClient)
    const balanceR = await ci.arc200_balanceOf(accountAddress)
    const balance = balanceR.success ? balanceR.returnValue : BigInt(0)
    //const account = await indexerClient?.lookupAccountByID(accountAddress).do()
    //if (!account || !account.account) return new BigNumber('0')
    // assetItem, how much ARC200-ASA is in the account with default 0
    //if (!account.account.assets) return new BigNumber('0') // removed because of ARC200
    // const asaItem = account.account?.assets?.find((a: any) => a['asset-id'] == assetId) || {
    //   ['asset-id']: assetId,
    //   amount: 0
    // }
    //const asaAmount = asaItem ? BigInt(asaItem.amount) : BigInt(0)
    const asaAmount = BigInt(0)

    if (balance == BigInt(0)) return new BigNumber('0') // if no ARC200-ASA and no ARC200, return 0

    //logger.debug('algo.account', chainId, accountAddress, contractId, assetId, balance, asaAmount)
    const ret = new BigNumber((asaAmount + balance).toString()) // combine ARC200 and ARC200-ASA
    //logger.debug('account.amount', ret.toFixed(0, 1))
    return ret
  } catch (e) {
    logger.error(e)
    return new BigNumber('0')
  }
}
export default getAlgoAccountTokenBalance
