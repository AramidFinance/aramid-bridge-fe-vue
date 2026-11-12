import { routeSourceAmount } from '@/scripts/common/routeSourceAmount'
import { describe, expect, it } from 'vitest'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

const route = (params: Record<string, string>) => ({ params }) as unknown as RouteLocationNormalizedLoaded
const params = { sourceChain: 'Algorand', sourceToken: 'USDC', sourceAmount: '5000000' }

describe('routeSourceAmount', () => {
  it('applies the route amount while the route chain and token are selected', () => {
    expect(routeSourceAmount(route(params), 'USDC', 'Algorand')).toBe('5000000')
  })

  it('ignores the route amount for another token, another chain or without an amount', () => {
    expect(routeSourceAmount(route(params), 'ALGO', 'Algorand')).toBeUndefined()
    expect(routeSourceAmount(route(params), 'USDC', 'Base')).toBeUndefined()
    expect(routeSourceAmount(route({ sourceChain: 'Algorand', sourceToken: 'USDC' }), 'USDC', 'Algorand')).toBeUndefined()
    expect(routeSourceAmount(undefined, 'USDC', 'Algorand')).toBeUndefined()
  })
})
