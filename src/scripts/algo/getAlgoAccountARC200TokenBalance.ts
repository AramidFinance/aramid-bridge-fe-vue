import BigNumber from 'bignumber.js'
import getSecureConfiguration from '../common/getSecureConfiguration'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'
import asyncdelay from '../common/asyncDelay'
import algosdk from 'algosdk'
import getAlgodClientByChainId from './getAlgodClientByChainId'
import { arc200 } from 'ulujs'

const getAlgoAccountTokenBalance = async (chainId: number, accountAddress: string, contractId: number, assetId: number): Promise<BigNumber | null> => {
  try {
    if (!algosdk.isValidAddress(accountAddress)) return new BigNumber('0')
    const secureConfiguration = await getSecureConfiguration()
    if (!secureConfiguration?.chains || !secureConfiguration.chains[chainId]) return null

    await asyncdelay(200)

    // For ARC200 we need both algod and indexer clients
    const algodClient = await getAlgodClientByChainId(chainId)

    if (!algodClient) {
      console.error('Failed to get algod client for ARC200')
      return new BigNumber('0')
    }

    // Get ARC200 balance from smart contract
    const ci = new arc200(contractId, algodClient, undefined)
    const balanceR = await ci.arc200_balanceOf(accountAddress)
    const arc200Balance = balanceR.success ? balanceR.returnValue : BigInt(0)

    // Get ASA balance from account assets using indexer failover
    let asaAmount = BigInt(0)
    try {
      const account = await executeWithIndexerFailover(
        chainId,
        async (indexer) => {
          return await indexer.lookupAccountByID(accountAddress).do()
        },
        `getAlgoAccountARC200TokenBalance lookupAccountByID(${accountAddress})`
      )

      if (account?.account?.assets) {
        const asaItem = account.account.assets.find((a: any) => a['asset-id'] == assetId)
        asaAmount = asaItem ? BigInt(asaItem.amount) : BigInt(0)
      }
    } catch (e) {
      console.warn('Failed to fetch ASA balance, using 0:', e)
      // asaAmount remains 0 if indexer fails
    }

    // Return 0 if neither ARC200 nor ASA balance exists
    if (arc200Balance == BigInt(0) && asaAmount == BigInt(0)) {
      return new BigNumber('0')
    }

    // Combine ARC200 and ASA balances
    const totalBalance = arc200Balance + asaAmount
    const ret = new BigNumber(totalBalance.toString())

    return ret
  } catch (e) {
    console.error(e)
    return new BigNumber('0')
  }
}
export default getAlgoAccountTokenBalance
