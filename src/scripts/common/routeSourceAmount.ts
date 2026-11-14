import { isBaseUnits } from './baseUnits'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

/**
 * The bridge route's source amount, if it applies to the selected source chain and token. The route
 * amount is in base units of the route's token on the route's chain (sourceChain/sourceToken are the
 * chain's and the token configuration's names), so it must not be applied to another chain or token.
 */
export const routeSourceAmount = (route: RouteLocationNormalizedLoaded | undefined, selectedTokenName: string | undefined, selectedChainName: string | undefined): string | undefined => {
  const amount = route?.params?.['sourceAmount']
  // base units are a non-negative integer
  if (!isBaseUnits(amount)) return undefined
  return route?.params?.['sourceToken'] === selectedTokenName && route?.params?.['sourceChain'] === selectedChainName ? amount : undefined
}
