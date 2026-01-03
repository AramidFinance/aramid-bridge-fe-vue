import BigNumber from 'bignumber.js'
import moment from 'moment'
import getAlgoAccountTokenBalance from '../algo/getAlgoAccountTokenBalance'
import getEthAccountTokenBalance from '../eth/getEthAccountTokenBalance'
import { getNearAccountTokenBalance } from '../near/getNearAccountTokenBalance'
import getChainType from './getChainTypeAsync'
interface CacheItem {
  time: string
  value: string
}

const getAccountTokenBalance = async (chain: number, account: string, token: string, nearWallet?: any): Promise<BigNumber> => {
  const cacheKey = `${chain}-${account}-${token}`
  try {
    const localCacheStr = localStorage.getItem(cacheKey)
    const localCache: CacheItem = JSON.parse(localCacheStr ?? '')
    console.log('fetching balance, to cache value:', localCache, token)
    if (localCache && moment(localCache.time) > moment().subtract(10, 'second') && !isNaN(+localCache.value) && localCache.value) {
      console.log('getAccountTokenBalance(chain,account,token)=val', chain, account, token, localCache.value)
      return new BigNumber(localCache.value)
    }
    console.log('getChainType(chain)', chain)
    const type = await getChainType(chain)
    console.log('getChainType(chain)=type', chain, type)
    let ret: BigNumber | null = null
    console.log(`chain:${chain}:${type}`)
    switch (type) {
      case 'eth':
        ret = await getEthAccountTokenBalance(chain, account, token)
        break
      case 'algo': {
        const algoBalance = await getAlgoAccountTokenBalance(chain, account, BigInt(token))
        ret = new BigNumber(algoBalance?.toString() ?? '0')
        break
      }
      case 'near':
        ret = await getNearAccountTokenBalance(nearWallet, token, account)
        break
    }
    console.log(`fetched balance from chain:${chain}:${type}`, ret?.toString())
    if (!ret && ret != new BigNumber(0)) throw Error('Unable to fetch account balance') // non-zero false value means something went wrong during the API call
    const toCache: CacheItem = { time: moment().toISOString(), value: ret.toFixed(0, 1) }
    console.log('toCache', toCache)
    localStorage.setItem(cacheKey, JSON.stringify(toCache))
    return ret
  } catch (e) {
    console.error('error fetching balance:', e)
    const localCacheStr = localStorage.getItem(cacheKey)
    if (localCacheStr) {
      const localCache: CacheItem = JSON.parse(localCacheStr)
      return new BigNumber(localCache.value)
    }
    return new BigNumber(0)
  }
}
export default getAccountTokenBalance
