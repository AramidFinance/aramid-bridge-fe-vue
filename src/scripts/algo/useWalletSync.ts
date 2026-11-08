import { isWalletForChain } from '@/scripts/algo/isWalletForChain'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { NetworkId, useNetwork, useWallet } from '@txnlab/use-wallet-vue'
import { useToast } from 'primevue/usetoast'
import { watch } from 'vue'

const networkIdByChainId: Record<number, string> = {
  416001: NetworkId.MAINNET,
  416002: NetworkId.TESTNET,
  416101: 'voimain',
  101003: 'aramidmain'
}

/** The use-wallet network id of an AVM chain, or undefined when use-wallet has no network for it. */
export const getUseWalletNetworkId = (chainId: number | undefined): string | undefined => (chainId === undefined ? undefined : networkIdByChainId[chainId])

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

  const isBoundToUseWallet = () => slot.chainConfiguration()?.type == 'algo' && slot.connectorType() === AlgoConnectorType.UseWallet && !!slot.address()

  /** Once the manager is ready: adopt its active account, or drop the slot if that session is gone. */
  const syncFromManager = () => {
    const chain = slot.chainConfiguration()
    if (!isReady.value || chain?.type != 'algo') return
    const wallet = activeWallet.value
    const usable =
      !!wallet &&
      // the app's own wallet/chain matrix (what the picker offers for this chain)
      isWalletForChain(wallet.id, chain.chainId) &&
      // a wallet that does not support the active network is being disconnected by use-wallet v5
      availableWallets.value.some((w) => w.walletKey === wallet.walletKey)
    if (usable && activeAddress.value) slot.connect(activeAddress.value)
    else if (isBoundToUseWallet()) slot.disconnect()
  }

  // Follow the wallet the slot was taken from: disconnected -> clear, account switched -> new address.
  watch(activeAddress, (current, previous) => {
    if (!isReady.value || !isBoundToUseWallet() || !previous || slot.address() !== previous) return
    if (current) slot.setAddress(current)
    else slot.disconnect()
  })

  /**
   * Switches the use-wallet network to match the slot's chain. Returns false when the manager is not on
   * that chain's network afterwards (unknown chain or failed switch), so the slot must not adopt it.
   */
  const syncNetwork = async (): Promise<boolean> => {
    const chain = slot.chainConfiguration()
    if (chain?.type != 'algo') return true
    const networkId = getUseWalletNetworkId(chain.chainId)
    if (!networkId) return false
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

  /**
   * Aligns the manager's network with the slot's chain, then the slot with the manager. Call on mount
   * and whenever the slot's chain changes; it also runs once the manager has resumed its sessions.
   */
  const sync = async () => {
    if (await syncNetwork()) syncFromManager()
  }
  watch(isReady, sync)

  return { activeWallet, sync }
}
