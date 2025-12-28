import algosdk from 'algosdk'
import asyncdelay from '../common/asyncDelay'
import getSecureConfiguration from '../common/getSecureConfiguration'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'

const getAlgoAccountTokenBalance = async (chainId: number, accountAddress: string, asa: number | bigint): Promise<bigint | null> => {
  try {
    const asaBigInt = BigInt(asa)
    if (!algosdk.isValidAddress(accountAddress)) return 0n
    const secureConfiguration = await getSecureConfiguration()
    if (!secureConfiguration?.chains || !secureConfiguration.chains[chainId]) return null

    await asyncdelay(200)
    const account = await executeWithIndexerFailover(
      chainId,
      async (indexer) => {
        return await indexer.lookupAccountByID(accountAddress).do()
      },
      `getAlgoAccountTokenBalance lookupAccountByID(${accountAddress})`
    )

    console.log('algo.account', asaBigInt, chainId, account, account.account.amount.toString())
    if (!account || !account.account) return 0n
    console.log('algo.account', asaBigInt, chainId, account, account.account.amount.toString())
    if (asaBigInt == 0n) {
      const ret = BigInt(account.account.amount.toString())
      console.log('account.amount', ret)
      return ret
    }
    if (!account.account.assets) return 0n
    const asaItem = account.account.assets.find((a) => a.assetId == asaBigInt)
    console.log('algo.asaItem', chainId, asaItem)
    if (!asaItem) return 0n
    const ret = BigInt(asaItem.amount.toString())
    console.log('account.amount', ret)
    return ret
  } catch (e) {
    console.error(e)
    return 0n
  }
}
export default getAlgoAccountTokenBalance
