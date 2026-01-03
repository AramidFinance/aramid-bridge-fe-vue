import type { PublicConfigurationRoot } from '../interface/mapping/PublicConfigurationRoot'
import type { TokenItem } from '../interface/mapping/TokenItem'

const getToken = (chain: number, token: string, publicConfiguration: PublicConfigurationRoot): TokenItem | null => {
  if (!publicConfiguration) return null
  if (!publicConfiguration.chains) return null
  if (!publicConfiguration.chains[chain]) return null
  if (!publicConfiguration.chains[chain].tokens) return null

  return publicConfiguration.chains[chain].tokens[token]
}
export default getToken
