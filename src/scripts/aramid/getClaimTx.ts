import { getBridgeLog } from '../algo/getBridgeLog'
import type { IClaim } from '../interface/aramid/IClaim'
import type { IEthIPFSData } from '../interface/aramid/IEthIPFSData'

export const getClaimTx = async (txHash: string): Promise<string | undefined> => {
  const bridgeLog = await getBridgeLog()
  console.log('bridgeLog', bridgeLog)
  if (!bridgeLog) return undefined
  console.log('aramid transactions:', bridgeLog)
  const transactions = bridgeLog.transactions
  if (!bridgeLog || !bridgeLog.transactions) return undefined
  console.log('searching transactions for', txHash)
  for (const currTx of transactions) {
    if (!currTx.note) {
      console.error('!currTx.note', currTx)
      continue
    }
    const decodedNote = Buffer.from(currTx.note).toString('utf-8') // decode from base64
    if (!decodedNote) continue
    const index = decodedNote.indexOf(':')
    if (index <= 0) continue
    const txType = decodedNote.substring(0, index)
    const noteObjStr = decodedNote.substring(index + 2)
    if (txType === 'aramid-claim/v1') {
      const noteObj: IClaim = JSON.parse(noteObjStr)
      if (noteObj.sourceTransactionId !== txHash) continue
      console.log('found aramid-claim')
      if (noteObj.ipfsHash) return currTx.id
      if (noteObj.aramidChainTx) return noteObj.aramidChainTx
      continue
    }
    if (txType === 'aramid-claim-data/v1') {
      const noteObj: IEthIPFSData = JSON.parse(noteObjStr)
      if (noteObj.sourceTransactionId !== txHash) continue
      console.log('found aramid-claim-data')
      return currTx.id
    }
  }
  return undefined
}
