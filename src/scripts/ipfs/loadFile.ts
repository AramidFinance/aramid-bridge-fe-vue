import axios from 'axios'
import logger from '@/scripts/common/conditionalLogger'

export const loadIPFSFile = async (hash: string) => {
  const ipfsGateways = ['hardbin.com', 'nftstorage.link', 'w3s.link', 'dweb.link', 'gateway.ipfs.io', 'ipfs.io', 'cloudflare-ipfs.com']
  const requests: any[] = []
  const useNull = (err: any): null => {
    logger.debug('this didnt fetch:', err)
    return null
  }
  let ipfsData
  for (let i = 0; i < ipfsGateways.length; i++) {
    // try every gateway, ive had some gateways be down so this should handle that.
    // can also always add more gateways
    // also thinking of adding a time limit instead of the 504 limit because that's a long time and if it takes longer than a second or two its probably not gonna connect
    requests.push(axios.get(`https://${ipfsGateways[i]}/ipfs/${hash}`).catch((err) => useNull(err)))
    try {
      logger.debug('fetching from', ipfsGateways[i])
      ipfsData = await axios.get(`https://${ipfsGateways[i]}/ipfs/${hash}`)

      if (ipfsData.status !== 200) {
        logger.debug('response.request.res.responseUrl', ipfsData.request.res.responseUrl)
        throw new Error(`Status is ${ipfsData.status}`)
      }
      break
    } catch (e) {
      logger.debug(e)
    }
  }
  return ipfsData?.data
  // return requests[0];
}

export default loadIPFSFile
