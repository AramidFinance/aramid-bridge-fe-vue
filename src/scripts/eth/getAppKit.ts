import { useAppStore } from '@/stores/app'
import { useConfigStore } from '@/stores/config'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { createAppKit, type AppKit } from '@reown/appkit/vue'
import { defineChain, type AppKitNetwork } from '@reown/appkit/networks'
import type { ChainItem } from '../interface/mapping/ChainItem'

// IMPORTANT!!!!!!
// make sure only 1 instance of appKit is ever created,
// otherwise it will result in a bug where the modal does not disappear after connecting to wallet

let appKit: AppKit | null = null
let appKitNetworks: AppKitNetwork[] = []
import config from '@/env/secure.json'
import type { EthPrivateConfiguration } from '../interface/eth/EthPrivateConfiguration'

// switchNetwork() from useAppKitNetwork()/AppKit requires the full AppKitNetwork object, not a chain id
export const getAppKitNetworkByChainId = (chainId: number): AppKitNetwork | undefined => {
  return appKitNetworks.find((network) => network.id === chainId)
}

const getAppKit = (): AppKit | null => {
  if (appKit !== null) return appKit

  const configStore = useConfigStore()
  const store = useAppStore()

  if (!store.state.publicConfiguration?.chains) {
    console.log('!store.state.publicConfiguration?.chains')
    return null
  }

  const networks: AppKitNetwork[] = Object.values(store.state.publicConfiguration.chains)
    .filter((c) => c.type == 'eth')
    .map((c: ChainItem) =>
      defineChain({
        id: c.chainId,
        caipNetworkId: `eip155:${c.chainId}`,
        chainNamespace: 'eip155',
        name: c.name,
        nativeCurrency: { name: c.name, symbol: c.name, decimals: 18 },
        rpcUrls: { default: { http: [(config.chains[c.chainId] as EthPrivateConfiguration).providerUrl] } },
        blockExplorers: { default: { name: c.name, url: c.blockExplorers[0] } }
      })
    )

  if (!networks.length) return null
  appKitNetworks = networks
  const [firstNetwork, ...restNetworks] = networks

  // Create your application's metadata object
  const metadata = {
    name: 'Aramid Finance',
    description: 'Aramid Bridge',
    url: 'https://' + location.host, // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  }

  // Create an AppKit instance
  const kit = createAppKit({
    adapters: [new EthersAdapter()],
    networks: [firstNetwork, ...restNetworks],
    metadata,
    projectId: configStore.state.wcProjectId,
    features: {
      analytics: true, // Optional - defaults to your Cloud configuration
      onramp: true
    }
  })
  console.log('networks', networks)
  appKit = kit
  return kit
}

export default getAppKit
