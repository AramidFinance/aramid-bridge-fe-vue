import getBridgeContractAddress from '@/scripts/common/getBridgeContractAddress'
import type { PublicConfigurationRoot } from '../interface/mapping/PublicConfigurationRoot'

export const NEAR_CHAIN_ID_MAINNET = 102002

export const NEAR_CHAIN_ID_TESTNET = 102001
// export const CONTRACT_ADDRESS = 'dev-20230308212313-18978146960082';

export const CONTRACT_ADDRESS = (networkType: string, publicConfiguration: PublicConfigurationRoot) => {
  if (networkType == 'testnet') {
    return getBridgeContractAddress(NEAR_CHAIN_ID_TESTNET, publicConfiguration)
  } else {
    return getBridgeContractAddress(NEAR_CHAIN_ID_MAINNET, publicConfiguration)
  }
}

export const NEAR_CHAIN_ID = (networkType: string) => {
  if (networkType == 'testnet') {
    return NEAR_CHAIN_ID_TESTNET
  } else {
    return NEAR_CHAIN_ID_MAINNET
  }
}

export const NEAR_TESTNET_RPC = 'https://rpc.testnet.near.org'
export const NEAR_MAINNET_RPC = 'https://rpc.mainnet.near.org'

export const NEAR_RPC = (networkType: string | undefined) => {
  if (networkType == 'testnet') {
    return NEAR_TESTNET_RPC
  } else {
    return NEAR_MAINNET_RPC
  }
}

export const NEAR_TESTNET_WALLET = 'https://testnet.mynearwallet.com'
export const NEAR_MAINNET_WALLET = 'https://app.mynearwallet.com'

export const NEAR_WALLET = (networkType: string | undefined) => {
  if (networkType == 'testnet') {
    return NEAR_TESTNET_WALLET
  } else {
    return NEAR_MAINNET_WALLET
  }
}
