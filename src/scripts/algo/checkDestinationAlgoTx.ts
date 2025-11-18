import { useAppStore } from '@/stores/app'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'
import logger from '@/scripts/common/conditionalLogger'

export const checkDestinationAlgoTx = async () => {
  logger.debug('checkDestinationAlgoTx')
  const store = useAppStore()
  if (!store.state.destinationChain) return

  try {
    const txs = await executeWithIndexerFailover(
      store.state.destinationChain,
      async (indexer) => {
        return await indexer.lookupAccountTransactions(store.state.destinationBridgeAddress).do()
      },
      'checkDestinationAlgoTx lookupAccountTransactions'
    )

    for (const tx of txs.transactions.filter(
      (tx: any) =>
        (tx['asset-transfer-transaction'] && tx['asset-transfer-transaction'].receiver == store.state.destinationAddress) ||
        (tx['payment-transaction'] && tx['payment-transaction'].receiver == store.state.destinationAddress && !!tx.note)
    )) {
      try {
        // check asset and amount
        let note = Buffer.from(tx.note, 'base64').toString('utf-8')
        if (!note.startsWith('aramid-confirm/v1:j')) continue
        note = note.substring('aramid-confirm/v1:j'.length)
        const noteJson = JSON.parse(note)
        if (noteJson['sourceNetwork'] == store.state.sourceChain && noteJson['sourceTxId'] == store.state.bridgeTx) {
          logger.debug('Tx is bridged: ', tx)
          return tx.id
        }
        //logger.debug('checking', tx, note, noteJson)
      } catch (e) {
        logger.error(e)
      }
    }
    //logger.debug('txs', store.state.destinationAddress, txs.transactions)
  } catch (error) {
    logger.error('Failed to check destination algo tx:', error)
    return null
  }
}
