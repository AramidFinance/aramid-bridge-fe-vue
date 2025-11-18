import { useAppStore } from '@/stores/app'
import type { ITransfer } from '../interface/aramid/ITransfer'
import logger from '@/scripts/common/conditionalLogger'

export const makeNoteField = () => {
  const store = useAppStore()
  if (!store.state.destinationChain) return
  if (!store.state.destinationAddress) return
  if (!store.state.destinationToken) return

  if (store.state.sourceChainConfiguration?.type != 'algo') {
    store.state.sourceTxNote = ''
    return
  }

  const tosendFee = parseInt(store.state.feeAmount)
  const netSrcAmt = parseInt(store.state.sourceAmountNet)
  const netDestAmt = parseInt(store.state.destinationAmount)
  //if (netDestAmt != netSourceAmt) throw Error(`Net source amount is not equal to net destination amount: ${netSourceAmt} != ${netDestAmt}`);
  const note: ITransfer = {
    destinationNetwork: store.state.destinationChain, // convert to number
    destinationAddress: store.state.destinationAddress,
    destinationToken: store.state.destinationToken,
    feeAmount: tosendFee,
    destinationAmount: netDestAmt,
    note: store.state.memo ?? 'aramid-fe-2',
    sourceAmount: netSrcAmt
  }
  logger.debug('note', note)
  const algorandNote: string = `aramid-transfer/v1:j${JSON.stringify(note)}`
  store.state.sourceTxNote = algorandNote

  const addAsset = store.state.sourceToken && Number(store.state.sourceToken) > 0 ? `&asset=${store.state.sourceToken}` : ''
  const addNetwork = `&network=${store.state.sourceChainGenesis}`
  store.state.qrContent = `algorand://${store.state.sourceBridgeAddress}?amount=${store.state.sourceAmount}${addAsset}${addNetwork}&note=${algorandNote}`
  logger.debug('store.state.qrContent', store.state.qrContent)
}
