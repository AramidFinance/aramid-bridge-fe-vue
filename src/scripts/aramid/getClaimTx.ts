import { getBridgeLog } from '../algo/getBridgeLog'
import type { IClaim } from '../interface/aramid/IClaim'
import type { IEthIPFSData } from '../interface/aramid/IEthIPFSData'
import logger from '@/scripts/common/conditionalLogger'

export const getClaimTx = async (txHash: string): Promise<string | null> => {
  try {
    const bridgeLog = await getBridgeLog()
    logger.debug('bridgeLog', bridgeLog)

    if (!bridgeLog) {
      throw new Error('Failed to fetch bridge log from indexer. The indexer service may be temporarily unavailable.')
    }

    logger.debug('aramid transactions:', bridgeLog)
    const transactions = bridgeLog.transactions

    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions found in bridge log. The indexer may not have synced yet.')
    }

    logger.debug('searching transactions for', txHash)

    for (const currTx of transactions) {
      if (!currTx.note) {
        logger.error('!currTx.note', currTx)
        continue
      }

      try {
        const decodedNote = Buffer.from(currTx.note, 'base64').toString('utf-8') // decode from base64
        if (!decodedNote) continue

        const index = decodedNote.indexOf(':')
        if (index <= 0) continue

        const txType = decodedNote.substring(0, index)
        const noteObjStr = decodedNote.substring(index + 2)

        if (txType === 'aramid-claim/v1') {
          const noteObj: IClaim = JSON.parse(noteObjStr)
          if (noteObj.sourceTransactionId !== txHash) continue
          logger.debug('found aramid-claim')
          if (noteObj.ipfsHash) return currTx.id
          if (noteObj.aramidChainTx) return noteObj.aramidChainTx
          continue
        }

        if (txType === 'aramid-claim-data/v1') {
          const noteObj: IEthIPFSData = JSON.parse(noteObjStr)
          if (noteObj.sourceTransactionId !== txHash) continue
          logger.debug('found aramid-claim-data')
          return currTx.id
        }
      } catch (parseError) {
        // Log parse errors but continue searching other transactions
        logger.error('Error parsing transaction note:', parseError)
        continue
      }
    }

    // Not finding a transaction is expected behavior, return null
    // This is different from network/indexer failures which throw errors
    return null
  } catch (error: any) {
    // Re-throw the error if it's already a properly formatted error
    if (error.message) {
      throw error
    }
    // Otherwise, wrap it in a generic error
    throw new Error('Failed to search for claim transaction: ' + (error.toString ? error.toString() : 'Unknown error'))
  }
}
