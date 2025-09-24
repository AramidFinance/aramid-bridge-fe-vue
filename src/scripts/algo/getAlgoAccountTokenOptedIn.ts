import getSecureConfiguration from '../common/getSecureConfiguration'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'
import asyncdelay from '../common/asyncDelay'

const getAlgoAccountTokenOptedIn = async (chainId: number, accountAddress: string, asa: number): Promise<boolean | null> => {
  try {
    const secureConfiguration = await getSecureConfiguration()
    if (!secureConfiguration?.chains || !secureConfiguration.chains[chainId]) return null

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
      return account.account.amount
    }
    if (!account.account.assets) return false
    const asaItem = account.account.assets.find((a: any) => a['asset-id'] == asa)
    if (!asaItem) return false
    const ret = asaItem['opted-in-at-round'] > 0 && !asaItem['is-frozen'] && !asaItem['deleted']
    console.log(`optin:${chainId}:${accountAddress}:${asa}:${ret}`)
    return ret
  } catch (e) {
    console.error('Failed to check opt-in status:', e)
    return null
  }
}
export default getAlgoAccountTokenOptedIn
