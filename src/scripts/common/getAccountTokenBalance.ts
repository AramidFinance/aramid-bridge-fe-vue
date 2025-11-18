import BigNumber from 'bignumber.js'
import getAlgoAccountTokenBalance from '../algo/getAlgoAccountTokenBalance'
import getEthAccountTokenBalance from '../eth/getEthAccountTokenBalance'
import getChainType from './getChainTypeAsync'
import moment from 'moment'
import { getNearAccountTokenBalance } from '../near/getNearAccountTokenBalance'
import logger from '@/scripts/common/conditionalLogger'
interface CacheItem {
  time: string
  value: string
}

const getAccountTokenBalance = async (chain: number, account: string, token: string, nearWallet?: any): Promise<BigNumber> => {
  const cacheKey = `${chain}-${account}-${token}`
  try {
    const localCacheStr = localStorage.getItem(cacheKey)
    const localCache: CacheItem = JSON.parse(localCacheStr ?? '')
    logger.debug('fetching balance, to cache value:', localCache, token)
    if (localCache && moment(localCache.time) > moment().subtract(10, 'second') && !isNaN(+localCache.value) && localCache.value) {
      logger.debug('getAccountTokenBalance(chain,account,token)=val', chain, account, token, localCache.value)
      return new BigNumber(localCache.value)
    }
    logger.debug('getChainType(chain)', chain)
    const type = await getChainType(chain)
    logger.debug('getChainType(chain)=type', chain, type)
    let ret: BigNumber | null = null
    logger.debug(`chain:${chain}:${type}`)
    switch (type) {
      case 'eth':
        ret = await getEthAccountTokenBalance(chain, account, token)
        break
      case 'algo':
        ret = await getAlgoAccountTokenBalance(chain, account, +token)
        break
      case 'near':
        ret = await getNearAccountTokenBalance(nearWallet, token, account)
        break
    }
    logger.debug(`fetched balance from chain:${chain}:${type}`, ret?.toString())
    if (!ret && ret != new BigNumber(0)) throw Error('Unable to fetch account balance') // non-zero false value means something went wrong during the API call
    const toCache: CacheItem = { time: moment().toISOString(), value: ret.toFixed(0, 1) }
    logger.debug('toCache', toCache)
    localStorage.setItem(cacheKey, JSON.stringify(toCache))
    return ret
  } catch (e) {
    logger.error('error fetching balance:', e)
    const localCacheStr = localStorage.getItem(cacheKey)
    if (localCacheStr) {
      const localCache: CacheItem = JSON.parse(localCacheStr)
      return new BigNumber(localCache.value)
    }
    return new BigNumber(0)
  }
}
export default getAccountTokenBalance
