import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { NetworkId, useNetwork, useWallet } from '@txnlab/use-wallet-vue'
import { useToast } from 'primevue/usetoast'
import { watch } from 'vue'

const networkIdByChainName: Record<string, string> = {
  Algorand: NetworkId.MAINNET,
  Testnet: NetworkId.TESTNET,
  AramidChain: 'aramidmain',
  Voi: 'voimain'
}

/** An app-level wallet slot (source / ARC200 bridge) in the app store. */
export interface UseWalletSlot {
  chainConfiguration: () => ChainItem | undefined
  connectorType: () => AlgoConnectorType | undefined
  address: () => string | undefined
  /** Binds the slot to a use-wallet account (address, connector type and connected chain). */
  connect: (address: string) => void
  setAddress: (address: string) => void
  disconnect: () => void
}

/**
 * Keeps an app-level wallet slot in sync with the shared use-wallet manager.
 *
 * use-wallet v5 disconnects wallets that do not support the newly active network (e.g. Pera on Voi)
 * and the manager is shared between pages, so the address the app recorded can stop being the one
 * the manager would sign with.
 */
export const useWalletSync = (slot: UseWalletSlot) => {
  const { activeAddress, activeWallet, availableWallets, isReady } = useWallet()
  const { setActiveNetwork } = useNetwork()
  const toast = useToast()

  const isBoundToUseWallet = () =>
    slot.chainConfiguration()?.type == 'algo' && slot.connectorType() === AlgoConnectorType.UseWallet && !!slot.address()

  /** Once the manager is ready: adopt its active account, or drop the slot if that session is gone. */
  const syncFromManager = () => {
    if (!isReady.value || slot.chainConfiguration()?.type != 'algo') return
    const wallet = activeWallet.value
    // a wallet that does not support the active network is being disconnected by use-wallet v5
    const usable = !!wallet && availableWallets.value.some((w) => w.walletKey === wallet.walletKey)
    if (usable && activeAddress.value) slot.connect(activeAddress.value)
    else if (isBoundToUseWallet()) slot.disconnect()
  }
  watch(isReady, syncFromManager)

  // Follow the wallet the slot was taken from: disconnected -> clear, account switched -> new address.
  watch(activeAddress, (current, previous) => {
    if (!isReady.value || !isBoundToUseWallet() || !previous || slot.address() !== previous) return
    if (current) slot.setAddress(current)
    else slot.disconnect()
  })

  /** Switches the use-wallet network to match the slot's chain. Returns false if switching failed. */
  const syncNetwork = async (): Promise<boolean> => {
    const chain = slot.chainConfiguration()
    if (chain?.type != 'algo') return true
    const networkId = networkIdByChainName[chain.name]
    if (!networkId) return true
    try {
      await setActiveNetwork(networkId)
      return true
    } catch (e: any) {
      console.error(e)
      toast.add({
        severity: 'error',
        detail: e.message ?? e,
        life: 3000
      })
      return false
    }
  }

  return { syncFromManager, syncNetwork }
}
