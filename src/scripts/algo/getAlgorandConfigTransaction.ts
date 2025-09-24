import asyncdelay from '../common/asyncDelay'
import getLogger from '../common/getLogger'
import { executeWithIndexerFailover } from './getIndexerClientByChainIdWithFailover'

/**
 * Loads algorand transaction from the network
 * @param txId Transaction ID
 * @param chainId Algorand chain
 */
const getAlgorandConfigTransaction = async (daoToken: number, chainId: number, sender: string) => {
  const logger = await getLogger()
  try {
    let next: string | undefined = undefined
    let tries = 1000
    while (tries > 0) {
      tries--
      await asyncdelay(200)

      const txs: any = await executeWithIndexerFailover(
        chainId,
        async (indexer) => {
          const query = indexer.lookupAccountTransactions(sender).limit(1000)
          if (next) {
            return await query.nextToken(next).do()
          } else {
            return await query.do()
          }
        },
        `getAlgorandConfigTransaction lookupAccountTransactions for ${sender}`
      )

      await asyncdelay(100)
      console.log('config transactions:', txs)
      next = txs['next-token']
      if (txs.transactions.length == 0) throw 'Unable to find aramid-config tx'
      for (const index in txs.transactions) {
        const tx = txs.transactions[index]
        if (!tx['asset-transfer-transaction']) continue
        if (tx['asset-transfer-transaction'].receiver != sender) continue
        if (tx.sender != sender) continue
        if (tx['asset-transfer-transaction']['asset-id'] != daoToken) continue
        //console.log(tx);
        const note = Buffer.from(tx.note, 'base64').toString('utf-8')
        if (note.startsWith('aramid-config/v1:j')) {
          return tx
        }
      }
    }
    if (!tries) throw 'Lading attempts has failed'
  } catch (e) {
    logger.error(`Unable to load control tx ${chainId}`, e)
    return null
  }
}
export default getAlgorandConfigTransaction
