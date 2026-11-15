import { DEFAULT_ARC200_CHAIN, fillArc200BridgeChainConfiguration } from '@/scripts/events/fillArc200BridgeChainConfiguration'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = vi.hoisted(() => ({
  state: {} as {
    publicConfiguration?: { chains: Record<number, { chainId: number }> }
    arc200BridgeChain?: number
    arc200BridgeChainConfiguration?: { chainId: number }
    arc200BridgeChainGenesis?: string
    arc200BridgeToken?: string
    arc200BridgeTokenConfiguration?: object
    arc200BridgeAmount?: string
    arc200BridgeAmountFormatted?: string
  }
}))
vi.mock('@/stores/app', () => ({ useAppStore: () => store }))
vi.mock('@/scripts/events/fillRouteInfo', () => ({ fillRouteInfo: vi.fn() }))

const configured = (...chainIds: number[]) => ({ chains: Object.fromEntries(chainIds.map((chainId) => [chainId, { chainId }])) })

beforeEach(() => {
  store.state = { publicConfiguration: configured(416001, 416101) }
})

describe('fillArc200BridgeChainConfiguration', () => {
  it('uses the requested chain', () => {
    fillArc200BridgeChainConfiguration(416001)
    expect(store.state.arc200BridgeChain).toBe(416001)
    expect(store.state.arc200BridgeChainConfiguration?.chainId).toBe(416001)
  })

  it('defaults to the already selected chain (e.g. from the route)', () => {
    store.state.arc200BridgeChain = 416001
    fillArc200BridgeChainConfiguration()
    expect(store.state.arc200BridgeChain).toBe(416001)
    expect(store.state.arc200BridgeChainConfiguration?.chainId).toBe(416001)
  })

  it('defaults to Voi when nothing is selected', () => {
    fillArc200BridgeChainConfiguration()
    expect(store.state.arc200BridgeChain).toBe(DEFAULT_ARC200_CHAIN)
  })

  it('falls back to the default chain, with its configuration, for a chain without configuration', () => {
    store.state.arc200BridgeChain = 416002
    fillArc200BridgeChainConfiguration(416002)
    expect(store.state.arc200BridgeChain).toBe(DEFAULT_ARC200_CHAIN)
    expect(store.state.arc200BridgeChainConfiguration?.chainId).toBe(DEFAULT_ARC200_CHAIN)
  })

  it('waits for the public configuration', () => {
    store.state = { arc200BridgeChain: 416001 }
    fillArc200BridgeChainConfiguration()
    expect(store.state.arc200BridgeChainConfiguration).toBeUndefined()
  })
})

describe('fillArc200BridgeChainConfiguration token selection', () => {
  it('keeps the token selection when the chain stays the same', () => {
    store.state.arc200BridgeChain = 416001
    store.state.arc200BridgeToken = '123'
    store.state.arc200BridgeAmount = '5'
    fillArc200BridgeChainConfiguration(416001)
    expect(store.state.arc200BridgeToken).toBe('123')
    expect(store.state.arc200BridgeAmount).toBe('5')
  })

  it('drops the token selection made for another chain', () => {
    store.state.arc200BridgeChain = 416001
    store.state.arc200BridgeToken = '123'
    store.state.arc200BridgeTokenConfiguration = { tokenId: '123' }
    store.state.arc200BridgeAmount = '5'
    fillArc200BridgeChainConfiguration(416101)
    expect(store.state.arc200BridgeToken).toBeUndefined()
    expect(store.state.arc200BridgeTokenConfiguration).toBeUndefined()
    expect(store.state.arc200BridgeAmount).toBe('5') // the amount input keeps its value
  })
})
