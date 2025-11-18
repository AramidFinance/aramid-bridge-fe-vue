import type { PublicConfigurationRoot } from '../interface/mapping/PublicConfigurationRoot'
import logger from '@/scripts/common/conditionalLogger'

const getChainConfigurationSync = (chain: number, publicConfiguration: PublicConfigurationRoot) => {
  if (!chain) return null
  logger.debug(`publicConfiguration ${chain}`, publicConfiguration)
  return publicConfiguration?.chains[chain]
}
export default getChainConfigurationSync
