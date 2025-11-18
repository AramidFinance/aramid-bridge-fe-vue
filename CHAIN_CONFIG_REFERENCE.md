# Chain Configuration & Implementation Reference

## ABSOLUTE FILE PATHS - KEY LOCATIONS

### Configuration Files
- `/home/user/aramid-bridge-fe-vue/public/public-configuration.json` - Public chain and token configuration
- `/home/user/aramid-bridge-fe-vue/src/env/public-configuration.ipfs.json` - IPFS backup configuration
- `/home/user/aramid-bridge-fe-vue/src/env/secure.json.ts` - Private RPC and security keys

### Chain Type Definitions
- `/home/user/aramid-bridge-fe-vue/src/scripts/interface/mapping/ChainTypeEnum.ts` - Type definition
- `/home/user/aramid-bridge-fe-vue/src/scripts/interface/mapping/ChainItem.ts` - Chain item structure
- `/home/user/aramid-bridge-fe-vue/src/scripts/interface/mapping/PublicConfigurationRoot.ts` - Root config type

### Chain Detection & Routing
- `/home/user/aramid-bridge-fe-vue/src/scripts/common/chainId2Type.ts` - Async chain type detection
- `/home/user/aramid-bridge-fe-vue/src/scripts/common/getChainType.ts` - Sync chain type detection
- `/home/user/aramid-bridge-fe-vue/src/scripts/common/getChains.ts` - Get all chains
- `/home/user/aramid-bridge-fe-vue/src/scripts/eth/getEthChains.ts` - Get EVM chains only
- `/home/user/aramid-bridge-fe-vue/src/scripts/algo/getAlgoChains.ts` - Get AVM chains only

### Configuration Loading
- `/home/user/aramid-bridge-fe-vue/src/scripts/common/getPublicConfiguration.ts` - Main config loader
- `/home/user/aramid-bridge-fe-vue/src/scripts/common/getChainConfiguration.ts` - Get specific chain config
- `/home/user/aramid-bridge-fe-vue/src/scripts/common/getChainConfigurationSync.ts` - Sync version

### State Management
- `/home/user/aramid-bridge-fe-vue/src/stores/app.ts` - Main Pinia store

---

## WALLET CONNECTION IMPLEMENTATION PATHS

### EVM/ETH Wallet Configuration
- `/home/user/aramid-bridge-fe-vue/src/scripts/eth/getWeb3Modal.ts` - Web3Modal setup (lines 1-67)
  - Filters ETH chains: `filter((c) => c.type == 'eth')`
  - Singleton pattern for modal instance
  - RPC URL configuration from secure.json

### AVM/ALGO Wallet Configuration
- `/home/user/aramid-bridge-fe-vue/src/scripts/algo/isWalletForChain.ts` - Wallet compatibility matrix
  - Chain 416001 (Algorand): pera, defly, exodus, biatec, wc, walletconnect
  - Chain 416101 (Voi): walletconnect, biatec, kibisis
  - Chain 101003 (AramidChain): walletconnect, biatec

### Wallet Components
- `/home/user/aramid-bridge-fe-vue/src/components/WalletSource.vue` - Source wallet connection
  - Lines 128-172: ALGO wallet setup, network mapping
  - Lines 218-280: ETH wallet setup with Web3Modal
  - Lines 190-281: buttonClick handler for connect/disconnect

- `/home/user/aramid-bridge-fe-vue/src/components/WalletDestination.vue` - Destination wallet
  - Lines 44-46: Auto-detect ALGO wallet on mount
  - Lines 58-107: buttonClick handler with chain-type logic
  - Lines 63-105: Different logic for cross-chain scenarios

- `/home/user/aramid-bridge-fe-vue/src/components/dialogs/SelectSourceWalletAlgoDialog.vue` - ALGO wallet selection
  - Lines 78-83: Filter wallets by chain compatibility
  - Lines 32-48: QR code option for manual address entry
  - Lines 159-172: Network ID mapping per chain

---

## TRANSACTION SUBMISSION PATHS

### EVM Transaction Execution
- `/home/user/aramid-bridge-fe-vue/src/scripts/eth/executeEthApproveTx.ts` - Token approval
  - Lines 7-27: Main execution function
  - Uses ERC20Abi for contract interaction
  - Returns transaction with hash and wait() method

- `/home/user/aramid-bridge-fe-vue/src/scripts/eth/executeEthLockTokensTx.ts` - Lock tokens
  - Lines 10-50: Main bridge transaction
  - Parameters: tokenForFee, feeAmount, tokenToBridge, amountToBridge, destinationChainData, memo
  - Uses bridge contract ABI from chainId2Bridge()

- `/home/user/aramid-bridge-fe-vue/src/scripts/eth/executeEthLockNativeTx.ts` - Lock native tokens
- `/home/user/aramid-bridge-fe-vue/src/scripts/eth/executeEthRedeemTx.ts` - Claim on destination

### AVM Transaction Execution
- `/home/user/aramid-bridge-fe-vue/src/components/SignPage.vue` - Algo transaction signing
  - Lines 1-30: ABIs for different contract types (ARC200, SAW200)
  - Uses checkSourceAlgoTx() and checkDestinationAlgoTx()
  - Supports both live and QR signing

### NEAR Transaction Execution
- `/home/user/aramid-bridge-fe-vue/src/scripts/near/submitNearClaimTx.ts` - NOT IMPLEMENTED
  - Lines 1-4: Throws error "Near claim is not yet implemented"
  - Lines 23-70: Commented implementation showing planned behavior

---

## ADDRESS VALIDATION PATHS

- `/home/user/aramid-bridge-fe-vue/src/scripts/common/isValidSourceAddress.ts` - Main validation
  - Lines 22-29: isValidAddress() function with chain-type checking
  - Line 24: ALGO validation via algosdk.isValidAddress()
  - Line 25: ETH validation via ethers.isAddress()
  - Line 26: NEAR validation via isValidNearAddress()
  - Lines 32-38: NEAR regex pattern validation

---

## BALANCE QUERY PATHS

### EVM Balance Queries
- `/home/user/aramid-bridge-fe-vue/src/scripts/eth/getEthAccountTokenBalance.ts` - ERC20 balance
  - Uses ethers.js Contract interface
  - Queries balanceOf() method
  - Used in WalletSource.vue lines 102-109

### AVM Balance Queries
- `/home/user/aramid-bridge-fe-vue/src/scripts/algo/getAlgoAccountTokenBalance.ts` - ASA balance
  - Uses Algosdk indexer client
  - Queries account assets
  - Used in WalletSource.vue lines 71-100

- `/home/user/aramid-bridge-fe-vue/src/scripts/algo/getAlgoAccountARC200TokenBalance.ts` - ARC200 balance
  - Special handling for ARC200 tokens on Voi
  - Used in SignPage.vue for balance queries

- `/home/user/aramid-bridge-fe-vue/src/scripts/algo/getAlgoAccountTokenOptedIn.ts` - Check opt-in status
  - Verifies token is opted-in before allowing transactions

---

## RPC & NODE CONFIGURATION PATHS

### EVM RPC Configuration
- Stored in secure.json under `chains[chainId].providerUrl`
- Loaded by getWeb3Modal.ts at line 34
- Example chain IDs: 42161 (Arbitrum), 8453 (Base)

### AVM Node Configuration
- `/home/user/aramid-bridge-fe-vue/src/scripts/algo/getAlgodClientByChainId.ts` - Primary Algod client
- `/home/user/aramid-bridge-fe-vue/src/scripts/algo/getAlgodClientByChainIdWithFailover.ts` - Fallover mechanism
- `/home/user/aramid-bridge-fe-vue/src/scripts/algo/getIndexerClientByChainId.ts` - Indexer client
- `/home/user/aramid-bridge-fe-vue/src/scripts/algo/getPublicProviders.ts` - Public provider definitions

### NEAR RPC Configuration
- `/home/user/aramid-bridge-fe-vue/src/scripts/near/constant.ts` (lines 28-48)
  - NEAR_TESTNET_RPC: https://rpc.testnet.near.org
  - NEAR_MAINNET_RPC: https://rpc.mainnet.near.org
  - NEAR_TESTNET_WALLET: https://testnet.mynearwallet.com
  - NEAR_MAINNET_WALLET: https://app.mynearwallet.com

---

## UI COMPONENT RENDERING PATHS

### Chain-Type Conditional Rendering Examples

**File**: `/home/user/aramid-bridge-fe-vue/src/components/WalletSource.vue`
```vue
- Lines 191-217: ALGO wallet UI
- Lines 218-280: ETH wallet UI
- Lines 305-306: Display "QR Code" when QRCode connector active
```

**File**: `/home/user/aramid-bridge-fe-vue/src/components/WalletDestination.vue`
```vue
- Lines 63-66: Logic branch for same vs cross-chain
- Lines 67-105: ETH-specific connection flow
```

**File**: `/home/user/aramid-bridge-fe-vue/src/components/ReviewPage.vue`
```vue
- Lines 128-165: approveButtonClick (ETH only)
- Lines 167-207: lockButtonClick (ETH only)
- Lines 209-249: payNativeButtonClick (ETH only)
- Entire page is ETH/EVM focused
```

**File**: `/home/user/aramid-bridge-fe-vue/src/components/SignPage.vue`
```
- ALGO/AVM focused transaction signing
- QR code generation for offline signing
- Handles ARC200 token special cases
```

**File**: `/home/user/aramid-bridge-fe-vue/src/components/BridgePage.vue`
```
- Lines 51-170: Form submission with chain-type validation
- Chain-specific validation logic
- Route synchronization
```

---

## BRIDGE CONTRACT INTERACTION PATHS

### EVM Contract ABIs
- Base path: `/home/user/aramid-bridge-fe-vue/src/assets/contracts/`
- Structure: `ethereum-mainnet/`, `polygon/`, chain-specific folders
- Each contains: AramidUSDTokenMainnet.json, Bridge.json, ERC1967Proxy.json, etc.

### Bridge Contract Addresses
- Stored in: `PublicConfigurationRoot.chains[chainId].address`
- Retrieved via: `getChainConfiguration(chainId)`
- Example: Base (8453) = "0xC7FAA8f8C6D9Dc05ABf3C5aa741a38F9A6d1C263"

### Bridging Logic
- Fee calculation: `/home/user/aramid-bridge-fe-vue/src/scripts/common/calculateFeeAndDestinationAmount.ts`
- Token support mapping: `PublicConfigurationRoot.chains2tokens`
- Destination validation: `scripts/events/fillDestinationChainConfiguration.ts`

---

## ROUTING & NAVIGATION PATHS

### URL Route Configuration
- File: `/home/user/aramid-bridge-fe-vue/src/router/index.ts`
- Pattern: Routes include chain names and token names as URL parameters
- Example: `/bridge/:sourceChain/:destinationChain/:sourceToken/:destinationToken`

### Route Synchronization
- Location: `/home/user/aramid-bridge-fe-vue/src/components/BridgePage.vue`
- Lines 44-170: Watch store changes and update URL
- Lines 96-105: Construct route params from store state
- Prevents loops with `lockRouteForSwitch` flag

---

## TOKEN CONFIGURATION PATHS

### Token Item Structure
- Interface: `/home/user/aramid-bridge-fe-vue/src/scripts/interface/mapping/TokenItem.ts`
- Properties: tokenId, name, symbol, decimals, type (eth/algo), logo, etc.

### Token Balance Tracking
- State properties in app.ts:
  - sourceAddressBalance (refreshed on address change)
  - destinationAddressBalance
  - destinationBridgeBalance (escrow balance)
  - approvedBalance (EVM only)

### Token Selection Flow
- Source: `AssetSelectionSource.vue`
- Destination: `AssetSelectionDestination.vue`
- Validation: `scripts/events/fillSourceTokenConfiguration.ts`
- Validation: `scripts/events/fillDestinationTokenConfiguration.ts`

---

## LOGGER & ERROR HANDLING

- Logger: `/home/user/aramid-bridge-fe-vue/src/scripts/common/getLogger.ts`
- Toast notifications: All components use `useToast()` from PrimeVue
- Error pattern: Try-catch with toast.add() for user feedback
- Chain-specific errors not yet differentiated (improvement needed)

---

## SECURITY & VALIDATION

### Chain Validation
- File: `/home/user/aramid-bridge-fe-vue/src/scripts/events/resetSourceChainIfNotMatched.ts`
- File: `/home/user/aramid-bridge-fe-vue/src/scripts/events/resetDestinationChainIfNotMatched.ts`
- Ensures selected chains are in supported list

### Token Validation
- File: `/home/user/aramid-bridge-fe-vue/src/scripts/events/resetSourceTokenIfNotMatched.ts`
- File: `/home/user/aramid-bridge-fe-vue/src/scripts/events/resetDestinationTokenIfNotMatched.ts`
- Ensures token pairs are valid for bridge route

### Transaction Validation
- Eth: `scripts/eth/validEthTxHash.ts` - Validates eth tx format
- Algo: `scripts/algo/validAlgoTxHash.ts` - Validates algo tx format
- Checksum: `scripts/common/isValidSourceAddress.ts` - Address validation

---

## ENVIRONMENT & DEPLOYMENT

### Build Configuration
- File: `/home/user/aramid-bridge-fe-vue/vite.config.ts`
- Vue 3 + Vite setup
- Tailwind CSS

### TypeScript Configuration
- Main: `/home/user/aramid-bridge-fe-vue/tsconfig.json`
- App: `/home/user/aramid-bridge-fe-vue/tsconfig.app.json`
- Node: `/home/user/aramid-bridge-fe-vue/tsconfig.node.json`
- Vitest: `/home/user/aramid-bridge-fe-vue/tsconfig.vitest.json`

### Package Dependencies
- File: `/home/user/aramid-bridge-fe-vue/package.json`
- Key packages:
  - ethers: EVM interaction
  - algosdk: AVM interaction
  - @txnlab/use-wallet-vue: AVM wallet connector
  - avm-wallet-vue: AVM wallet provider
  - @web3modal/ethers: EVM wallet modal
  - pinia: State management
  - vue-router: Routing
  - vue-i18n: Internationalization

