import asyncdelay from '../common/asyncDelay'
import getAppConfiguration from '../common/getAppConfiguration'
import getPublicConfiguration from '../common/getPublicConfiguration'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'

export const getBridgeLog = async (): Promise<any> => {
  const appConfiguration = await getAppConfiguration()
  if (!appConfiguration) {
    console.error('!appConfiguration')
    return
  }
  const publicConfiguration = await getPublicConfiguration(false)
  if (!publicConfiguration) {
    console.error('!publicConfiguration')
    return
  }
  console.log('bridgelog', appConfiguration, publicConfiguration)

  try {
    await asyncdelay(200)
    const result = await executeWithIndexerFailover(
      appConfiguration.mainNetwork,
      async (indexer) => {
        return await indexer.lookupAccountTransactions(publicConfiguration.addresses.claims).do()
      },
      'getBridgeLog lookupAccountTransactions'
    )
    return result
  } catch (error) {
    console.error('Failed to get bridge log:', error)
    return null
  }
}
