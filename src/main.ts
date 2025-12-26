import { NetworkId, WalletId, WalletManagerPlugin } from '@txnlab/use-wallet-vue'
import { WalletId as AVMWalletId, WalletManagerPlugin as AVMWalletManagerPlugin, NetworkConfigBuilder } from 'avm-wallet-vue'
import './assets/main.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import PrimeVue from 'primevue/config'
import App from './App.vue'
import i18n from './i18n'
import router from './router'

import Aura from '@/presets/lara' //import preset
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import './assets/base.css'
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

app.use(PrimeVue, {
  unstyled: true,
  pt: Aura
})
app.directive('tooltip', Tooltip)
app.use(ToastService)

// Customize Algorand networks
const networks = new NetworkConfigBuilder()
  .mainnet({
    algod: {
      baseServer: 'https://mainnet-api.4160.nodely.dev',
      port: '443',
      token: ''
    }
  })
  .addNetwork('voimain', {
    algod: {
      baseServer: 'https://mainnet-api.voi.nodely.dev',
      port: '443',
      token: ''
    }
  })
  .addNetwork('aramidmain', {
    algod: {
      baseServer: 'https://aramidmain-algod-public.de.nodes.biatec.io',
      port: '443',
      token: ''
    }
  })
  .build()

// Install the plugin
app.use(WalletManagerPlugin, {
  wallets: [
    WalletId.DEFLY,
    WalletId.PERA,
    WalletId.EXODUS,
    WalletId.KIBISIS,
    {
      id: WalletId.BIATEC,
      options: {
        projectId: '54958e07dbb79eedf5cd5564bf16d817',
        metadata: {
          name: 'Aramid Finance Dapp',
          description: 'Aramid Finance Bridge between Algorand, Voi, Near, Ethereum, Polygon and Aurora',
          url: 'https://aramid.finance',
          icons: ['https://beta.k8s.aramid.finance/aramid-logo.svg']
        }
      }
    },
    {
      id: WalletId.WALLETCONNECT,
      options: {
        projectId: '54958e07dbb79eedf5cd5564bf16d817',
        metadata: {
          name: 'Aramid Finance Dapp',
          description: 'Aramid Finance Bridge between Algorand, Voi, Near, Ethereum, Polygon and Aurora',
          url: 'https://aramid.finance',
          icons: ['https://beta.k8s.aramid.finance/aramid-logo.svg']
        }
      }
    }
  ],

  defaultNetwork: NetworkId.MAINNET,
  networks
})
// Install the plugin
app.use(AVMWalletManagerPlugin, {
  wallets: [
    AVMWalletId.DEFLY,
    AVMWalletId.PERA,
    AVMWalletId.EXODUS,
    AVMWalletId.KIBISIS,
    {
      id: AVMWalletId.BIATEC,
      options: {
        projectId: '54958e07dbb79eedf5cd5564bf16d817',
        metadata: {
          name: 'Aramid Finance Dapp',
          description: 'Aramid Finance Bridge between Algorand, Voi, Near, Ethereum, Polygon and Aurora',
          url: 'https://aramid.finance',
          icons: ['https://beta.k8s.aramid.finance/aramid-logo.svg']
        }
      }
    },
    {
      id: AVMWalletId.WALLETCONNECT,
      options: {
        projectId: '54958e07dbb79eedf5cd5564bf16d817',
        metadata: {
          name: 'Aramid Finance Dapp',
          description: 'Aramid Finance Bridge between Algorand, Voi, Near, Ethereum, Polygon and Aurora',
          url: 'https://aramid.finance',
          icons: ['https://beta.k8s.aramid.finance/aramid-logo.svg']
        }
      }
    }
  ],
  defaultNetwork: NetworkId.MAINNET,
  networks
})

app.mount('#app')
