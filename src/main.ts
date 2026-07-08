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

// Guards against a corrupted persisted WalletConnect session (leftover from a stale/mismatched
// domain registration) crashing the whole app during provider init. Reload once to force a
// clean re-init instead of leaving the page in a broken state.
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason instanceof Error ? event.reason.message : String(event.reason)
  if (message.includes("Cannot read properties of undefined (reading 'filter')") && !sessionStorage.getItem('wc-session-recovery')) {
    sessionStorage.setItem('wc-session-recovery', '1')
    Object.keys(localStorage)
      .filter((key) => key.startsWith('wc@') || key.toLowerCase().includes('walletconnect'))
      .forEach((key) => localStorage.removeItem(key))
    indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB')
    location.reload()
  }
})

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
  .voimain({
    algod: {
      baseServer: 'https://mainnet-api.voi.nodely.dev',
      port: '443',
      token: ''
    }
  })
  .aramidmain({
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
    WalletId.LUTE,
    WalletId.KIBISIS,
    {
      id: WalletId.BIATEC,
      options: {
        projectId: '54958e07dbb79eedf5cd5564bf16d817',
        metadata: {
          name: 'Aramid Finance Dapp',
          description: 'Aramid Finance Bridge between Algorand, Voi, Near, Ethereum, Polygon and Aurora',
          url: 'https://' + location.host,
          icons: ['https://' + location.host + '/aramid-logo.svg']
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
          url: 'https://' + location.host,
          icons: ['https://' + location.host + '/aramid-logo.svg']
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
    AVMWalletId.LUTE,
    AVMWalletId.EXODUS,
    AVMWalletId.KIBISIS,
    {
      id: AVMWalletId.BIATEC,
      options: {
        projectId: '54958e07dbb79eedf5cd5564bf16d817',
        metadata: {
          name: 'Aramid Finance Dapp',
          description: 'Aramid Finance Bridge between Algorand, Voi, Near, Ethereum, Polygon and Aurora',
          url: 'https://' + location.host,
          icons: ['https://' + location.host + '/aramid-logo.svg']
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
          url: 'https://' + location.host,
          icons: ['https://' + location.host + '/aramid-logo.svg']
        }
      }
    }
  ],
  defaultNetwork: NetworkId.MAINNET,
  networks
})

app.mount('#app')
