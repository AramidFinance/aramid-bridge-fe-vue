import { useAppStore } from '@/stores/app'
import { executeWithAlgodFailover } from '../algo/getAlgodClientByChainIdWithFailover'
import logger from '@/scripts/common/conditionalLogger'

export const fillDestinationChainGenesis = async () => {
  const store = useAppStore()
  if (!store.state.destinationChainGenesis) {
    if (store.state.destinationChainConfiguration?.type == 'algo') {
      try {
        const params = await executeWithAlgodFailover(
          store.state.destinationChainConfiguration.chainId,
          async (algod) => {
            return await algod.getTransactionParams().do()
          },
          'fillDestinationChainGenesis getTransactionParams'
        )
        store.state.destinationChainGenesis = params?.genesisID
      } catch (error) {
        logger.error('Failed to get destination chain genesis:', error)
      }
    }
  }
}
