import { isWalletForChain } from '@/scripts/algo/isWalletForChain'
import { CHAIN_ID_ALGORAND, CHAIN_ID_ALGORAND_TESTNET, CHAIN_ID_ARAMID, CHAIN_ID_VOI } from '@/scripts/common/chainIds'
import { showError } from '@/scripts/common/showError'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import { NetworkId, useNetwork, useWallet, useWalletManager, type WalletManager } from '@txnlab/use-wallet-vue'
import algosdk from 'algosdk'
import { useToast } from 'primevue/usetoast'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const networkIdByChainId = new Map<number, string>([
  [CHAIN_ID_ALGORAND, NetworkId.MAINNET],
  [CHAIN_ID_ALGORAND_TESTNET, NetworkId.TESTNET],
  [CHAIN_ID_VOI, 'voimain'],
  [CHAIN_ID_ARAMID, 'aramidmain']
])
const chainIdByNetworkId = new Map<string, number>([...networkIdByChainId].map(([chainId, networkId]) => [networkId, chainId]))

/** The use-wallet network id of an AVM chain, or undefined when use-wallet has no network for it. */
export const getUseWalletNetworkId = (chainId: number | undefined): string | undefined => (chainId === undefined ? undefined : networkIdByChainId.get(chainId))

/** The AVM chain id of a use-wallet network id, or undefined for unknown networks. */
export const getChainIdByUseWalletNetwork = (networkId: string): number | undefined => chainIdByNetworkId.get(networkId)

// one pending "ready" promise per manager, independent of any component's lifetime
const readyPromises = new WeakMap<WalletManager, Promise<void>>()
/** Resolves once the manager has resumed its sessions. */
const whenManagerReady = (manager: WalletManager): Promise<void> => {
  if (manager.isReady) return Promise.resolve()
  let promise = readyPromises.get(manager)
  if (!promise) {
    promise = new Promise<void>((resolve) => {
      const off = manager.on('ready', () => {
        off()
        readyPromises.delete(manager)
        resolve()
      })
    })
    readyPromises.set(manager, promise)
  }
  return promise
}

type WalletConnectSession = { namespaces?: { algorand?: { chains?: string[]; accounts?: string[] } } }
type AdapterWithSession = {
  // the generic WalletConnect adapter
  session?: WalletConnectSession
  // Biatec Wallet: its WalletConnect transport, when that is the active connection method
  activeMethod?: string
  walletConnect?: { session?: WalletConnectSession }
}

/**
 * WalletConnect sessions are approved for specific chains (the generic WalletConnect adapter only
 * requests the network that was active when connecting; a wallet may approve only the required chain).
 * Adapters without such a session are not restricted. The session is read from the adapter instance,
 * as use-wallet does not expose it.
 */
const sessionAllowsActiveNetwork = (manager: WalletManager, walletKey: string): boolean => {
  const adapter = manager.getWallet(walletKey) as unknown as AdapterWithSession | undefined
  const session = adapter?.session ?? (adapter?.activeMethod === 'walletconnect' ? adapter.walletConnect?.session : undefined)
  const algorand = session?.namespaces?.algorand
  const caipChainId = manager.activeNetworkConfig?.caipChainId
  if (!algorand || !caipChainId) return true
  // accounts are "algorand:<chain reference>:<address>"
  const chains = algorand.chains?.length ? algorand.chains : (algorand.accounts ?? []).map((account) => account.split(':').slice(0, 2).join(':'))
  return chains.includes(caipChainId)
}

/**
 * Network alignment and wallet usability against the shared use-wallet manager. Pass the caller's
 * useWallet() result to avoid a second set of store subscriptions.
 */
export const useWalletNetwork = (wallet: ReturnType<typeof useWallet> = useWallet()) => {
  const { activeAddress, activeWallet, signTransactions } = wallet
  const { activeNetwork, setActiveNetwork } = useNetwork()
  const manager = useWalletManager()
  const { t } = useI18n()
  const toast = useToast()

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
      manager.availableWallets.some((w) => w.walletKey === active.walletKey) &&
      sessionAllowsActiveNetwork(manager, active.walletKey)
    )
  }

  /**
   * Switches the manager to the chain's network, after it has resumed its sessions so switching does
   * not race with resuming wallets. Returns false when use-wallet has no network for the chain, or when
   * isStillWanted() says the chain changed while waiting (a newer request handles it then).
   */
  const switchToChain = async (chainId: number, isStillWanted: () => boolean = () => true): Promise<boolean> => {
    const networkId = getUseWalletNetworkId(chainId)
    if (!networkId) return false
    await whenManagerReady(manager)
    if (!isStillWanted()) return false
    if (activeNetwork.value !== networkId) await setActiveNetwork(networkId)
    return true
  }

  /**
   * Binds the slot to the manager's active account after a wallet was connected: aligns the network
   * first (not before connect(), popup wallets need the click). Throws when the account cannot be used.
   */
  const bindActiveAccount = async (slot: UseWalletSlot): Promise<void> => {
    const chainId = slot.chainConfiguration()?.chainId
    if (!chainId || !(await switchToChain(chainId)) || !activeAddress.value || !isActiveWalletUsable(chainId)) {
      throw new Error(t('sign.useWalletNotInitialized'))
    }
    slot.connect(activeAddress.value)
  }

  /**
   * Connects the picked wallet and binds the slot to its account. Returns whether that worked; errors
   * (including a cancelled connect) are shown as a toast.
   */
  const connectAndBind = async (picked: { connect: () => Promise<unknown> }, slot: UseWalletSlot): Promise<boolean> => {
    try {
      // align first so a WalletConnect session is approved for this chain; once the manager is ready
      // this is a short await, which keeps the click's user activation for popup wallets
      const chainId = slot.chainConfiguration()?.chainId
      if (chainId && manager.isReady) await switchToChain(chainId)
      await picked.connect()
      await bindActiveAccount(slot)
      return true
    } catch (e: any) {
      showError(toast, e)
      return false
    }
  }

  /**
   * Throws (as ErrorClass) when the active account cannot sign transactions sent from sender on the
   * chain. Call it before building the transactions and again right before signing them.
   */
  const assertSigner = (chainId: number, sender: string | undefined, ErrorClass: new (message: string) => Error = Error): void => {
    if (!activeAddress.value || !isActiveWalletUsable(chainId)) throw new ErrorClass(t('sign.useWalletNotInitialized'))
    if (!sender || activeAddress.value !== sender) throw new ErrorClass(t('sign.useWalletAddressMismatch'))
  }

  /**
   * The only signing path for bound accounts: checks that the manager is on the chain the transactions
   * were built for with their sender, then signs them.
   */
  const signAs = async (chainId: number, sender: string, txns: algosdk.Transaction[], ErrorClass: new (message: string) => Error = Error): Promise<(Uint8Array | null)[]> => {
    assertSigner(chainId, sender, ErrorClass)
    return signTransactions(txns)
  }

  return { activeNetwork, isActiveWalletUsable, switchToChain, connectAndBind, assertSigner, signAs }
}

/** An app-level wallet slot (source / ARC200 bridge) in the app store. */
export interface UseWalletSlot {
  chainConfiguration: () => ChainItem | undefined
  connectorType: () => AlgoConnectorType | undefined
  address: () => string | undefined
  /** Binds the slot to a use-wallet account (address, connector type and connected chain). */
  connect: (address: string) => void
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
  const { activeNetwork, isActiveWalletUsable, switchToChain } = useWalletNetwork(wallet)
  const toast = useToast()

  const algoChain = () => {
    const chain = slot.chainConfiguration()
    return chain?.type == 'algo' ? chain : undefined
  }
  const isBoundToUseWallet = () => !!algoChain() && slot.connectorType() === AlgoConnectorType.UseWallet && !!slot.address()

  /**
   * Once the manager is on the network of alignedChainId: adopt its active account, or drop the slot if
   * that session is gone. Skipped when the slot's chain changed meanwhile (a newer sync handles it).
   */
  const syncFromManager = (alignedChainId: number) => {
    const chain = algoChain()
    if (!isReady.value || !chain || chain.chainId !== alignedChainId) return
    if (activeAddress.value && isActiveWalletUsable(chain.chainId)) slot.connect(activeAddress.value)
    else if (isBoundToUseWallet()) slot.disconnect()
  }

  // A network switch made elsewhere (e.g. before bridging) can make the bound wallet unusable on the
  // slot's own network without changing its address (a WalletConnect session approved for another chain).
  watch(activeNetwork, (network) => {
    const chain = algoChain()
    if (!isReady.value || !chain || !isBoundToUseWallet() || network !== getUseWalletNetworkId(chain.chainId)) return
    if (!isActiveWalletUsable(chain.chainId)) slot.disconnect()
  })

  // Follow the wallet the slot was taken from: disconnected -> clear, account switched -> new address.
  watch(activeAddress, (current, previous) => {
    const chain = algoChain()
    if (!isReady.value || !chain || !isBoundToUseWallet() || !previous || slot.address() !== previous) return
    if (current && isActiveWalletUsable(chain.chainId)) slot.connect(current)
    else slot.disconnect()
  })

  /**
   * Switches the use-wallet network to match the slot's chain: 'aligned' when the manager is on it,
   * 'failed' when it cannot be (unknown chain or failed switch), 'stale' when the chain changed meanwhile.
   */
  const syncNetwork = async (chainId: number): Promise<'aligned' | 'failed' | 'stale'> => {
    const isStillWanted = () => algoChain()?.chainId === chainId
    try {
      if (await switchToChain(chainId, isStillWanted)) return 'aligned'
      return isStillWanted() ? 'failed' : 'stale'
    } catch (e: any) {
      if (!isStillWanted()) return 'stale'
      showError(toast, e)
      return 'failed'
    }
  }

  /**
   * Aligns the manager's network with the slot's chain, then the slot with the manager. Waits until the
   * manager has resumed its sessions, so switching networks does not race with resuming wallets.
   */
  const sync = async () => {
    const chain = algoChain()
    if (!chain) {
      // the slot moved to a non-AVM chain: an Algorand address bound through use-wallet cannot be used there
      if (slot.chainConfiguration() && slot.connectorType() === AlgoConnectorType.UseWallet && algosdk.isValidAddress(slot.address() ?? '')) slot.disconnect()
      return
    }
    if (!isReady.value) return
    const network = await syncNetwork(chain.chainId)
    if (network === 'aligned') syncFromManager(chain.chainId)
    // the manager cannot be on this chain's network, so a use-wallet slot cannot sign for it
    else if (network === 'failed' && isBoundToUseWallet()) slot.disconnect()
  }
  // the manager is shared with other pages, which may have switched its network: align on setup,
  // whenever the slot's chain changes and once the manager has resumed its sessions
  watch([isReady, () => slot.chainConfiguration()?.chainId], sync, { immediate: true })

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

  return { disconnect }
}
