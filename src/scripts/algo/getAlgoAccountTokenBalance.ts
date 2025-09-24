import BigNumber from 'bignumber.js'
import getSecureConfiguration from '../common/getSecureConfiguration'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'
import asyncdelay from '../common/asyncDelay'
import algosdk from 'algosdk'

const getAlgoAccountTokenBalance = async (chainId: number, accountAddress: string, asa: number): Promise<BigNumber | null> => {
  try {
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

    //console.log('algo.account', chainId, account)
    if (!account || !account.account) return new BigNumber('0')
    if (asa == 0) {
      return account.account.amount
    }
    if (!account.account.assets) return new BigNumber('0')
    const asaItem = account.account.assets.find((a: any) => a['asset-id'] == asa)
    if (!asaItem) return new BigNumber('0')
    const ret = new BigNumber(asaItem.amount)
    //console.log('account.amount', ret.toFixed(0, 1))
    return ret
  } catch (e) {
    console.error(e)
    return new BigNumber('0')
  }
}
export default getAlgoAccountTokenBalance
