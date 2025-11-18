import { useAppStore } from '@/stores/app'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'
import BigNumber from 'bignumber.js'
import logger from '@/scripts/common/conditionalLogger'

export const checkSourceAlgoTx = async () => {
  const store = useAppStore()
  if (!store.state.sourceChain) return
  if (!store.state.sourceTokenConfiguration) return

  try {
    const txs = await executeWithIndexerFailover(
      store.state.sourceChain,
      async (indexer) => {
        return await indexer.lookupAccountTransactions(store.state.sourceBridgeAddress).limit(1000).do()
      },
      'checkSourceAlgoTx lookupAccountTransactions'
    )

    for (const tx of txs.transactions.filter((tx: any) => tx.sender == store.state.sourceAddress && !!tx.note)) {
      // check asset and amount
      if (store.state.sourceToken === '0') {
        // native token transfer
        if (tx['tx-type'] !== 'pay') {
          logger.debug('is not pay')
          continue
        }
        if (!tx['payment-transaction'] || new BigNumber(tx['payment-transaction']['amount']).toFixed(0, 1) != store.state.sourceAmount) {
          logger.debug('amount does not match', new BigNumber(tx['payment-transaction']['amount']).toFixed(0, 1), store.state.sourceAmount)
          continue
        }
      } else {
        if (tx['tx-type'] !== 'axfer') {
          logger.debug('is not axfer')
          continue
        }
        if (!tx['asset-transfer-transaction'] || tx['asset-transfer-transaction']['asset-id'] != store.state.sourceToken) {
          logger.debug('asset ID does not match', tx['asset-transfer-transaction']['asset-id'], store.state.sourceToken)
          continue
        }
        if (new BigNumber(tx['asset-transfer-transaction']['amount']).toFixed(0, 1) != store.state.sourceAmount) {
          logger.debug('amount does not match', new BigNumber(tx['asset-transfer-transaction']['amount']).toFixed(0, 1), store.state.sourceAmount)
          continue
        }
      }

      // check note field
      if (store.state.sourceTxNote != Buffer.from(tx['note'], 'base64').toString('utf-8')) {
        logger.debug('everything matches except of the note field', store.state.sourceTxNote, Buffer.from(tx['note'], 'base64').toString('utf-8'))
        continue
      }
      logger.debug('match', tx)
      return tx.id
    }
    logger.debug('txs', txs)
  } catch (error) {
    logger.error('Failed to check source algo tx:', error)
    return null
  }
}
