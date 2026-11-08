import type { UseWalletSlot } from '@/scripts/algo/useWalletSync'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import type { useAppStore } from '@/stores/app'

type AppStore = ReturnType<typeof useAppStore>

/** The origin wallet of the bridge page. */
export const sourceWalletSlot = (store: AppStore): UseWalletSlot => ({
  chainConfiguration: () => store.state.sourceChainConfiguration,
  connectorType: () => store.state.sourceAlgoConnectorType,
  address: () => store.state.sourceAddress,
  connect: (address) => {
    store.state.sourceAddress = address
    store.state.sourceAlgoConnectorType = AlgoConnectorType.UseWallet
    store.state.connectedSourceChain = store.state.sourceChainConfiguration?.chainId
  },
  setAddress: (address) => {
    store.state.sourceAddress = address
  },
  disconnect: () => {
    store.state.connectedSourceChain = undefined
    store.state.sourceAddress = ''
  }
})

/** The wallet of the ARC200 claim/bridge page. */
export const arc200BridgeWalletSlot = (store: AppStore): UseWalletSlot => ({
  chainConfiguration: () => store.state.arc200BridgeChainConfiguration,
  connectorType: () => store.state.arc200BridgeAlgoConnectorType,
  address: () => store.state.arc200BridgeAddress,
  connect: (address) => {
    store.state.arc200BridgeAddress = address
    store.state.arc200BridgeAlgoConnectorType = AlgoConnectorType.UseWallet
    store.state.connectedArc200BridgeChain = store.state.arc200BridgeChainConfiguration?.chainId
  },
  setAddress: (address) => {
    store.state.arc200BridgeAddress = address
  },
  disconnect: () => {
    store.state.connectedArc200BridgeChain = undefined
    store.state.arc200BridgeAddress = ''
  }
})
