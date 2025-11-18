import getPublicConfiguration from './getPublicConfiguration'
import logger from '@/scripts/common/conditionalLogger'

const getChainConfiguration = async (chain: number) => {
  if (!chain) return null
  const publicConfiguration = await getPublicConfiguration(false)
  logger.debug(`publicConfiguration ${chain}`, publicConfiguration)
  return publicConfiguration?.chains[chain]
}
export default getChainConfiguration
