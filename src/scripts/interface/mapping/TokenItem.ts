export type TokenItem = {
  tokenId: string
  name: string
  chainId: number
  type: string
  symbol: string
  decimals: number
  logo: string
  isPremium: boolean
  asa2arc200BridgeAppId?: number
  arc200TokenId?: number
  optionalArc200TokenId?: number
}
