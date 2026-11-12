import { routeSourceAmount } from '@/scripts/common/routeSourceAmount'
import { describe, expect, it } from 'vitest'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

const route = (params: Record<string, string>) => ({ params }) as unknown as RouteLocationNormalizedLoaded

describe('routeSourceAmount', () => {
  it('applies the route amount while the route token is selected', () => {
    expect(routeSourceAmount(route({ sourceToken: 'USDC', sourceAmount: '5000000' }), 'USDC')).toBe('5000000')
  })

  it('ignores the route amount for another token or without an amount', () => {
    expect(routeSourceAmount(route({ sourceToken: 'USDC', sourceAmount: '5000000' }), 'ALGO')).toBeUndefined()
    expect(routeSourceAmount(route({ sourceToken: 'USDC' }), 'USDC')).toBeUndefined()
    expect(routeSourceAmount(undefined, 'USDC')).toBeUndefined()
  })
})
