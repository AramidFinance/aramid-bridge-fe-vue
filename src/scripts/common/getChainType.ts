import type { PublicConfigurationRoot } from '../interface/mapping/PublicConfigurationRoot'
import { NEAR_CHAIN_ID_MAINNET, NEAR_CHAIN_ID_TESTNET } from '../near/constant'
/**
 * returns eth|algo
 *
 * @param chain
 * @returns eth|algo
 */
const getChainType = (chain: number, _publicConfiguration: PublicConfigurationRoot): string | null => {
  if (chain <= 0) return null
  if (chain == 416001) return 'algo'
  if (chain == 416001) return 'algo'
  if (chain == 416002) return 'algo'
  if (chain == 416101) return 'algo'
  if (chain == 416102) return 'algo'
  if (chain == 101003) return 'algo'
  if (chain == NEAR_CHAIN_ID_MAINNET || chain == NEAR_CHAIN_ID_TESTNET) return 'near'
  if (chain < 101000) return 'eth'
  if (chain > 102000) return 'eth'
  if (chain <= 101002) return 'algo'
  return null
}
export default getChainType
