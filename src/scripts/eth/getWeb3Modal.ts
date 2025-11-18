import { useAppStore } from '@/stores/app'
import { useConfigStore } from '@/stores/config'
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/vue'
import type { ChainItem } from '../interface/mapping/ChainItem'
import { type Chain, type EthersStoreUtilState } from '@web3modal/scaffold-utils/ethers'
import { AppKit } from '@web3modal/base'

// IMPORTANT!!!!!!
// make sure only 1 instance of web3Modal is ever created,
// otherwise it will result in a bug where the modal does not disappear after connecting to wallet

let web3Modal: AppKit<EthersStoreUtilState, number> | null = null
import config from '@/env/secure.json'
import type { EthPrivateConfiguration } from '../interface/eth/EthPrivateConfiguration'
import logger from '@/scripts/common/conditionalLogger'

const getWeb3Modal = (): AppKit<EthersStoreUtilState, number> | null => {
  if (web3Modal !== null) return web3Modal

  const configStore = useConfigStore()
  const store = useAppStore()

  if (!store.state.publicConfiguration?.chains) {
    logger.debug('!store.state.publicConfiguration?.chains')
    return null
  }

  const chains = Object.values(store.state.publicConfiguration.chains)
    .filter((c) => c.type == 'eth')
    .map((c: ChainItem) => {
      return {
        chainId: c.chainId,
        name: c.name,
        currency: c.name,
        rpcUrl: (config.chains[c.chainId] as EthPrivateConfiguration).providerUrl,
        explorerUrl: c.blockExplorers[0]
      } as Chain
    })

  // 3. Create your application's metadata object
  const metadata = {
    name: 'Aramid Finance',
    description: 'Aramid Bridge',
    url: 'https://' + location.host, // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  }

  // 4. Create Ethers config
  const ethersConfig = defaultConfig({
    /*Required*/
    metadata
  })

  // 5. Create a Web3Modal instance
  const modal = createWeb3Modal({
    ethersConfig,
    chains: chains,
    projectId: configStore.state.wcProjectId,
    enableAnalytics: true, // Optional - defaults to your Cloud configuration
    enableOnramp: true
  })
  logger.debug('chains', chains)
  web3Modal = modal
  return modal
}

export default getWeb3Modal
