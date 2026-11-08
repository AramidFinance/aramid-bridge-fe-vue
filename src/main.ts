import { lute } from '@galaxypay/use-wallet-lute'
import { pera } from '@perawallet/use-wallet-pera'
import { defly } from '@txnlab/use-wallet-defly'
import { exodus } from '@txnlab/use-wallet-exodus'
import { kibisis } from '@txnlab/use-wallet-kibisis'
import { NetworkConfigBuilder, NetworkId, WalletManagerPlugin } from '@txnlab/use-wallet-vue'
import { walletConnect } from '@txnlab/use-wallet-walletconnect'
import { WalletId as AVMWalletId, WalletManagerPlugin as AVMWalletManagerPlugin, NetworkConfigBuilder as AVMNetworkConfigBuilder } from 'avm-wallet-vue'
import { BIATEC_EXTRA_NETWORKS, biatec } from 'biatec-wallet-use-wallet-client'
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

const walletConnectProjectId = '54958e07dbb79eedf5cd5564bf16d817'
const dappMetadata = {
  name: 'Aramid Finance Dapp',
  description: 'Aramid Finance Bridge between Algorand, Voi, Base and Arbitrum',
  url: 'https://' + location.host,
  icons: ['https://' + location.host + '/aramid-logo.svg']
}

const algodMainnet = { baseServer: 'https://mainnet-api.4160.nodely.dev', port: '443', token: '' }
const algodVoimain = { baseServer: 'https://mainnet-api.voi.nodely.dev', port: '443', token: '' }
const algodAramidmain = { baseServer: 'https://aramidmain-algod-public.de.nodes.biatec.io', port: '443', token: '' }

// Source wallet: @txnlab/use-wallet v5. Voi and Aramid are not built in, so their genesis/CAIP
// data comes from the Biatec client; only the algod endpoint is overridden.
const networks = new NetworkConfigBuilder()
  .mainnet({ algod: algodMainnet })
  .addNetwork('voimain', { ...BIATEC_EXTRA_NETWORKS.voimain, algod: algodVoimain })
  .addNetwork('aramidmain', { ...BIATEC_EXTRA_NETWORKS.aramidmain, algod: algodAramidmain })
  .build()

app.use(WalletManagerPlugin, {
  wallets: [
    defly(),
    pera(),
    exodus(),
    lute(),
    kibisis(),
    biatec({
      projectId: walletConnectProjectId,
      metadata: dappMetadata
    }),
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: dappMetadata
    })
  ],
  defaultNetwork: NetworkId.MAINNET,
  networks
})

// Destination wallet: avm-wallet-vue (separate manager with its own injection keys).
const avmNetworks = new AVMNetworkConfigBuilder().mainnet({ algod: algodMainnet }).voimain({ algod: algodVoimain }).aramidmain({ algod: algodAramidmain }).build()

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
        projectId: walletConnectProjectId,
        metadata: dappMetadata
      }
    },
    {
      id: AVMWalletId.WALLETCONNECT,
      options: {
        projectId: walletConnectProjectId,
        metadata: dappMetadata
      }
    }
  ],
  defaultNetwork: NetworkId.MAINNET,
  networks: avmNetworks
})

app.mount('#app')
