import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import getAlgodClientByChainId from './getAlgodClientByChainId'

const getAlgoClient = async (chainId: number): Promise<AlgorandClient> => {
  if (!chainId) throw new Error('Chain ID is not set')
  const algodClient = await getAlgodClientByChainId(chainId)
  if (!algodClient) throw new Error('Algod client not initialized')

  const algoClient = AlgorandClient.fromClients({
    algod: algodClient
  })
  return algoClient
}
export default getAlgoClient
