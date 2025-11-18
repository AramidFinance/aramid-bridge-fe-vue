# Web3 Chain Integration Analysis - Aramid Bridge Frontend

## Executive Summary
This application implements a cross-chain bridge supporting three blockchain ecosystems: Ethereum Virtual Machine (EVM), Algorand Virtual Machine (AVM), and NEAR Protocol. The architecture uses chain type detection to conditionally render components, manage wallet connections, and execute transactions specific to each blockchain type.

---

## 1. SUPPORTED CHAINS & CATEGORIZATION

### Current Supported Chains (from public-configuration.json):

#### EVM Chains (type: 'eth')
- **Arbitrum** - Chain ID: 42161
- **Base** - Chain ID: 8453

#### AVM Chains (type: 'algo')
- **Algorand Mainnet** - Chain ID: 416001
- **Algorand Testnet** - Chain ID: 416002 (inferred from code)
- **Voi Network** - Chain ID: 416101
- **AramidChain** - Chain ID: 101003 (custom Algorand-based chain)

#### NEAR Protocol (type: 'near')
- **NEAR Mainnet** - Chain ID: 102002
- **NEAR Testnet** - Chain ID: 102001

### Chain Type Detection Logic
Chain types are determined by ID ranges in `chainId2Type.ts` and validated against configuration:

```
ALGO: IDs 416001, 416002, 416101, 416102, 101003, or in range 101000-101002
NEAR: IDs 102001, 102002
ETH:  IDs < 101000 or > 102000
```

---

## 2. EVM vs AVM CHAIN DIFFERENTIATION

### Architecture Pattern
The codebase uses explicit chain type checking throughout to implement chain-specific logic:
- Wallet connection mechanisms
- Transaction submission patterns
- Balance queries
- Address validation
- UI rendering

### Key Differentiation Points

#### A. Chain Type Definition
- **Type Property**: `ChainTypeEnum = 'eth' | 'algo' | 'near'`
- **Location**: `ChainItem` interface in `interface/mapping/ChainItem.ts`
- **Storage**: `PublicConfigurationRoot.chains[chainId]` mapping
- **Access Pattern**: `store.state.sourceChainConfiguration?.type`

#### B. Address Validation
**EVM Chains** (in `isValidSourceAddress.ts`):
```typescript
chainConf.type == 'eth' && ethers.isAddress(address)
```
- Validates 42-character Ethereum-format addresses (0x...)
- Uses ethers.js validation library

**AVM Chains**:
```typescript
chainConf.type == 'algo' && algosdk.isValidAddress(address)
```
- Validates 58-character Base32-encoded Algorand addresses
- Uses algosdk validation

**NEAR Chains**:
```typescript
chainConf.type == 'near' && isValidNearAddress(address)
```
- Pattern: `/^(([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+$/`
- Requires lowercase alphanumeric with dashes/underscores

---

## 3. CHAIN-SPECIFIC UI RENDERING LOGIC

### Component Rendering Patterns

#### WalletSource.vue
**EVM Wallet Logic** (lines 218-280):
```vue
<div v-if="store.state.sourceChainConfiguration?.type == 'eth'">
  <!-- Web3Modal wallet connection -->
  <!-- Features:
       - Browser provider detection
       - Network switching via useSwitchNetwork
       - Multiple polling attempts (0.5s, 1s, 5s, 10s)
       - Auto-connect on mount
  -->
</div>
```

**AVO Wallet Logic** (lines 191-217):
```vue
<div v-if="store.state.sourceChainConfiguration?.type == 'algo'">
  <!-- Two connector types supported:
       1. UseWallet: via @txnlab/use-wallet-vue
       2. QRCode: Manual address entry for offline signing
  -->
</div>
```

#### WalletDestination.vue
**Cross-Chain Detection**:
- If source and destination are same type → dialog to select wallet
- If destination is ALGO but source is EVM → special ALGO wallet dialog
- If destination is EVM → direct Web3Modal integration
- ETH destinations do NOT allow manual address entry (hardcoded behavior)

#### ReviewPage.vue - Transaction UI
**EVM Chains Only** (lines 67-281):
```vue
<div v-if="store.state.sourceChainConfiguration?.type == 'eth'">
  <!-- Approve Button: Calls executeEthApproveTx -->
  <!-- Lock Button: Calls executeEthLockTokensTx -->
  <!-- Switch Network: Prompts for network change if needed -->
</div>
```

**Transaction Flow for ETH**:
1. Switch to correct network
2. Execute approve transaction (token allowance)
3. Wait for approval confirmation
4. Execute lock/bridge transaction
5. Redirect to signing page

### Status Bar Messages
```vue
<span v-if="store.state.sourceChainConfiguration?.type == 'eth'">
  Approve & Sign
</span>
<span v-if="store.state.destinationChainConfiguration?.type == 'algo'">
  Receive
</span>
```

---

## 4. WALLET CONNECTION PATTERNS PER CHAIN TYPE

### EVM Chain Wallets

**Provider**: Web3Modal with ethers.js
**Location**: `scripts/eth/getWeb3Modal.ts`

**Configuration**:
- Filters chains from public configuration where `type == 'eth'`
- Maps each chain to Web3Modal Chain format:
  ```typescript
  {
    chainId, name, currency, rpcUrl, explorerUrl
  }
  ```
- RPC URLs loaded from secure configuration
- Single Web3Modal instance (singleton pattern)

**Connection Flow**:
1. Open Web3Modal dialog
2. User selects wallet (MetaMask, WalletConnect, etc.)
3. User grants permissions
4. Automatic network switching via `useSwitchNetwork()`
5. Address and chainId automatically detected

**Key Components**:
- `useWeb3ModalProvider()` - access to wallet provider
- `useWeb3ModalAccount()` - get address and chainId
- `useSwitchNetwork()` - request chain switch

### AVM Chain Wallets (Algorand/Voi/AramidChain)

**Provider 1**: @txnlab/use-wallet-vue
**Provider 2**: Manual QR Code (avm-wallet-vue)

**Supported Wallets** (from `isWalletForChain.ts`):
```javascript
416001 (Algorand):
  - walletconnect, wc, pera, defly, exodus, biatec
  
416101, 416102 (Voi/AramidChain):
  - walletconnect, biatec, kibisis
  
101003 (AramidChain):
  - walletconnect, biatec
```

**Connection Flow**:
1. Opens SelectSourceWalletAlgoDialog
2. Displays available wallets for current chain
3. User can select wallet or enter address via QR
4. Stores `sourceAlgoConnectorType` (UseWallet vs QRCode)
5. Sets `activeNetwork` based on chain configuration

**Network Mapping**:
```typescript
switch (chainName) {
  case 'Algorand': setActiveNetwork(NetworkId.MAINNET)
  case 'Testnet': setActiveNetwork(NetworkId.TESTNET)
  case 'AramidChain': setActiveNetwork(NetworkId.ARAMIDMAIN)
  case 'Voi': setActiveNetwork(NetworkId.VOIMAIN)
}
```

**QR Code Option**:
- Validates address via `algosdk.decodeAddress()`
- Sets `sourceAlgoConnectorType = AlgoConnectorType.QRCode`
- Enables offline signing workflows

### NEAR Protocol Wallets

**Status**: NOT YET IMPLEMENTED
**Location**: `scripts/near/submitNearClaimTx.ts` contains stub implementation

**Planned Features** (from commented code):
```javascript
- MyNearWallet connection
- Contract interaction: release_tokens, storage_deposit
- Multi-action transactions
- Gas and storage fee handling
```

**NEAR Constants**:
- Mainnet: Chain ID 102002, RPC: https://rpc.mainnet.near.org
- Testnet: Chain ID 102001, RPC: https://rpc.testnet.near.org
- Wallets: https://app.mynearwallet.com (mainnet) or testnet variant

---

## 5. TRANSACTION SUBMISSION DIFFERENCES

### EVM Transaction Flow (Scripts in `scripts/eth/`)

#### 1. executeEthApproveTx()
**Purpose**: Approve token transfer for bridge contract
**Process**:
```typescript
1. Get bridge contract address via getBridgeContractAddressAsync()
2. Create ERC20 contract instance
3. Call approve(bridgeAddress, amount)
4. Returns tx object with hash and wait() method
```

**File**: `scripts/eth/executeEthApproveTx.ts`
**Used In**: ReviewPage.vue - "Approve" button

#### 2. executeEthLockTokensTx()
**Purpose**: Lock tokens in bridge contract
**Parameters Passed**:
```javascript
bridgeContract.lockTokens(
  tokenForFee,           // address
  feeAmount,             // BigNumber
  tokenToBridge,         // address
  amountToBridge,        // BigNumber
  destinationChainData,  // { chainId, tokenId, amount, addressId }
  memo                   // string
)
```

**File**: `scripts/eth/executeEthLockTokensTx.ts`
**Used In**: ReviewPage.vue - "Lock" button

#### 3. executeEthLockNativeTx()
**Purpose**: Lock native tokens (ETH) instead of ERC20
**File**: `scripts/eth/executeEthLockNativeTx.ts`
**Used In**: ReviewPage.vue - conditional rendering for native token

#### 4. executeEthRedeemTx()
**Purpose**: Claim tokens on destination EVM chain
**File**: `scripts/eth/executeEthRedeemTx.ts`
**Used In**: ClaimPage.vue - "Claim" button
**Prerequisites**:
- Correct destination chain connected
- Valid claim data from source chain
- Proper signatures from Aramid validators

### AVM Transaction Flow (Scripts in `scripts/algo/`)

**Location**: SignPage.vue handles algo transaction signing

**Key Features**:
1. **Transaction Building**: Uses algosdk to construct transactions
2. **Multi-Transaction Support**: Can group multiple transactions
3. **QR Signing Option**: Supports offline QR-based signing
4. **Network Detection**: Automatically switches between Algorand networks

**Signing Process**:
```typescript
if (sourceChainConfiguration.type == 'algo' && sourceAlgoConnectorType == AlgoConnectorType.UseWallet):
  // Sign via connected wallet (live signing)
else if (sourceAlgoConnectorType == AlgoConnectorType.QRCode):
  // Generate QR code for offline signing
```

**Checked Transactions**:
- `checkSourceAlgoTx()`: Verify source chain transaction validity
- `checkDestinationAlgoTx()`: Verify destination chain claim transaction

### NEAR Transaction Flow (Scripts in `scripts/near/`)

**Status**: STUB - throws error "Near claim is not yet implemented"

**Planned Implementation** (visible in commented code):
```typescript
// Contract methods:
release_tokens(
  max_release_round,
  source_transaction_id,
  destination_chain_data,
  source_chain_data,
  note
)

storage_deposit(
  account_id
)

// Multi-action support:
[
  { type: 'FunctionCall', params: { methodName, args, gas, deposit } },
  { type: 'FunctionCall', params: { methodName, args, gas, deposit } }
]
```

---

## 6. CHAIN DETECTION & SWITCHING LOGIC

### Detection Mechanism

**Primary Method**: `chainId2Type()` in `scripts/common/chainId2Type.ts`
```typescript
async (chainId: number) => {
  const publicConfiguration = await getPublicConfiguration(false)
  return publicConfiguration.chains[chainId].type
}
```

**Secondary Method**: `getChainType()` in `scripts/common/getChainType.ts`
```typescript
// Direct ID-based detection (no config dependency)
const getChainType = (chain: number, publicConfiguration): string | null
```

### Chain Retrieval

**Get Filtered Chain Lists**:
```typescript
getEthChains()  // Returns chain IDs where type == 'eth'
getAlgoChains() // Returns chain IDs where type == 'algo'
```

**Both implement caching pattern**:
```typescript
let cache: number[] | null = null
if (cache !== null) return cache
// ... fetch and build cache
```

### Network Switching

**EVM Networks**:
```typescript
const { switchNetwork } = useSwitchNetwork()
switchNetwork(store.state.sourceChain)
// Web3Modal handles actual switch prompt
```

**AVM Networks**:
```typescript
const { setActiveNetwork } = useWallet()
setActiveNetwork(NetworkId.MAINNET) // or TESTNET, ARAMIDMAIN, VOIMAIN
// Library handles context switch
```

### Route/Chain Sync

**Bidirectional Sync** in BridgePage.vue:
1. **Watch Route Changes**: Parse URL params for chain selection
2. **Watch Store Changes**: Update URL when user selects chains
3. **Lock Mechanism**: `store.state.lockRouteForSwitch` prevents loops

---

## 7. CONFIGURATION FILE PATHS

### Public Configuration
- **File**: `/public/public-configuration.json`
- **Also**: `src/env/public-configuration.ipfs.json` (IPFS backup)
- **Location in Code**: 
  - Loaded via `getPublicConfiguration()` 
  - Cached in store: `store.state.publicConfiguration`
  - Type: `PublicConfigurationRoot`

**Structure**:
```typescript
{
  addresses: {
    config, configObj, proofs, proofsObj, claims, claimsObj,
    roundOracle, roundOracleObj, soldiersCommObj
  },
  chains: {
    [chainId]: ChainItem
  },
  chains2tokens: {
    [sourceChainId]: {
      [destinationChainId]: {
        [sourceTokenId]: [DestinationTokenId]
      }
    }
  }
}
```

### Private Configuration
- **Secure Secrets**: `src/env/secure.json.ts`
- **Contents**: 
  - Web3Modal project IDs
  - RPC endpoint URLs for each EVM chain
  - IPFS gateway URLs

**Access**: `getSecureConfiguration()`

### Application Configuration
- **File**: Loaded from API or local
- **Type**: `AppConfiguration`
- **Contains**:
  - Environment (testnet/mainnet)
  - Feature flags
  - IPFS and configuration URLs
  - Main network and token settings

**Access**: `getAppConfiguration()`

### Chain Item Structure
```typescript
{
  chainId: number
  name: string
  type: 'eth' | 'algo' | 'near'
  logo: string
  folder: string
  address: string (bridge contract)
  tokens: TokenId2TokenItem
  blockExplorers: string[]
  soldiersByRound: SoldierByRoundItem[]
  confirmationCount: number
}
```

---

## 8. COMPONENT & FILE HIERARCHY

### Chain Selection Components
- `ChainSelectionSource.vue` - Select source chain, loads from dialog
- `ChainSelectionDestination.vue` - Select destination chain
- `SelectSourceChainDialog.vue` - Modal for chain selection
- `SelectDestinationChainDialog.vue` - Modal for chain selection

### Wallet Components
- `WalletSource.vue` - Connect source wallet (chain-specific logic)
- `WalletDestination.vue` - Connect destination wallet
- `SelectSourceWalletAlgoDialog.vue` - Algo wallet selection
- `SelectSourceWalletDialog.vue` - (referenced but not seen)
- `SelectDestinationWalletDialog.vue` - Destination wallet selection
- `SelectDestinationWalletAlgoDialog.vue` - Algo destination wallet

### Page Components
- `BridgePage.vue` - Main bridge interface
- `ReviewPage.vue` - Review & submit transactions (ETH-focused)
- `SignPage.vue` - Sign transactions (Algo-focused)
- `ClaimPage.vue` - Claim received tokens

### Core Scripts by Chain Type

**ETH Scripts** (`scripts/eth/`):
- getWeb3Modal.ts
- executeEthApproveTx.ts
- executeEthLockTokensTx.ts
- executeEthLockNativeTx.ts
- executeEthRedeemTx.ts
- getEthAccountTokenBalance.ts
- getEthChains.ts
- validEthTxHash.ts
- chainId2Bridge.ts
- decodeTransactionData.ts

**ALGO Scripts** (`scripts/algo/`):
- getAlgoChains.ts
- getAlgodClientByChainId.ts
- getAlgodClientByChainIdWithFailover.ts
- getIndexerClientByChainId.ts
- getIndexerClientByChainIdWithFailover.ts
- getAlgoAccountTokenBalance.ts
- getAlgoAccountARC200TokenBalance.ts
- getAlgoAccountTokenOptedIn.ts
- getBridgeLog.ts
- checkSourceAlgoTx.ts
- checkDestinationAlgoTx.ts
- getAlgorandTransaction.ts
- getAlgorandConfigTransaction.ts
- isWalletForChain.ts
- validAlgoTxHash.ts

**NEAR Scripts** (`scripts/near/`):
- constant.ts (chain IDs, RPC URLs, wallet URLs)
- submitNearClaimTx.ts (NOT IMPLEMENTED)

---

## 9. STATE MANAGEMENT

### Pinia Store Structure (`stores/app.ts`)

**Key State Properties**:
```typescript
// Chain Selection
sourceChain?: number
sourceChainConfiguration?: ChainItem
destinationChain?: number
destinationChainConfiguration?: ChainItem

// Wallet Connection
sourceAddress?: string
connectedSourceChain?: number
sourceAlgoConnectorType?: AlgoConnectorType
destinationAddress?: string
connectedDestinationChain?: number

// Token & Amount
sourceToken?: string
sourceTokenConfiguration?: TokenItem
destinationToken?: string
destinationTokenConfiguration?: TokenItem
sourceAmount: string
destinationAmount: string
feeAmount: string

// Transaction Status
approveTxStatus: ITxStatus
BridgeTxStatus: ITxStatus
claimTxStatus: ITxStatus
approvalTxHash?: string
lockAssetHash?: string
claimTxHash?: string
claimData?: IEthIPFSData

// Algorand-Specific
algoFetching?: boolean
algoShowModal?: boolean
algoPendingRequest?: boolean
algoSignedTxns?: Uint8Array[][] | null
algoPendingSubmissions?: Array<string | Error>
algoUri?: string
algoResult?: IResult | null

// NEAR-Specific (partial support)
isNearTxPending?: boolean
isNearClaimed?: boolean
```

---

## 10. RECOMMENDATIONS FOR BETTER CHAIN-SPECIFIC UX

### High Priority

1. **NEAR Protocol Implementation**
   - Complete the stubbed `submitNearClaimTx.ts`
   - Implement NEAR wallet connection flow
   - Add NEAR-specific UI page similar to SignPage.vue for Algo
   - Status: Currently blocking NEAR functionality

2. **Unified Transaction Status Page**
   - Create chain-agnostic transaction monitoring
   - Show appropriate fields based on chain type
   - Currently ReviewPage is heavily EVM-focused, SignPage is Algo-focused
   - Add a generic StatusBar that adapts to chain type

3. **Wallet Type Validation**
   - Pre-validate wallet compatibility with selected chain
   - Show warning if wallet doesn't support selected chain
   - Currently users can select incompatible chain-wallet combos

4. **Better Error Messages**
   - Chain-specific error handling for transaction failures
   - Distinguish between temporary network issues and transaction reverts
   - Currently generic error messages don't help users understand chain-specific issues

### Medium Priority

5. **Consolidated Chain Information**
   - Create a `ChainInfo` component showing:
     - Block confirmations needed
     - Current gas prices (EVM only)
     - Estimated bridge time by chain type
     - Liquidity status per chain
   - Currently scattered across multiple components

6. **Balance Refresh Strategy**
   - Different polling intervals per chain type:
     - EVM: 12 second blocks (1 block average)
     - Algo: 4.5 second blocks (2-3 block average)
     - NEAR: 1.2 second blocks
   - Currently uses generic refresh logic

7. **Token Support Validation**
   - Validate token exists on destination chain before confirming
   - Currently can select incompatible token-chain combinations
   - Show supported tokens per destination chain

8. **Network Switching UX**
   - Auto-switch without prompts for small networks
   - Queue pending transactions when network switches
   - Currently requires manual re-submission after network change

### Low Priority

9. **Cosmetic Improvements**
   - Different color themes per chain ecosystem (blue=EVM, green=Algo, red=NEAR)
   - Chain-specific icons in status bar
   - Animated transitions when switching chain types

10. **Performance Optimizations**
    - Lazy load chain-specific modules (only load NEAR code if NEAR selected)
    - Cache chain metadata more aggressively
    - Implement proper dependency injection per chain type

11. **Testing Infrastructure**
    - Create chain-specific test suites
    - Mock different wallet providers per chain
    - Integration tests for cross-chain flows

12. **Documentation**
    - Document chain-specific limitations
    - Create troubleshooting guide per chain type
    - Add chain selection flowchart in UI help

---

## 11. CRITICAL CODE LOCATIONS SUMMARY

| Functionality | File Location |
|---|---|
| Chain Type Definition | `interface/mapping/ChainTypeEnum.ts` |
| Chain Configuration | `public/public-configuration.json` |
| Chain Type Detection | `common/chainId2Type.ts`, `common/getChainType.ts` |
| EVM Wallet Setup | `eth/getWeb3Modal.ts` |
| Algo Wallet Setup | `algo/isWalletForChain.ts`, dialogs/SelectSourceWalletAlgoDialog.vue |
| Address Validation | `common/isValidSourceAddress.ts` |
| ETH Transactions | `eth/executeEthApproveTx.ts`, `eth/executeEthLockTokensTx.ts` |
| Algo Transactions | `SignPage.vue` (main signing logic) |
| NEAR Transactions | `near/submitNearClaimTx.ts` (NOT IMPLEMENTED) |
| State Management | `stores/app.ts` |
| Configuration Loading | `common/getPublicConfiguration.ts` |
| Chain Filtering | `eth/getEthChains.ts`, `algo/getAlgoChains.ts` |

---

## 12. INTEGRATION PATTERNS

### Pattern 1: Conditional Rendering by Chain Type
```vue
<div v-if="chainConfig?.type == 'eth'">ETH specific UI</div>
<div v-else-if="chainConfig?.type == 'algo'">Algo specific UI</div>
<div v-else-if="chainConfig?.type == 'near'">NEAR specific UI</div>
```
**Used In**: WalletSource.vue, WalletDestination.vue, ReviewPage.vue, SignPage.vue

### Pattern 2: Chain-Specific Function Import & Call
```typescript
if (store.state.sourceChainConfiguration.type == 'eth') {
  const result = await executeEthApproveTx()
} else if (store.state.sourceChainConfiguration.type == 'algo') {
  const result = await executeAlgoTx()
}
```
**Used In**: ReviewPage.vue, ClaimPage.vue

### Pattern 3: Configuration-Driven Chain Lists
```typescript
const chains = Object.values(publicConfiguration.chains)
  .filter(c => c.type == 'eth')
```
**Used In**: getEthChains.ts, getWeb3Modal.ts

### Pattern 4: Address Validation by Type
```typescript
export const isValidAddress = (chainConf: ChainItem, address: string) => {
  return (chainConf.type == 'algo' && algosdk.isValidAddress(address)) ||
         (chainConf.type == 'eth' && ethers.isAddress(address)) ||
         (chainConf.type == 'near' && isValidNearAddress(address))
}
```
**Used In**: BridgePage.vue form validation

---

## Conclusion

The Aramid Bridge implements a well-structured multi-chain architecture using:
1. **Configuration-driven chain management** via PublicConfigurationRoot
2. **Type-based conditional logic** for chain-specific rendering
3. **Modular script organization** by chain ecosystem
4. **Wallet abstraction layers** for each chain type
5. **Pinia state management** with chain-specific properties

**Current Gaps**:
- NEAR implementation incomplete
- Some code duplication between similar chain types
- UI somewhat split between Review (EVM) and Sign (Algo) pages
- Could benefit from unified transaction monitoring

**Strengths**:
- Clean separation of concerns
- Easy to add new chains
- Comprehensive address validation
- Good wallet integration per chain type
- Fallback mechanisms for network resilience
