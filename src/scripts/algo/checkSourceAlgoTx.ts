import { useAppStore } from '@/stores/app'
import type { Transaction } from 'algosdk'
import BigNumber from 'bignumber.js'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'

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

    for (const tx of txs.transactions.filter((tx: Transaction) => tx.sender.toString() == store.state.sourceAddress && tx.note.length > 0)) {
      // check asset and amount
      if (store.state.sourceToken === '0') {
        // native token transfer
        if (tx.txType !== 'pay') {
          console.log('is not pay')
          continue
        }
        if (!tx.paymentTransaction || new BigNumber(tx.paymentTransaction.amount).toFixed(0, 1) != store.state.sourceAmount) {
          console.log('amount does not match', new BigNumber(tx.paymentTransaction?.amount ?? 0).toFixed(0, 1), store.state.sourceAmount)
          continue
        }
      } else {
        if (tx.txType !== 'axfer') {
          console.log('is not axfer')
          continue
        }
        if (!tx.assetTransferTransaction || tx.assetTransferTransaction.assetId != BigInt(store.state.sourceToken ?? 0n)) {
          console.log('asset ID does not match', tx.assetTransferTransaction?.assetId, store.state.sourceToken)
          continue
        }
        if (new BigNumber(tx.assetTransferTransaction.amount).toFixed(0, 1) != store.state.sourceAmount) {
          console.log('amount does not match', new BigNumber(tx.assetTransferTransaction.amount).toFixed(0, 1), store.state.sourceAmount)
          continue
        }
      }

      // check note field
      if (store.state.sourceTxNote != Buffer.from(tx.note ?? '').toString('utf-8')) {
        console.log('everything matches except of the note field', store.state.sourceTxNote, Buffer.from(tx.note ?? '').toString('utf-8'))
        continue
      }
      console.log('match', tx)
      return tx.id
    }
    console.log('txs', txs)
  } catch (error) {
    console.error('Failed to check source algo tx:', error)
    return null
  }
}
