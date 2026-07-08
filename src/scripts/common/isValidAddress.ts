import { useAppStore } from '@/stores/app'
import algosdk from 'algosdk'
import { ethers } from 'ethers'

export const isValidAddress = (address: string): boolean => {
  const state = useAppStore()
  if (!state.state.sourceChainConfiguration) return false
  return (state.state.sourceChainConfiguration.type === 'algo' && algosdk.isValidAddress(address)) || (state.state.sourceChainConfiguration.type === 'eth' && ethers.isAddress(address))
}
