<script setup lang="ts">
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { fillDestinationTokenConfiguration } from '@/scripts/events/fillDestinationTokenConfiguration'
import { fillRouteInfo } from '@/scripts/events/fillRouteInfo'
import { fillSourceTokenConfiguration } from '@/scripts/events/fillSourceTokenConfiguration'
import { resetDestinationTokenIfNotMatched } from '@/scripts/events/resetDestinationTokenIfNotMatched'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { TokenItem } from '@/scripts/interface/mapping/TokenItem'
import { useAppStore } from '@/stores/app'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AssetButton from '../ui/AssetButton.vue'
import DialogTitle from '../ui/DialogTitle.vue'

const store = useAppStore()
const searchQuery = ref('')

const assetButtonClick = (tokenId: string) => {
  fillSourceTokenConfiguration(tokenId)

  resetDestinationTokenIfNotMatched()
  if (!store.state.destinationToken) {
    fillDestinationTokenConfiguration()
  }
  fillRouteInfo()
  store.state.dialogSelectSourceAssetIsOpen = false
}

interface IState {
  publicConfiguration: PublicConfigurationRoot | null
  assets: TokenItem[] | null
}
const state: IState = reactive({
  publicConfiguration: null,
  assets: null
})

// Popular tokens that should appear at the top
const popularTokenSymbols = ['USDC', 'ETH', 'BTC', 'ALGO', 'VOI', 'WBTC', 'cbBTC']

// Special tokens that should be ignored
// TODO: migrate to public configuration
const specialTokens = ['UNIT Classic']
const CHAIN_ID_VOI = 416101

// Computed property for filtered tokens based on search
const filteredAssets = computed(() => {
  if (!state.assets) return []
  if (!searchQuery.value.trim()) return state.assets

  const query = searchQuery.value.toLowerCase().trim()
  return state.assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(query) ||
      asset.symbol.toLowerCase().includes(query) ||
      asset.tokenId.toLowerCase().includes(query) ||
      asset.arc200TokenId?.toString().toLowerCase().includes(query)
  )
})

// Computed property for popular tokens
const popularAssets = computed(() => {
  if (!state.assets) return []
  return state.assets
    .filter((asset) => popularTokenSymbols.includes(asset.symbol))
    .sort((a, b) => {
      const aIndex = popularTokenSymbols.indexOf(a.symbol)
      const bIndex = popularTokenSymbols.indexOf(b.symbol)
      return aIndex - bIndex
    })
})

// Computed property for other tokens (excluding popular ones)
const otherAssets = computed(() => {
  if (!filteredAssets.value) return []
  const popularTokenIds = popularAssets.value.map((asset) => asset.tokenId)
  return filteredAssets.value.filter((asset) => !popularTokenIds.includes(asset.tokenId))
})
const fillInState = () => {
  if (!state.publicConfiguration) return
  if (!store.state.sourceChain) return
  if (!store.state.destinationChain) return

  // if there is a route between source and destination chain, filter the assets to only include the allowed routes
  if (
    state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()] &&
    state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()]
  ) {
    // voi source chain specific override
    if (store.state.sourceChain === CHAIN_ID_VOI) {
      state.assets = Object.values(state.publicConfiguration.chains[store.state.sourceChain.toString()].tokens).filter((asset) => !specialTokens.includes(asset.name))
    }
    // default behavior config driven
    else {
      const allowedRoutes = Object.keys(state.publicConfiguration.chains2tokens[store.state.sourceChain.toString()][store.state.destinationChain.toString()])
      state.assets = Object.values(state.publicConfiguration.chains[store.state.sourceChain.toString()].tokens).filter((c) => allowedRoutes.includes(c.tokenId))
    }
  }
  // if there is no route between source and destination chain, show all assets
  else {
    // voi source chain specific override
    if (store.state.sourceChain === CHAIN_ID_VOI) {
      state.assets = Object.values(state.publicConfiguration.chains[store.state.sourceChain.toString()].tokens).filter((asset) => !specialTokens.includes(asset.name))
    }
    // default behavior config driven
    else {
      state.assets = Object.values(state.publicConfiguration.chains[store.state.sourceChain.toString()].tokens)
    }
  }
  console.log('sourceChain', store.state.sourceChain)
  console.log('destinationChain', store.state.destinationChain)
  console.log('assets', state.assets)
}
onMounted(async () => {
  state.publicConfiguration = await getPublicConfiguration(false)
  fillInState()
})
watch(
  () => store.state.sourceChainConfiguration,
  () => {
    fillInState()
  }
)

watch(
  () => store.state.destinationChain,
  () => {
    fillInState()
  }
)

watch(
  () => store.state.destinationChainConfiguration,
  () => {
    fillInState()
  }
)
</script>
<template>
  <div :class="store.state.dialogSelectSourceAssetIsOpen ? '' : 'hidden'">
    <div class="full-screen backdrop-blur-sm z-[100]" @click="store.state.dialogSelectSourceAssetIsOpen = false"></div>
    <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col z-[101] max-h-[80vh] w-[90vw] max-w-[600px]">
      <div class="bg-gradient-to-r from-topleft-purple to-bottomright-purple drop-shadow-menu-default rounded-[26px] p-3 flex flex-col h-full">
        <DialogTitle> Select asset which you want to bridge to other chain </DialogTitle>

        <!-- Search Bar -->
        <div class="mb-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tokens by name, symbol, or address..."
            class="w-full px-4 py-2 rounded-[16px] bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
          />
        </div>

        <div v-if="!state.assets?.length" class="text-white text-center py-4">No assets available</div>

        <!-- Scrollable content area -->
        <div v-else class="flex-1 overflow-y-auto space-y-3 max-h-[60vh]">
          <!-- Popular Tokens Section -->
          <div v-if="!searchQuery.trim() && popularAssets.length > 0">
            <h3 class="text-white/80 text-sm font-medium mb-2 px-2">Popular Tokens</h3>
            <div class="space-y-1">
              <template v-for="(item, index) in popularAssets" :key="'popular-' + index">
                <AssetButton
                  :img="item.logo"
                  :text="item.name"
                  :id="item?.arc200TokenId?.toString() || item.tokenId"
                  @click="assetButtonClick(item.tokenId)"
                  @error="console.log('Failed to load image for:', item.name)"
                />
              </template>
            </div>
          </div>

          <!-- Other Tokens Section -->
          <div v-if="otherAssets.length > 0">
            <h3 v-if="!searchQuery.trim() && popularAssets.length > 0" class="text-white/80 text-sm font-medium mb-2 px-2 mt-4">All Tokens</h3>
            <div class="space-y-1">
              <template v-for="(item, index) in otherAssets" :key="'other-' + index">
                <AssetButton
                  :img="item.logo"
                  :text="item.name"
                  :id="item?.arc200TokenId?.toString() || item.tokenId"
                  @click="assetButtonClick(item.tokenId)"
                  @error="console.log('Failed to load image for:', item.name)"
                />
              </template>
            </div>
          </div>

          <!-- No results message -->
          <div v-if="searchQuery.trim() && filteredAssets.length === 0" class="text-white/60 text-center py-8">
            <div class="text-lg mb-2">🔍</div>
            <div>No tokens found matching "{{ searchQuery }}"</div>
            <div class="text-sm mt-1">Try searching by name, symbol, or token address</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
