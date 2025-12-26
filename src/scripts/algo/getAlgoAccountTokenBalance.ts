import algosdk from 'algosdk'
import BigNumber from 'bignumber.js'
import asyncdelay from '../common/asyncDelay'
import getSecureConfiguration from '../common/getSecureConfiguration'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'

const getAlgoAccountTokenBalance = async (chainId: number, accountAddress: string, asa: number): Promise<BigNumber | null> => {
  try {
    const asaBigInt = BigInt(asa)
    if (!algosdk.isValidAddress(accountAddress)) return new BigNumber('0')
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
    if (!account || !account.account) return new BigNumber('0')
    console.log('algo.account', asaBigInt, chainId, account, account.account.amount.toString())
    if (asaBigInt == 0n) {
      const ret = new BigNumber(account.account.amount.toString())
      console.log('account.amount', ret.toFixed(0, 1))
      return ret
    }
    if (!account.account.assets) return new BigNumber('0')
    const asaItem = account.account.assets.find((a) => a.assetId == asaBigInt)
    console.log('algo.asaItem', chainId, asaItem)
    if (!asaItem) return new BigNumber('0')
    const ret = new BigNumber(asaItem.amount.toString())
    console.log('account.amount', ret.toFixed(0, 1))
    return ret
  } catch (e) {
    console.error(e)
    return new BigNumber('0')
  }
}
export default getAlgoAccountTokenBalance
