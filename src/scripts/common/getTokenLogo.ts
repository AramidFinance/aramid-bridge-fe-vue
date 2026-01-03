import circle from '@assets/circle.png'
import algo from '@assets/logos/tokens/algo.png'
import aalgo from '@assets/logos/tokens/aramid-algo.png'
import aaurora from '@assets/logos/tokens/aramid-aurora.png'
import abtc from '@assets/logos/tokens/aramid-btc.png'
import adao from '@assets/logos/tokens/aramid-dao.png'
import { default as aeth, default as arinkeby } from '@assets/logos/tokens/aramid-eth.png'
import { default as amatic, default as mumbai } from '@assets/logos/tokens/aramid-matic.png'
import ausd from '@assets/logos/tokens/aramid-usd.png'
import ausdc from '@assets/logos/tokens/aramid-usdc.png'
import ausdt from '@assets/logos/tokens/aramid-usdt.png'
import avoi from '@assets/logos/tokens/aramid-voi.png'
import eth from '@assets/logos/tokens/eth.png'
import gold from '@assets/logos/tokens/gold.png'
import polygon from '@assets/logos/tokens/polygon.png'
import usdc from '@assets/logos/tokens/usdc.png'
import usdt from '@assets/logos/tokens/usdt.png'
import voi from '@assets/logos/tokens/voi.png'

const getTokenLogo = (id: string) => {
  switch (id) {
    case 'algo':
      return algo
    case 'aramid-dao':
      return adao
    case 'aramid-algo':
      return aalgo
    case 'aramid-aurora':
      return aaurora
    case 'aramid-btc':
      return abtc
    case 'aramid-eth':
      return aeth
    case 'aramid-matic':
      return amatic
    case 'aramid-rinkeby':
      return arinkeby
    case 'aramid-mumbai':
      return mumbai
    case 'aramid-usdc':
      return ausdc
    case 'aramid-usdt':
      return ausdt
    case 'aramid-usd':
      return ausd
    case 'aramid-voi':
      return avoi
    case 'usdc':
      return usdc
    case 'usdt':
      return usdt
    case 'eth':
      return eth
    case 'polygon':
      return polygon
    case 'voi':
      return voi
    case 'gold':
      return gold
    default:
      return circle
  }
}
export default getTokenLogo
