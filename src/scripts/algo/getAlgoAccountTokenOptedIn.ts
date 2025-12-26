import asyncdelay from '../common/asyncDelay'
import getSecureConfiguration from '../common/getSecureConfiguration'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'

const getAlgoAccountTokenOptedIn = async (chainId: number, accountAddress: string, asa: number): Promise<boolean | undefined> => {
  try {
    const secureConfiguration = await getSecureConfiguration()
    if (!secureConfiguration?.chains || !secureConfiguration.chains[chainId]) return undefined

    await asyncdelay(200)
    const account = await executeWithIndexerFailover(
      chainId,
      async (indexer) => {
        return await indexer.lookupAccountByID(accountAddress).do()
      },
      `getAlgoAccountTokenOptedIn lookupAccountByID(${accountAddress})`
    )

    if (!account || !account.account) return false
    if (asa == 0) {
      return account.account.amount > 0n
    }
    if (!account.account.assets) return false
    const asaItem = account.account.assets[asa]
    if (!asaItem) return false
    const ret = !!asaItem.optedInAtRound && asaItem.optedInAtRound > 0n && !asaItem.isFrozen && !asaItem.deleted
    console.log(`optin:${chainId}:${accountAddress}:${asa}:${ret}`)
    return ret
  } catch (e) {
    console.error('Failed to check opt-in status:', e)
    return undefined
  }
}
export default getAlgoAccountTokenOptedIn
