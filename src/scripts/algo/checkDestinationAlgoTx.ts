import { useAppStore } from '@/stores/app'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'

export const checkDestinationAlgoTx = async () => {
  console.log('checkDestinationAlgoTx')
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
      (tx) => tx.assetTransferTransaction?.receiver == store.state.destinationAddress || (tx.paymentTransaction?.receiver == store.state.destinationAddress && tx?.note?.length && tx?.note?.length > 0)
    )) {
      try {
        // check asset and amount
        let note = Buffer.from(tx.note ?? '').toString('utf-8')
        if (!note.startsWith('aramid-confirm/v1:j')) continue
        note = note.substring('aramid-confirm/v1:j'.length)
        const noteJson = JSON.parse(note)
        if (noteJson['sourceNetwork'] == store.state.sourceChain && noteJson['sourceTxId'] == store.state.bridgeTx) {
          console.log('Tx is bridged: ', tx)
          return tx.id
        }
        //console.log('checking', tx, note, noteJson)
      } catch (e) {
        console.error(e)
      }
    }
    //console.log('txs', store.state.destinationAddress, txs.transactions)
  } catch (error) {
    console.error('Failed to check destination algo tx:', error)
    return null
  }
}
