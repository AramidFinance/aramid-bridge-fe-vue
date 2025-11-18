# Aramid Bridge - Web3 Chain Integration Executive Summary

## Quick Facts

- **Supported Chain Types**: 3 (EVM, AVM, NEAR)
- **Supported Chains**: 5+ (Arbitrum, Base, Algorand, Voi, AramidChain)
- **Wallet Types**: 8+ (MetaMask, WalletConnect, Pera, Defly, MyNearWallet, etc.)
- **Transaction Types**: 4 (Approve, Lock/Bridge, Claim, Native Transfer)
- **AVM Signing Methods**: 2 (Live wallet, QR code offline)
- **Implementation Status**: 2/3 ecosystems fully implemented (NEAR pending)

---

## Chain Integration Architecture

### Design Pattern: Type-Based Conditional Logic
```
All chain-specific behavior controlled by:
  ChainItem.type = 'eth' | 'algo' | 'near'
```

This single type field determines:
- Which wallet to connect
- How to validate addresses
- Which transaction methods to call
- How to query balances
- What UI to render

### Configuration-Driven Approach
```
PublicConfigurationRoot {
  chains: {
    [chainId]: ChainItem
  }
}
```
- All supported chains defined in JSON
- Easy to add new chains without code changes
- RPC URLs in separate secure configuration
- Wallet compatibility matrix hard-coded by chain ID

---

## Supported Chains - Quick Reference

| Chain Name | Type | Chain ID | Wallet | Status | Notes |
|---|---|---|---|---|---|
| Arbitrum | EVM | 42161 | Web3Modal | Active | Full bridge support |
| Base | EVM | 8453 | Web3Modal | Active | Full bridge support |
| Algorand | AVM | 416001 | Pera, Defly, WC | Active | ASA tokens |
| Voi | AVM | 416101 | Biatec, Kibisis | Active | ARC200 tokens |
| AramidChain | AVM | 101003 | WalletConnect, Biatec | Active | Custom Algo chain |
| NEAR Mainnet | NEAR | 102002 | MyNearWallet | Stub | NOT IMPLEMENTED |
| NEAR Testnet | NEAR | 102001 | MyNearWallet | Stub | NOT IMPLEMENTED |

---

## Integration Workflow

### Bridge Flow (EVM Example)
```
1. SELECT CHAINS & TOKENS
   - BridgePage validates configuration
   - Checks token support via chains2tokens mapping

2. SELECT WALLETS
   - WalletSource opens Web3Modal
   - User connects MetaMask/WalletConnect
   - Auto-detects address and network

3. CONFIRM REVIEW
   - ReviewPage shows approve/lock buttons
   - Auto-switches to correct network if needed

4. APPROVE TRANSACTION
   - executeEthApproveTx() called
   - User signs in wallet
   - Waits for confirmation

5. LOCK TRANSACTION
   - executeEthLockTokensTx() called
   - User signs in wallet
   - Redirects to claim page

6. CLAIM ON DESTINATION
   - ClaimPage finds corresponding lock transaction
   - User switches to destination chain
   - executeEthRedeemTx() claims tokens
```

### Bridge Flow (AVM Example)
```
1-3. SAME AS EVM

4. SELECT SIGNING METHOD
   - SignPage offers wallet connection OR QR code
   - Validates address via algosdk.decodeAddress()

5. SIGN TRANSACTION
   - If wallet: Sign via connected wallet
   - If QR: Generate QR code for offline signing
   - Submit transaction to Algorand

6. MONITOR STATUS
   - checkSourceAlgoTx() verifies on-chain
   - Bridges detection via oracle
   - Click to claim on destination
```

---

## Critical Implementation Details

### EVM Implementation
- **Wallet Provider**: Web3Modal (AppKit)
- **Library**: ethers.js v6
- **Chain Detection**: Singleton Web3Modal instance
- **Transaction Pattern**: approve() -> lockTokens() -> redeem()
- **Network Switching**: Automatic via useSwitchNetwork()
- **Gas Handling**: User pays gas in MetaMask

### AVM Implementation
- **Wallet Provider**: @txnlab/use-wallet-vue + avm-wallet-vue
- **Library**: algosdk (JavaScript SDK)
- **Chain Detection**: Network ID mapping
- **Transaction Pattern**: Single group transaction with multiple txns
- **Signing Options**: Live wallet OR QR code
- **Token Types**: ASA (native) + ARC200 (EVM-compatible)

### NEAR Implementation (STUB)
- **Status**: NOT IMPLEMENTED - throws error
- **Planned Wallet**: MyNearWallet
- **Planned Pattern**: callMultipleMethod() with actions
- **Needs Implementation**: submitNearClaimTx.ts
- **Risk**: Blocking NEAR bridge functionality

---

## Key Code Patterns

### Pattern 1: Chain Type Detection & Routing
```typescript
if (config.type == 'eth') {
  // Call Web3Modal, use ethers.js
} else if (config.type == 'algo') {
  // Use algosdk, handle QR option
} else if (config.type == 'near') {
  // Not yet implemented
}
```
**Used in**: 50+ files across components and scripts

### Pattern 2: Configuration Loading
```typescript
const config = await getPublicConfiguration()
const chains = config.chains // All chains
const ethChains = chains.filter(c => c.type == 'eth') // EVM only
const algoChains = chains.filter(c => c.type == 'algo') // AVM only
```
**Caching**: Results cached in Pinia store

### Pattern 3: Wallet Connection Per Type
```typescript
// EVM
const modal = getWeb3Modal() // Singleton
await modal.open()

// AVM
const { wallets } = useWallet()
const filtered = wallets.filter(w => isWalletForChain(w.id, chainId))
await wallet.connect()
```

### Pattern 4: Transaction Submission
```typescript
// EVM
const tx = await executeEthApproveTx()
await tx.wait() // User in control, confirms in wallet

// AVM
const txs = signTransactions(txGroup) // Built, signed, submitted
// User signs in wallet or QR
```

---

## Wallet Support Matrix

### Algorand (Chain 416001)
- Pera Wallet
- Defly Wallet  
- Exodus
- Biatec
- WalletConnect
- Manual QR Code Entry

### Voi (Chain 416101) & AramidChain (Chain 101003)
- WalletConnect
- Biatec
- Kibisis (Voi only)
- Manual QR Code Entry

### EVM Chains (Arbitrum, Base)
- MetaMask
- WalletConnect
- Coinbase Wallet
- (via Web3Modal provider)
- NO manual address entry allowed

### NEAR (Not Implemented)
- MyNearWallet (planned)
- WalletConnect (planned)

---

## Balance Query Implementation

### EVM
```typescript
const balance = await getEthAccountTokenBalance(
  chainId,
  address,
  tokenAddress
)
// Uses ethersjs Contract.balanceOf()
```

### AVM
```typescript
const balance = await getAlgoAccountTokenBalance(
  chainId,
  address,
  assetId
)
// Uses algosdk Indexer Client
// Special handling for ARC200 tokens
```

---

## Transaction Status Tracking

### Store Properties
```typescript
approveTxStatus: ITxStatus     // Pending, Success, Error
BridgeTxStatus: ITxStatus      // Pending, Success, Error
claimTxStatus: ITxStatus       // Pending, Success, Error

approvalTxHash: string         // Tx hash from approve
lockAssetHash: string          // Tx hash from lock
claimTxHash: string            // Tx hash from claim
claimData: IEthIPFSData        // Claim data from source chain
```

### Status Monitoring Components
- **ReviewPage.vue**: Shows approve/lock progress
- **SignPage.vue**: Shows signing progress + QR
- **ClaimPage.vue**: Shows claim progress

---

## Known Limitations & Gaps

### High Priority Fixes Needed
1. **NEAR not implemented** - submitNearClaimTx.ts throws error
2. **No chain-specific error messages** - All errors treated the same
3. **UI split between EVM and AVM** - ReviewPage vs SignPage duplication
4. **No wallet compatibility validation** - Users can select incompatible combos
5. **Manual network switching required** - No auto-reconnect after network change

### Medium Priority Improvements
6. No consolidated transaction status page
7. Token support not pre-validated
8. No gas price estimates shown
9. Balance refresh polling not optimized per chain
10. ARC200 token handling could be cleaner

### Low Priority Enhancements
11. No chain-specific UI theming
12. Documentation needs chain-specific guides
13. Testing infrastructure lacks chain-specific tests
14. Performance could be optimized with lazy loading

---

## Development Guidelines

### Adding a New EVM Chain
1. Add chain to `public/public-configuration.json`
2. Add RPC URL to `secure.json`
3. Add contract ABI to `src/assets/contracts/<chainName>/`
4. No code changes needed - getWeb3Modal() will automatically include it

### Adding a New AVM Chain
1. Add chain to `public/public-configuration.json`
2. Update `isWalletForChain.ts` with supported wallets
3. Update Algorand network mapping in `WalletSource.vue`
4. Add node configuration to `getPublicProviders.ts`

### Adding NEAR Support
1. Complete `submitNearClaimTx.ts` implementation
2. Create NEAR-specific wallet connection component
3. Create NEAR transaction signing page
4. Update wallet selection dialogs
5. Add NEAR address validation (already partial)

---

## Testing Checklist for Chain Types

### EVM Chain Testing
- [ ] Web3Modal opens correctly
- [ ] Wallet connect/disconnect works
- [ ] Network switching prompts user
- [ ] Approve transaction succeeds
- [ ] Lock transaction succeeds
- [ ] Claim transaction succeeds
- [ ] Error handling shows meaningful messages

### AVM Chain Testing
- [ ] Algo wallet selection shows correct wallets
- [ ] QR code option works for offline signing
- [ ] Transaction signing succeeds
- [ ] Both ASA and ARC200 tokens work
- [ ] Network switching works
- [ ] Balance queries return correct values
- [ ] Error handling distinguishes chain-specific issues

---

## Performance Metrics

### Configuration Loading
- Public config loaded once, cached in store
- Subsequent requests use cache
- Chain filtering (eth, algo) implemented with caching

### Wallet Connection
- Web3Modal singleton pattern prevents duplication
- useWallet() hooks only initialize once
- Wallet list filtered only on demand

### Balance Queries
- Rate-limited to prevent excessive API calls
- Could be optimized with different intervals per chain type

---

## Security Considerations

### Address Validation
- EVM: 42-char checksum via ethers.isAddress()
- AVM: 58-char base32 via algosdk.isValidAddress()
- NEAR: Regex pattern validation

### Private Key Management
- No private keys stored in frontend
- All signing delegated to wallet providers
- No transaction building without wallet context

### Configuration Security
- Public configuration loaded from IPFS with hash verification
- Private RPC URLs in separate secure.json file
- Web3Modal project ID in config store

---

## File Organization Summary

```
/src
  /scripts
    /algo         - AVM-specific utilities
    /eth          - EVM-specific utilities
    /near         - NEAR utilities (incomplete)
    /common       - Shared utilities (chain-type aware)
    /interface    - TypeScript types
    /events       - State change handlers
  /components
    /dialogs      - Chain selection & wallet dialogs
    WalletSource.vue       - Source wallet (dual logic)
    WalletDestination.vue  - Dest wallet (dual logic)
    ReviewPage.vue         - EVM transaction review
    SignPage.vue           - AVM transaction signing
    ClaimPage.vue          - Claim interface (dual)
    BridgePage.vue         - Main bridge form
  /stores
    app.ts        - Pinia store with chain state
```

---

## Conclusion

The Aramid Bridge implements a clean, configuration-driven multi-chain architecture that successfully bridges EVM and AVM ecosystems. The use of chain type detection enables elegant code reuse while maintaining ecosystem-specific features.

**Strengths**:
- Easy to add new chains
- Clear separation of concerns
- Comprehensive wallet support
- Good error handling patterns

**Improvements Needed**:
- Complete NEAR implementation
- Unify EVM/AVM UI logic
- Add pre-flight validation
- Improve error messaging

**Estimated Effort to Production-Ready**:
- Complete NEAR: 2-3 weeks
- Improve UX: 1-2 weeks
- Testing & optimization: 2-3 weeks
- Total: 5-8 weeks

