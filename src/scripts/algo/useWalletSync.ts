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

export interface UseWalletBinding {
  chainConfiguration: () => ChainItem | undefined
  connectorType: () => AlgoConnectorType | undefined
  address: () => string | undefined
  setAddress: (address: string) => void
  disconnect: () => void
}

/**
 * Keeps an app-level wallet slot (source / ARC200 bridge) in sync with the shared use-wallet manager.
 *
 * use-wallet v5 disconnects wallets that do not support the newly active network (e.g. Pera on Voi)
 * and the manager is shared between pages, so the address the app recorded can stop being the one
 * the manager would sign with.
 */
export const useWalletSync = (binding: UseWalletBinding) => {
  const { activeAddress, isReady } = useWallet()
  const { setActiveNetwork } = useNetwork()
  const toast = useToast()

  const isBoundToUseWallet = () =>
    isReady.value && binding.chainConfiguration()?.type == 'algo' && binding.connectorType() === AlgoConnectorType.UseWallet && !!binding.address()

  /** Drops the slot when the manager has no active wallet (call on mount, the manager may have changed meanwhile). */
  const clearIfDisconnected = () => {
    if (isBoundToUseWallet() && !activeAddress.value) binding.disconnect()
  }
  watch(isReady, clearIfDisconnected)

  // Follow the wallet the slot was taken from: disconnected -> clear, account switched -> new address.
  watch(activeAddress, (current, previous) => {
    if (!isBoundToUseWallet() || !previous || binding.address() !== previous) return
    if (current) binding.setAddress(current)
    else binding.disconnect()
  })

  /** Switches the use-wallet network to match the slot's chain. */
  const syncNetwork = async () => {
    const chain = binding.chainConfiguration()
    if (chain?.type != 'algo') return
    const networkId = networkIdByChainName[chain.name]
    if (!networkId) return
    try {
      await setActiveNetwork(networkId)
    } catch (e: any) {
      console.error(e)
      toast.add({
        severity: 'error',
        detail: e.message ?? e,
        life: 3000
      })
    }
  }

  return { clearIfDisconnected, syncNetwork }
}
