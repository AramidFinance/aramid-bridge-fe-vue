import { useAppStore } from '@/stores/app'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'
import BigNumber from 'bignumber.js'

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
          console.log('is not pay')
          continue
        }
        if (!tx['payment-transaction'] || new BigNumber(tx['payment-transaction']['amount']).toFixed(0, 1) != store.state.sourceAmount) {
          console.log('amount does not match', new BigNumber(tx['payment-transaction']['amount']).toFixed(0, 1), store.state.sourceAmount)
          continue
        }
      } else {
        if (tx['tx-type'] !== 'axfer') {
          console.log('is not axfer')
          continue
        }
        if (!tx['asset-transfer-transaction'] || tx['asset-transfer-transaction']['asset-id'] != store.state.sourceToken) {
          console.log('asset ID does not match', tx['asset-transfer-transaction']['asset-id'], store.state.sourceToken)
          continue
        }
        if (new BigNumber(tx['asset-transfer-transaction']['amount']).toFixed(0, 1) != store.state.sourceAmount) {
          console.log('amount does not match', new BigNumber(tx['asset-transfer-transaction']['amount']).toFixed(0, 1), store.state.sourceAmount)
          continue
        }
      }

      // check note field
      if (store.state.sourceTxNote != Buffer.from(tx['note'], 'base64').toString('utf-8')) {
        console.log('everything matches except of the note field', store.state.sourceTxNote, Buffer.from(tx['note'], 'base64').toString('utf-8'))
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
