<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import logger from "@/scripts/common/conditionalLogger"
import AssetButton from '../ui/AssetButton.vue'
import getPublicConfiguration from '@/scripts/common/getPublicConfiguration'
import { onMounted, reactive, watch, computed, ref } from 'vue'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { TokenItem } from '@/scripts/interface/mapping/TokenItem'
import { fillSourceTokenConfiguration } from '@/scripts/events/fillSourceTokenConfiguration'
import { resetDestinationTokenIfNotMatched } from '@/scripts/events/resetDestinationTokenIfNotMatched'
import { fillDestinationTokenConfiguration } from '@/scripts/events/fillDestinationTokenConfiguration'
import DialogTitle from '../ui/DialogTitle.vue'
import { fillRouteInfo } from '@/scripts/events/fillRouteInfo'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { sanitizeSearchQuery } from '@/utils/sanitize'

const store = useAppStore()
const searchQuery = ref('')
const dialogRef = ref<HTMLElement | null>(null)
const isOpen = computed(() => store.state.dialogSelectSourceAssetIsOpen)

useFocusTrap(dialogRef, isOpen)

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

  // Sanitize search query to prevent XSS attacks
  const sanitizedQuery = sanitizeSearchQuery(searchQuery.value)
  const query = sanitizedQuery.toLowerCase().trim()
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
  logger.debug('sourceChain', store.state.sourceChain)
  logger.debug('destinationChain', store.state.destinationChain)
  logger.debug('assets', state.assets)
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
    <div
      ref="dialogRef"
      class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col z-[101] max-h-[80vh] w-[90vw] max-w-[600px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-source-asset-title"
      @keydown.esc="store.state.dialogSelectSourceAssetIsOpen = false"
    >
      <div class="bg-gradient-brand drop-shadow-menu-default rounded-2xl p-3 flex flex-col h-full">
        <DialogTitle id="select-source-asset-title"> Select asset which you want to bridge to other chain </DialogTitle>

        <!-- Search Bar -->
        <div class="mb-4">
          <label for="source-asset-search" class="sr-only">Search tokens by name, symbol, or address</label>
          <input
            id="source-asset-search"
            v-model="searchQuery"
            type="text"
            placeholder="Search tokens by name, symbol, or address..."
            class="w-full px-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
          />
        </div>

        <div v-if="!state.assets?.length" class="text-white text-center py-4">No assets available</div>

        <!-- Scrollable content area -->
        <div v-else class="flex-1 overflow-y-auto space-y-3">
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
                  @error="logger.debug('Failed to load image for:', item.name)"
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
                  @error="logger.debug('Failed to load image for:', item.name)"
                />
              </template>
            </div>
          </div>

          <!-- No results message -->
          <div v-if="searchQuery.trim() && filteredAssets.length === 0" class="text-white/60 text-center py-8" role="status" aria-live="polite">
            <span class="sr-only">{{ filteredAssets.length }} results found</span>
            <div class="text-lg mb-2">🔍</div>
            <div>No tokens found matching "{{ searchQuery }}"</div>
            <div class="text-sm mt-1">Try searching by name, symbol, or token address</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
