import BigNumber from 'bignumber.js'
import Web3, { type ContractAbi } from 'web3'
import getSecureConfiguration from '../common/getSecureConfiguration'
import type { EthPrivateConfiguration } from '../interface/eth/EthPrivateConfiguration'
import erc20abi from './erc20abi'
import logger from '../common/conditionalLogger'
import { balanceLimiter } from '@/utils/rateLimit'

const getEthAccountTokenBalance = async (chainId: number, walletAddress: string, tokenAddress: string): Promise<BigNumber | null> => {
  // Apply rate limiting to prevent RPC abuse
  await balanceLimiter.throttle()

  const secureConfiguration = await getSecureConfiguration()

  if (!secureConfiguration || !secureConfiguration.chains || !secureConfiguration.chains[chainId]) return null
  const config = secureConfiguration.chains[chainId] as EthPrivateConfiguration
  if (!config || config.type !== 'eth') {
    logger.error('wrong configuration', config)
    return null
  }

  logger.debug('fetching balance on eth of', tokenAddress, 'for', walletAddress, 'on chain', chainId)

  // Collect all available RPC URLs
  const rpcUrls: string[] = [config.providerUrl]
  if (config.providerUrl2) rpcUrls.push(config.providerUrl2)
  if (config.providerUrl3) rpcUrls.push(config.providerUrl3)

  let balance: string | null = null

  if (/^0x([0-1]{40})$/.test(tokenAddress)) {
    // Native token - try all RPCs in parallel (Task 4.4)
    const balancePromises = rpcUrls.map(async (url) => {
      try {
        const web3Instance = new Web3(url)
        const bal = await web3Instance.eth.getBalance(walletAddress)
        return { success: true, balance: bal.toString(), url }
      } catch (error) {
        logger.debug(`Failed to fetch native token balance from ${url}:`, error)
        return { success: false, balance: null, url, error }
      }
    })

    const results = await Promise.allSettled(balancePromises)

    // Find first successful result
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        balance = result.value.balance
        logger.debug(`Successfully fetched native token balance from ${result.value.url}`)
        break
      }
    }

    if (!balance) {
      logger.error('All RPC endpoints failed for native token balance')
      return null
    }
  } else {
    // ERC20 token - try all RPCs in parallel (Task 4.4)
    logger.debug('Fetching ERC20 token balance', tokenAddress)
    const abi: ContractAbi = JSON.parse(JSON.stringify(erc20abi))

    const balancePromises = rpcUrls.map(async (url) => {
      try {
        const web3Instance = new Web3(url)
        const contract = new web3Instance.eth.Contract(abi, tokenAddress)
        const bal = await contract.methods.balanceOf(walletAddress).call()
        return { success: true, balance: String(bal), url }
      } catch (error) {
        logger.debug(`Failed to fetch ERC20 balance from ${url}:`, error)
        return { success: false, balance: null, url, error }
      }
    })

    const results = await Promise.allSettled(balancePromises)

    // Find first successful result
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success && result.value.balance) {
        balance = result.value.balance
        logger.debug(`Successfully fetched ERC20 balance from ${result.value.url}`)
        break
      }
    }

    if (!balance) {
      logger.error('All RPC endpoints failed for ERC20 token balance')
      return null
    }
  }

  logger.debug('eth.balance', balance)
  return new BigNumber(balance ?? '0')
}

export default getEthAccountTokenBalance
