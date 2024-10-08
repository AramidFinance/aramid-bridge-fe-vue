import type { PublicConfigurationRoot } from '../interface/mapping/PublicConfigurationRoot'

const getAsset = (chain: number, token: string, publicConfiguration: PublicConfigurationRoot) => {
  if (!publicConfiguration) return null
  if (!publicConfiguration.chains) return null
  if (!publicConfiguration.chains[chain]) return null
  if (!publicConfiguration.chains[chain].tokens) return null

  return publicConfiguration.chains[chain].tokens[token]
}
export default getAsset
