import algosdk from 'algosdk'
import { ethers } from 'ethers'
import { useAppStore } from '@/stores/app'
import type { ChainItem } from '../interface/mapping/ChainItem'

const isValidSourceAddress = (): boolean => {
  const store = useAppStore()
  if (!store.state.sourceChainConfiguration) return false
  if (!store.state.sourceAddress) return false
  // checks if source address is valid
  return isValidAddress(store.state.sourceChainConfiguration, store.state.sourceAddress)
}

export const isValidDestinationAddress = (): boolean => {
  const store = useAppStore()
  if (!store.state.destinationChainConfiguration) return false
  if (!store.state.destinationAddress) return false
  // checks if source address is valid
  return isValidAddress(store.state.destinationChainConfiguration, store.state.destinationAddress)
}

export const isValidAddress = (chainConf: ChainItem, address: string) => {
  return (
    (chainConf && chainConf.type == 'algo' && algosdk.isValidAddress(address)) ||
    (chainConf && chainConf.type == 'eth' && ethers.isAddress(address)) ||
    (chainConf && chainConf.type == 'near' && isValidNearAddress(address))

    // near address format has to be check while fixing bugs
  )
}

export function isValidNearAddress(address: string) {
  if (typeof address !== 'string') return false

  // if (address.length < 2 || address.length > 32) return false;
  const pattern = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/
  return pattern.test(address)
}
export default isValidSourceAddress
