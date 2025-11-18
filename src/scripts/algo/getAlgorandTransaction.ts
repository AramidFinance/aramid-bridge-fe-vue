import asyncdelay from '../common/asyncDelay'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'
import logger from '@/scripts/common/conditionalLogger'

/**
 * Loads algorand transaction from the network
 * @param txId Transaction ID
 * @param chainId Algorand chain
 */
const getAlgorandTransaction = async (txId: string, chainId: number) => {
  try {
    let tries = 5
    while (tries > 0) {
      tries--
      try {
        await asyncdelay(50)
        const result = await executeWithIndexerFailover(
          chainId,
          async (indexer) => {
            await asyncdelay(100)
            return await indexer.lookupTransactionByID(txId).do()
          },
          `lookupTransactionByID(${txId})`
        )
        return result
      } catch (e) {
        await asyncdelay(5000)
        if (tries <= 0) {
          throw e
        }
      }
    }
    throw `Too many attempts to load tx ${txId}`
  } catch (e) {
    logger.error(`Unable to load tx from algo chain ${chainId} ${txId}`, e)
    return null
  }
}
export default getAlgorandTransaction
