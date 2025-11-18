import { useAppStore } from '@/stores/app'
import { isValidAddress } from './isValidSourceAddress'
import logger from '@/scripts/common/conditionalLogger'

const isValidDestAddress = (toValidate?: string): boolean => {
  const store = useAppStore()
  const toCheck = toValidate ? toValidate : store.state.destinationAddress
  // address is address to be checked for the destination address purpose
  logger.debug('isValidDestAddress.1', store.state.destinationChainConfiguration, toCheck)
  if (!store.state.destinationChainConfiguration) return false
  if (!toCheck) return false

  return isValidAddress(store.state.destinationChainConfiguration, toCheck)
}

export default isValidDestAddress
