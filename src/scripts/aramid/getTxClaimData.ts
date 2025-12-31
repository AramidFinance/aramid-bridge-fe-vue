import getAlgorandTransaction from '../algo/getAlgorandTransaction'
import getAppConfiguration from '../common/getAppConfiguration'
import type { IEthIPFSData } from '../interface/aramid/IEthIPFSData'

export const getTxClaimData = async (claimTx: string): Promise<IEthIPFSData | null> => {
  const appConfiguration = await getAppConfiguration()
  if (!appConfiguration) return null
  const bridgeLog = await getAlgorandTransaction(claimTx, appConfiguration.mainNetwork)
  if (!bridgeLog) return null
  if (!bridgeLog || !bridgeLog.transaction) return null
  const currTx = bridgeLog.transaction

  if (!currTx.note) {
    console.error('!currTx.note', currTx)
    return null
  }
  const decodedNote = Buffer.from(currTx.note).toString('utf-8') // decode from base64
  if (!decodedNote) return null

  const index = decodedNote.indexOf(':')
  if (index <= 0) return null
  const txType = decodedNote.substring(0, index)
  const noteObjStr = decodedNote.substring(index + 2)
  if (txType === 'aramid-claim-data/v1') {
    const noteObj: IEthIPFSData = JSON.parse(noteObjStr)
    return noteObj
  }
  // ipfs data are not produced any more
  //   if (txType === 'aramid-claim/v1') {
  //     const noteObj: IClaim = JSON.parse(noteObjStr)
  //     const ipfsHash = noteObj.ipfsHash
  //     // console.log(txType, noteObj.sourceTransactionId, ipfsHash);
  //     // console.log(noteObj.sourceTransactionId == txHash)
  //     if (ipfsHash) {
  //       // console.log('found transaction');
  //       const ipfsData = await retrieveIpfsData(ipfsHash)
  //       console.log('transaction found, ipfs data:', ipfsData)
  //       return ipfsData.data as IEthIPFSData
  //     }
  //   }
  return null
}
