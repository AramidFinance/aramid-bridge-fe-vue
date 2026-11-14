import type { UseWalletSlot } from '@/scripts/algo/useWalletSync'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import type { useAppStore } from '@/stores/app'

type AppStore = ReturnType<typeof useAppStore>

/** The app store fields that make up one wallet slot. */
interface SlotFields {
  chainConfiguration: 'sourceChainConfiguration' | 'arc200BridgeChainConfiguration'
  connectorType: 'sourceAlgoConnectorType' | 'arc200BridgeAlgoConnectorType'
  address: 'sourceAddress' | 'arc200BridgeAddress'
  connectedChain: 'connectedSourceChain' | 'connectedArc200BridgeChain'
}

const makeWalletSlot = (store: AppStore, fields: SlotFields): UseWalletSlot => ({
  chainConfiguration: () => store.state[fields.chainConfiguration],
  connectorType: () => store.state[fields.connectorType],
  address: () => store.state[fields.address],
  connect: (address) => {
    store.state[fields.address] = address
    store.state[fields.connectorType] = AlgoConnectorType.UseWallet
    store.state[fields.connectedChain] = store.state[fields.chainConfiguration]?.chainId
  },
  disconnect: () => {
    store.state[fields.connectedChain] = undefined
    store.state[fields.address] = ''
  }
})

/** The origin wallet of the bridge page. */
export const sourceWalletSlot = (store: AppStore): UseWalletSlot =>
  makeWalletSlot(store, {
    chainConfiguration: 'sourceChainConfiguration',
    connectorType: 'sourceAlgoConnectorType',
    address: 'sourceAddress',
    connectedChain: 'connectedSourceChain'
  })

/** The wallet of the ARC200 claim/bridge page. */
export const arc200BridgeWalletSlot = (store: AppStore): UseWalletSlot =>
  makeWalletSlot(store, {
    chainConfiguration: 'arc200BridgeChainConfiguration',
    connectorType: 'arc200BridgeAlgoConnectorType',
    address: 'arc200BridgeAddress',
    connectedChain: 'connectedArc200BridgeChain'
  })
