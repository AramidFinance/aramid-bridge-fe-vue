import { getChainIdByUseWalletNetwork, getUseWalletNetworkId, useWalletNetwork, useWalletSync, WalletNotUsableError } from '@/scripts/algo/useWalletSync'
import { arc200BridgeWalletSlot, sourceWalletSlot } from '@/scripts/algo/walletSlots'
import { AlgoConnectorType } from '@/scripts/interface/algo/AlgoConnectorType'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import * as useWalletVue from '@txnlab/use-wallet-vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, reactive, type EffectScope } from 'vue'

const toast = vi.hoisted(() => ({ add: vi.fn() }))
vi.mock('primevue/usetoast', () => ({ useToast: () => toast }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

vi.mock('@txnlab/use-wallet-vue', async () => {
  const { ref, watch } = await import('vue')
  const mock = {
    activeAddress: ref<string | null>(null),
    activeWallet: ref<any>(null),
    availableWallets: ref<any[]>([]),
    isReady: ref(true),
    activeNetwork: ref('mainnet'),
    setActiveNetwork: vi.fn(),
    signTransactions: vi.fn(async (txns: unknown[]) => txns.map(() => new Uint8Array([1]))),
    sessions: {} as Record<string, unknown>
  }
  return {
    NetworkId: { MAINNET: 'mainnet', TESTNET: 'testnet' },
    useWallet: () => ({
      activeAddress: mock.activeAddress,
      activeWallet: mock.activeWallet,
      availableWallets: mock.availableWallets,
      isReady: mock.isReady,
      signTransactions: mock.signTransactions
    }),
    useNetwork: () => ({ activeNetwork: mock.activeNetwork, setActiveNetwork: mock.setActiveNetwork }),
    useWalletManager: () => ({
      get isReady() {
        return mock.isReady.value
      },
      get availableWallets() {
        return mock.availableWallets.value
      },
      get activeNetworkConfig() {
        return { caipChainId: `caip:${mock.activeNetwork.value}` }
      },
      on: (_event: 'ready', handler: () => void) => watch(mock.isReady, (ready) => ready && handler()),
      getWallet: (walletKey: string) => mock.sessions[walletKey] as object | undefined
    }),
    __mock: mock
  }
})
const manager = (useWalletVue as any).__mock as {
  activeAddress: { value: string | null }
  activeWallet: { value: any }
  availableWallets: { value: any[] }
  isReady: { value: boolean }
  activeNetwork: { value: string }
  setActiveNetwork: ReturnType<typeof vi.fn>
  signTransactions: ReturnType<typeof vi.fn>
  sessions: Record<string, unknown>
}

const chain = (chainId: number, type = 'algo') => ({ chainId, type, name: String(chainId) }) as unknown as ChainItem
const makeWallet = (id: string, disconnect = vi.fn(async () => undefined)) => ({ id, walletKey: id, disconnect })

const ADDR_A = 'AAAA'
const ADDR_B = 'BBBB'

const makeStore = (sourceChain: number) =>
  reactive({
    state: {
      sourceChain,
      sourceChainConfiguration: chain(sourceChain),
      sourceAlgoConnectorType: undefined as AlgoConnectorType | undefined,
      sourceAddress: '',
      connectedSourceChain: undefined as number | undefined,
      arc200BridgeChain: sourceChain,
      arc200BridgeChainConfiguration: chain(sourceChain),
      arc200BridgeAlgoConnectorType: undefined as AlgoConnectorType | undefined,
      arc200BridgeAddress: '',
      connectedArc200BridgeChain: undefined as number | undefined
    }
  })

let scope: EffectScope
const setup = (store: ReturnType<typeof makeStore>) => {
  scope = effectScope()
  return scope.run(() => useWalletSync(sourceWalletSlot(store as any)))!
}
/** Lets the sync() started on setup (immediate watcher) finish. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
/** Sets up the sync for the store and waits for its initial sync. */
const setupSynced = async (store: ReturnType<typeof makeStore>) => {
  const api = setup(store)
  await settle()
  return api
}
const useActiveWallet = (wallet: ReturnType<typeof makeWallet> | null, address: string | null, available = true) => {
  manager.activeWallet.value = wallet
  manager.activeAddress.value = address
  manager.availableWallets.value = wallet && available ? [wallet] : []
}

beforeEach(() => {
  manager.isReady.value = true
  manager.activeNetwork.value = 'mainnet'
  manager.setActiveNetwork.mockReset()
  manager.setActiveNetwork.mockImplementation(async (id: string) => {
    manager.activeNetwork.value = id
  })
  useActiveWallet(null, null)
  manager.sessions = {}
  manager.signTransactions.mockClear()
  toast.add.mockReset()
})
afterEach(() => scope?.stop())

describe('getUseWalletNetworkId', () => {
  it('maps AVM chain ids to use-wallet networks', () => {
    expect(getUseWalletNetworkId(416001)).toBe('mainnet')
    expect(getUseWalletNetworkId(416002)).toBe('testnet')
    expect(getUseWalletNetworkId(416101)).toBe('voimain')
    expect(getUseWalletNetworkId(101003)).toBe('aramidmain')
    expect(getUseWalletNetworkId(416102)).toBeUndefined()
    expect(getUseWalletNetworkId(undefined)).toBeUndefined()
  })

  it('maps use-wallet networks back to chain ids', () => {
    expect(getChainIdByUseWalletNetwork('voimain')).toBe(416101)
    expect(getChainIdByUseWalletNetwork('aramidmain')).toBe(101003)
    expect(getChainIdByUseWalletNetwork('mainnet')).toBe(416001)
    expect(getChainIdByUseWalletNetwork('nope')).toBeUndefined()
    expect(getChainIdByUseWalletNetwork('constructor')).toBeUndefined()
  })
})

describe('useWalletSync.sync', () => {
  it('switches the network and adopts a usable active account', async () => {
    const store = makeStore(416101)
    useActiveWallet(makeWallet('biatec'), ADDR_A)
    await setupSynced(store)
    expect(manager.setActiveNetwork).toHaveBeenCalledWith('voimain')
    expect(store.state.sourceAddress).toBe(ADDR_A)
    expect(store.state.sourceAlgoConnectorType).toBe(AlgoConnectorType.UseWallet)
    expect(store.state.connectedSourceChain).toBe(416101)
  })

  it('does not adopt a wallet the app does not offer for the chain, and drops a slot bound to it', async () => {
    const store = makeStore(416001)
    store.state.sourceAddress = ADDR_A
    store.state.sourceAlgoConnectorType = AlgoConnectorType.UseWallet
    store.state.connectedSourceChain = 416001
    useActiveWallet(makeWallet('kibisis'), ADDR_A) // kibisis is not offered on Algorand mainnet
    await setupSynced(store)
    expect(store.state.sourceAddress).toBe('')
    expect(store.state.connectedSourceChain).toBeUndefined()
  })

  it('does not adopt a wallet that does not support the active network', async () => {
    const store = makeStore(416101)
    useActiveWallet(makeWallet('lute'), ADDR_A, false)
    await setupSynced(store)
    expect(store.state.sourceAddress).toBe('')
  })

  it('leaves the slot alone for chains without a use-wallet network', async () => {
    const store = makeStore(416102)
    useActiveWallet(makeWallet('biatec'), ADDR_A)
    await setupSynced(store)
    expect(manager.setActiveNetwork).not.toHaveBeenCalled()
    expect(store.state.sourceAddress).toBe('')
  })

  it('does not adopt when switching the network fails', async () => {
    const store = makeStore(416101)
    useActiveWallet(makeWallet('biatec'), ADDR_A)
    manager.setActiveNetwork.mockRejectedValue(new Error('boom'))
    await setupSynced(store)
    expect(store.state.sourceAddress).toBe('')
    expect(toast.add).toHaveBeenCalled()
  })

  it('drops a bound slot when the network cannot be aligned', async () => {
    const store = makeStore(416101)
    store.state.sourceAddress = ADDR_A
    store.state.sourceAlgoConnectorType = AlgoConnectorType.UseWallet
    store.state.connectedSourceChain = 416001
    useActiveWallet(makeWallet('biatec'), ADDR_A)
    manager.setActiveNetwork.mockRejectedValue(new Error('boom'))
    await setupSynced(store)
    expect(store.state.sourceAddress).toBe('')
    expect(store.state.connectedSourceChain).toBeUndefined()
  })

  it('ignores EVM chains', async () => {
    const store = makeStore(416001)
    store.state.sourceChainConfiguration = chain(8453, 'eth')
    store.state.sourceAddress = '0xabc'
    useActiveWallet(makeWallet('biatec'), ADDR_A)
    await setupSynced(store)
    expect(manager.setActiveNetwork).not.toHaveBeenCalled()
    expect(store.state.sourceAddress).toBe('0xabc')
  })

  it('waits for the manager to be ready', async () => {
    const store = makeStore(416101)
    manager.isReady.value = false
    useActiveWallet(makeWallet('biatec'), ADDR_A)
    await setupSynced(store)
    expect(manager.setActiveNetwork).not.toHaveBeenCalled() // no switching while sessions resume
    expect(store.state.sourceAddress).toBe('')
    manager.isReady.value = true
    await nextTick()
    await vi.waitFor(() => expect(store.state.sourceAddress).toBe(ADDR_A))
  })
})

describe('useWalletSync active address watcher', () => {
  const bind = (store: ReturnType<typeof makeStore>, address: string) => {
    store.state.sourceAddress = address
    store.state.sourceAlgoConnectorType = AlgoConnectorType.UseWallet
    store.state.connectedSourceChain = 416001
  }

  it('follows an account switch of the bound wallet', async () => {
    const store = makeStore(416001)
    const wallet = makeWallet('pera')
    useActiveWallet(wallet, ADDR_A)
    bind(store, ADDR_A)
    setup(store)
    manager.activeAddress.value = ADDR_B
    await nextTick()
    expect(store.state.sourceAddress).toBe(ADDR_B)
  })

  it('clears the slot when the bound wallet disconnects', async () => {
    const store = makeStore(416001)
    useActiveWallet(makeWallet('pera'), ADDR_A)
    bind(store, ADDR_A)
    setup(store)
    useActiveWallet(null, null)
    await nextTick()
    expect(store.state.sourceAddress).toBe('')
    expect(store.state.connectedSourceChain).toBeUndefined()
  })

  it('ignores changes of a wallet the slot was not taken from', async () => {
    const store = makeStore(416001)
    useActiveWallet(makeWallet('pera'), ADDR_A)
    bind(store, ADDR_A)
    setup(store)
    await settle()
    store.state.sourceAddress = 'OTHER'
    manager.activeAddress.value = ADDR_B
    await nextTick()
    expect(store.state.sourceAddress).toBe('OTHER')
  })

  it('aligns the network when the slot chain changes', async () => {
    const store = makeStore(416001)
    setup(store)
    await vi.waitFor(() => expect(manager.activeNetwork.value).toBe('mainnet'))
    store.state.sourceChainConfiguration = chain(101003)
    await vi.waitFor(() => expect(manager.setActiveNetwork).toHaveBeenLastCalledWith('aramidmain'))
  })
})

describe('useWalletSync.disconnect', () => {
  it('ends the use-wallet session and clears the slot', async () => {
    const store = makeStore(416001)
    const wallet = makeWallet(
      'pera',
      vi.fn(async () => {
        useActiveWallet(null, null)
      })
    )
    useActiveWallet(wallet, ADDR_A)
    store.state.sourceAddress = ADDR_A
    store.state.sourceAlgoConnectorType = AlgoConnectorType.UseWallet
    const { disconnect } = setup(store)
    await settle()
    await disconnect()
    await settle()
    expect(wallet.disconnect).toHaveBeenCalled()
    expect(store.state.sourceAddress).toBe('')
  })

  it('clears the slot even when the session cannot be ended', async () => {
    const store = makeStore(416001)
    const wallet = makeWallet(
      'pera',
      vi.fn(async () => {
        throw new Error('relay down')
      })
    )
    useActiveWallet(wallet, ADDR_A)
    store.state.sourceAddress = ADDR_A
    store.state.sourceAlgoConnectorType = AlgoConnectorType.UseWallet
    const { disconnect } = setup(store)
    await settle()
    await disconnect()
    expect(wallet.disconnect).toHaveBeenCalled()
    expect(store.state.sourceAddress).toBe('')
    expect(toast.add).toHaveBeenCalled()
  })

  it('clears a QR-code slot without touching use-wallet', async () => {
    const store = makeStore(416001)
    const wallet = makeWallet('pera')
    useActiveWallet(wallet, ADDR_A)
    store.state.sourceAddress = 'QRADDRESS'
    store.state.sourceAlgoConnectorType = AlgoConnectorType.QRCode
    const { disconnect } = setup(store)
    await settle()
    store.state.sourceAddress = 'QRADDRESS' // mount adopts the active account (pre-existing behaviour)
    store.state.sourceAlgoConnectorType = AlgoConnectorType.QRCode
    await disconnect()
    expect(wallet.disconnect).not.toHaveBeenCalled()
    expect(store.state.sourceAddress).toBe('')
  })
})

describe('walletSlots', () => {
  it('binds the ARC200 slot to its own fields and chain configuration', () => {
    const store = makeStore(416101)
    store.state.arc200BridgeChain = 1 // out of sync with the configuration on purpose
    arc200BridgeWalletSlot(store as any).connect(ADDR_A)
    expect(store.state.arc200BridgeAddress).toBe(ADDR_A)
    expect(store.state.arc200BridgeAlgoConnectorType).toBe(AlgoConnectorType.UseWallet)
    expect(store.state.connectedArc200BridgeChain).toBe(416101)
    expect(store.state.sourceAddress).toBe('')
  })
})

describe('useWalletNetwork', () => {
  const run = () => {
    scope = effectScope()
    return scope.run(() => useWalletNetwork())!
  }

  it('treats a wallet as unusable while the manager is on another network', () => {
    useActiveWallet(makeWallet('lute'), ADDR_A)
    manager.activeNetwork.value = 'mainnet'
    const { isActiveWalletUsable } = run()
    expect(isActiveWalletUsable(416101)).toBe(false)
    manager.activeNetwork.value = 'voimain'
    expect(isActiveWalletUsable(416101)).toBe(true)
  })

  it('switches networks only once the manager is ready', async () => {
    manager.isReady.value = false
    const { switchToChain } = run()
    const switching = switchToChain(416101)
    await settle()
    expect(manager.setActiveNetwork).not.toHaveBeenCalled()
    manager.isReady.value = true
    await expect(switching).resolves.toBe(true)
    expect(manager.setActiveNetwork).toHaveBeenCalledWith('voimain')
  })

  it('binds a connected, usable account after aligning the network', async () => {
    const store = makeStore(101003)
    useActiveWallet(makeWallet('biatec'), ADDR_A)
    const { connectAndBind } = run()
    const picked = { connect: vi.fn(async () => undefined) }
    await expect(connectAndBind(picked, sourceWalletSlot(store as any))).resolves.toBe(true)
    expect(picked.connect).toHaveBeenCalled()
    expect(manager.setActiveNetwork).toHaveBeenCalledWith('aramidmain')
    expect(store.state.sourceAddress).toBe(ADDR_A)
    expect(store.state.connectedSourceChain).toBe(101003)
  })

  it('refuses to bind a wallet the app does not offer for the chain', async () => {
    const store = makeStore(101003)
    useActiveWallet(makeWallet('pera'), ADDR_A)
    const { connectAndBind } = run()
    await expect(connectAndBind({ connect: async () => undefined }, sourceWalletSlot(store as any))).resolves.toBe(false)
    expect(store.state.sourceAddress).toBe('')
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'sign.useWalletNotInitialized' }))
  })

  it('shows a failed or cancelled connect instead of throwing', async () => {
    const store = makeStore(101003)
    const { connectAndBind } = run()
    await connectAndBind(
      {
        connect: async () => {
          throw new Error('cancelled')
        }
      },
      sourceWalletSlot(store as any)
    )
    expect(store.state.sourceAddress).toBe('')
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ detail: 'cancelled' }))
  })
})

describe('useWalletNetwork.assertSigner problems', () => {
  it('reports unusable wallets and sender mismatches', () => {
    scope = effectScope()
    const { assertSigner } = scope.run(() => useWalletNetwork())!
    useActiveWallet(makeWallet('biatec'), ADDR_A)
    manager.activeNetwork.value = 'mainnet'
    expect(() => assertSigner(416001, ADDR_A)).not.toThrow()
    expect(() => assertSigner(416001, undefined)).toThrow('sign.useWalletAddressMismatch')
    expect(() => assertSigner(416001, ADDR_B)).toThrow(WalletNotUsableError)
    expect(() => assertSigner(416101, ADDR_A)).toThrow('sign.useWalletNotInitialized') // manager on another network
    useActiveWallet(null, null)
    expect(() => assertSigner(416001, ADDR_A)).toThrow('sign.useWalletNotInitialized')
  })

  it('accepts a WalletConnect session that lists no chains but has accounts on the chain', () => {
    scope = effectScope()
    const { isActiveWalletUsable } = scope.run(() => useWalletNetwork())!
    useActiveWallet(makeWallet('walletconnect'), ADDR_A)
    manager.sessions.walletconnect = { session: { namespaces: { algorand: { chains: [], accounts: [`caip:mainnet:${ADDR_A}`] } } } }
    expect(isActiveWalletUsable(416001)).toBe(true)
  })
})

describe('WalletConnect sessions', () => {
  it('treats a session as usable only on the chains it was approved for', () => {
    scope = effectScope()
    const { isActiveWalletUsable } = scope.run(() => useWalletNetwork())!
    useActiveWallet(makeWallet('walletconnect'), ADDR_A)
    manager.sessions.walletconnect = { session: { namespaces: { algorand: { accounts: [`caip:mainnet:${ADDR_A}`] } } } }
    manager.activeNetwork.value = 'mainnet'
    expect(isActiveWalletUsable(416001)).toBe(true)
    manager.activeNetwork.value = 'voimain'
    expect(isActiveWalletUsable(416101)).toBe(false)
  })
})

describe('useWalletSync with a chain that changes while waiting', () => {
  it('does not switch to the network of a chain that is no longer selected', async () => {
    const store = makeStore(416101)
    manager.isReady.value = false
    setup(store)
    manager.isReady.value = true
    store.state.sourceChainConfiguration = chain(416001)
    await settle()
    await settle()
    expect(manager.setActiveNetwork).not.toHaveBeenCalledWith('voimain')
    expect(manager.activeNetwork.value).toBe('mainnet')
  })
})

describe('useWalletNetwork.signAs', () => {
  it('signs only after checking the chain and sender the transactions were built for', async () => {
    scope = effectScope()
    const { signAs } = scope.run(() => useWalletNetwork())!
    useActiveWallet(makeWallet('biatec'), ADDR_A)
    const txns = [{} as any]
    await expect(signAs(416001, ADDR_A, txns)).resolves.toHaveLength(1)
    expect(manager.signTransactions).toHaveBeenCalledTimes(1)
    await expect(signAs(416001, ADDR_B, txns)).rejects.toThrow('sign.useWalletAddressMismatch')
    await expect(signAs(416101, ADDR_A, txns)).rejects.toThrow('sign.useWalletNotInitialized')
    expect(manager.signTransactions).toHaveBeenCalledTimes(1)
  })
})

describe('useWalletNetwork.connectAndBind ordering', () => {
  it('aligns the network before connecting, so the session is approved for the chain', async () => {
    const store = makeStore(416101)
    scope = effectScope()
    const { connectAndBind } = scope.run(() => useWalletNetwork())!
    const networkAtConnect: string[] = []
    const picked = {
      connect: vi.fn(async () => {
        networkAtConnect.push(manager.activeNetwork.value)
        useActiveWallet(makeWallet('biatec'), ADDR_A)
      })
    }
    await connectAndBind(picked, sourceWalletSlot(store as any))
    expect(networkAtConnect).toEqual(['voimain'])
    expect(store.state.sourceAddress).toBe(ADDR_A)
  })
})

describe('useWalletSync network watcher', () => {
  it('drops a bound slot when a switch to its network makes the wallet unusable', async () => {
    const store = makeStore(416101)
    store.state.sourceAddress = ADDR_A
    store.state.sourceAlgoConnectorType = AlgoConnectorType.UseWallet
    store.state.connectedSourceChain = 416101
    manager.activeNetwork.value = 'voimain'
    useActiveWallet(makeWallet('walletconnect'), ADDR_A)
    // a session approved for mainnet only
    manager.sessions.walletconnect = { session: { namespaces: { algorand: { accounts: [`caip:mainnet:${ADDR_A}`] } } } }
    manager.activeNetwork.value = 'mainnet'
    setup(store)
    await settle()
    manager.activeNetwork.value = 'voimain'
    await nextTick()
    expect(store.state.sourceAddress).toBe('')
  })

  it('ignores switches to other networks', async () => {
    const store = makeStore(416101)
    useActiveWallet(makeWallet('biatec'), ADDR_A)
    setup(store)
    await settle()
    expect(store.state.sourceAddress).toBe(ADDR_A)
    manager.activeNetwork.value = 'mainnet'
    await nextTick()
    expect(store.state.sourceAddress).toBe(ADDR_A)
  })
})

describe('Biatec WalletConnect sessions', () => {
  it('checks the WalletConnect transport session only while it is the active method', () => {
    scope = effectScope()
    const { isActiveWalletUsable } = scope.run(() => useWalletNetwork())!
    useActiveWallet(makeWallet('biatec'), ADDR_A)
    const wcSession = { namespaces: { algorand: { accounts: [`caip:mainnet:${ADDR_A}`] } } }
    manager.activeNetwork.value = 'voimain'
    manager.sessions.biatec = { activeMethod: 'walletconnect', walletConnect: { session: wcSession } }
    expect(isActiveWalletUsable(416101)).toBe(false)
    manager.sessions.biatec = { activeMethod: 'liquid', walletConnect: { session: wcSession } }
    expect(isActiveWalletUsable(416101)).toBe(true)
  })
})

describe('WalletConnect adapters without a live session', () => {
  it('are not usable', () => {
    scope = effectScope()
    const { isActiveWalletUsable } = scope.run(() => useWalletNetwork())!
    useActiveWallet(makeWallet('walletconnect'), ADDR_A)
    manager.sessions.walletconnect = { session: null }
    expect(isActiveWalletUsable(416001)).toBe(false)
    useActiveWallet(makeWallet('biatec'), ADDR_A)
    manager.sessions.biatec = { activeMethod: 'walletconnect', walletConnect: { session: null } }
    expect(isActiveWalletUsable(416001)).toBe(false)
  })
})
