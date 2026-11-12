import type { RouteLocationNormalizedLoaded } from 'vue-router'

/**
 * The bridge route's source amount, if it applies to the selected source token. The route amount is in
 * base units of the route's token (sourceToken is the token configuration's name), so it must not be
 * applied while another token is selected.
 */
export const routeSourceAmount = (route: RouteLocationNormalizedLoaded | undefined, selectedTokenName: string | undefined): string | undefined => {
  const amount = route?.params?.['sourceAmount']
  if (typeof amount !== 'string' || !amount) return undefined
  return route?.params?.['sourceToken'] === selectedTokenName ? amount : undefined
}
