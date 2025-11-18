import asyncdelay from '../common/asyncDelay'
import getAppConfiguration from '../common/getAppConfiguration'
import getPublicConfiguration from '../common/getPublicConfiguration'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'
import logger from '@/scripts/common/conditionalLogger'

export const getBridgeLog = async () => {
  const appConfiguration = await getAppConfiguration()
  if (!appConfiguration) {
    logger.error('!appConfiguration')
    return
  }
  const publicConfiguration = await getPublicConfiguration(false)
  if (!publicConfiguration) {
    logger.error('!publicConfiguration')
    return
  }
  logger.debug('bridgelog', appConfiguration, publicConfiguration)

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
    logger.error('Failed to get bridge log:', error)
    return null
  }
}
