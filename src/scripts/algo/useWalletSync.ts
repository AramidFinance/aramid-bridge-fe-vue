import { isWalletForChain } from '@/scripts/algo/isWalletForChain'
import { showError } from '@/scripts/common/showError'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { NetworkId, useNetwork, useWallet, useWalletManager, type WalletManager } from '@txnlab/use-wallet-vue'
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

const chainIdByNetworkId: Record<string, number> = Object.fromEntries(Object.entries(networkIdByChainId).map(([chainId, networkId]) => [networkId, Number(chainId)]))

/** The AVM chain id of a use-wallet network id, or undefined for unknown networks. */
export const getChainIdByUseWalletNetwork = (networkId: string): number | undefined => chainIdByNetworkId[networkId]

// one pending "ready" promise per manager, independent of any component's lifetime
const readyPromises = new WeakMap<WalletManager, Promise<void>>()
/** Resolves once the manager has resumed its sessions. */
const whenManagerReady = (manager: WalletManager): Promise<void> => {
  if (manager.isReady) return Promise.resolve()
  let promise = readyPromises.get(manager)
  if (!promise) {
    promise = new Promise<void>((resolve) => {
      const unsubscribe = manager.subscribe((state) => {
        if (state.managerStatus !== 'ready') return
        unsubscribe()
        readyPromises.delete(manager)
        resolve()
      })
    })
    readyPromises.set(manager, promise)
  }
  return promise
}

/** Why the active use-wallet account cannot sign for an expected address, if it cannot. */
export type SignerProblem = 'notUsable' | 'mismatch' | undefined

/**
 * Network alignment and wallet usability against the shared use-wallet manager. Pass the caller's
 * useWallet() result to avoid a second set of store subscriptions.
 */
export const useWalletNetwork = (wallet: ReturnType<typeof useWallet> = useWallet()) => {
  const { activeAddress, activeWallet, availableWallets } = wallet
  const { activeNetwork, setActiveNetwork } = useNetwork()
  const manager = useWalletManager()

  /** Whether the active wallet may sign on the chain right now. */
  const isActiveWalletUsable = (chainId: number): boolean => {
    const active = activeWallet.value
    return (
      !!active &&
      // the manager (and its algod client) is on the chain's network
      activeNetwork.value === getUseWalletNetworkId(chainId) &&
      // the app's own wallet/chain matrix (what the picker offers for this chain)
      isWalletForChain(active.id, chainId) &&
      // a wallet that does not support the active network is being disconnected by use-wallet v5
      availableWallets.value.some((w) => w.walletKey === active.walletKey)
    )
  }

  /**
   * Switches the manager to the chain's network, after it has resumed its sessions so switching does
   * not race with resuming wallets. Returns false when use-wallet has no network for the chain.
   */
  const switchToChain = async (chainId: number): Promise<boolean> => {
    const networkId = getUseWalletNetworkId(chainId)
    if (!networkId) return false
    await whenManagerReady(manager)
    if (activeNetwork.value !== networkId) await setActiveNetwork(networkId)
    return true
  }

  /**
   * Binds the slot to the manager's active account after a wallet was connected: aligns the network
   * first (not before connect(), popup wallets need the click). Throws when the account cannot be used.
   */
  const bindActiveAccount = async (slot: UseWalletSlot, notUsableMessage: string): Promise<void> => {
    const chainId = slot.chainConfiguration()?.chainId
    if (!chainId || !(await switchToChain(chainId)) || !activeAddress.value || !isActiveWalletUsable(chainId)) {
      throw new Error(notUsableMessage)
    }
    slot.connect(activeAddress.value)
  }

  /**
   * Checks that the active account can sign transactions sent from expectedAddress on the chain. Call
   * it again right before signing, with the sender the transactions were built for.
   */
  const signerProblem = (chainId: number, expectedAddress: string | undefined): SignerProblem => {
    if (!activeAddress.value || !isActiveWalletUsable(chainId)) return 'notUsable'
    if (!expectedAddress || activeAddress.value !== expectedAddress) return 'mismatch'
    return undefined
  }

  return { activeNetwork, isActiveWalletUsable, switchToChain, bindActiveAccount, signerProblem }
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
  const wallet = useWallet()
  const { activeAddress, activeWallet, isReady } = wallet
  const { isActiveWalletUsable, switchToChain } = useWalletNetwork(wallet)
  const toast = useToast()

  const algoChain = () => {
    const chain = slot.chainConfiguration()
    return chain?.type == 'algo' ? chain : undefined
  }
  const isBoundToUseWallet = () => !!algoChain() && slot.connectorType() === AlgoConnectorType.UseWallet && !!slot.address()

  /** Once the manager is ready: adopt its active account, or drop the slot if that session is gone. */
  const syncFromManager = () => {
    const chain = algoChain()
    if (!isReady.value || !chain) return
    if (activeAddress.value && isActiveWalletUsable(chain.chainId)) slot.connect(activeAddress.value)
    else if (isBoundToUseWallet()) slot.disconnect()
  }

  // Follow the wallet the slot was taken from: disconnected -> clear, account switched -> new address.
  watch(activeAddress, (current, previous) => {
    const chain = algoChain()
    if (!isReady.value || !chain || !isBoundToUseWallet() || !previous || slot.address() !== previous) return
    if (current && isActiveWalletUsable(chain.chainId)) slot.setAddress(current)
    else slot.disconnect()
  })

  /**
   * Switches the use-wallet network to match the slot's chain. Returns false when the manager is not on
   * that chain's network afterwards (unknown chain or failed switch), so the slot must not adopt it.
   */
  const syncNetwork = async (): Promise<boolean> => {
    const chain = algoChain()
    if (!chain) return true
    try {
      return await switchToChain(chain.chainId)
    } catch (e: any) {
      showError(toast, e)
      return false
    }
  }

  /**
   * Aligns the manager's network with the slot's chain, then the slot with the manager. Waits until the
   * manager has resumed its sessions, so switching networks does not race with resuming wallets.
   */
  const sync = async () => {
    if (!isReady.value) return
    if (await syncNetwork()) syncFromManager()
    // the manager cannot be on this chain's network, so a use-wallet slot cannot sign for it
    else if (isBoundToUseWallet()) slot.disconnect()
  }
  // the manager is shared with other pages, which may have switched its network: align on setup,
  // whenever the slot's chain changes and once the manager has resumed its sessions
  watch([isReady, () => slot.chainConfiguration()], sync, { immediate: true })

  /**
   * Disconnects the slot and, for a use-wallet slot, the manager session. The slot is cleared even if
   * ending the session fails, so the user is never stuck with it; a session that is in fact still
   * active is shown again by the next sync().
   */
  const disconnect = async () => {
    const usesWallet = slot.connectorType() === AlgoConnectorType.UseWallet
    slot.disconnect()
    if (!usesWallet) return
    try {
      await activeWallet.value?.disconnect()
    } catch (e: any) {
      showError(toast, e)
    }
  }

  return { sync, disconnect }
}
