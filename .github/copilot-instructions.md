# Aramid Bridge Frontend Vue Application

Aramid Bridge is a Vue 3 + Vite web application for cross-chain asset bridging between Algorand, Ethereum, Polygon, Aurora, Near, Base, Arbitrum, Sepolia, and other blockchain networks. The application enables users to transfer tokens across different blockchain networks through a sophisticated bridge infrastructure with wallet integrations.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## VSCode Configuration

- **Settings Alignment**: `.vscode/settings.json` is configured to match project formatting standards
- **Prettier Integration**: All Prettier settings mirror `.prettierrc.json` configuration exactly
  - `printWidth: 200`, `tabWidth: 2`, `singleQuote: true`, `semi: false`, `trailingComma: "none"`
- **ESLint Integration**: Auto-fix on save enabled for Vue, TypeScript, and JavaScript files
- **Format on Save**: Enabled with Prettier as default formatter for all supported file types
- **Vue Support**: Optimized settings for Vue 3 development with inlay hints enabled

## Working Effectively

### Initial Setup
- Install dependencies: `CYPRESS_INSTALL_BINARY=0 npm install`
  - **CRITICAL**: Cypress binary installation fails in restricted environments. Always use `CYPRESS_INSTALL_BINARY=0` flag.
  - Installation takes ~30 seconds and includes 950+ packages.
  - Expect deprecation warnings from Web3Modal and WalletConnect v1 SDKs - these are normal.

### Build Process
- **NEVER CANCEL BUILDS**: Build takes ~35 seconds total. Always set timeout to 60+ minutes.
- Type checking: `npm run type-check` -- takes ~3 seconds, NEVER CANCEL.
- Full build: `npm run build` -- takes ~35 seconds total, NEVER CANCEL. Set timeout to 60+ minutes.
- Build only (no type check): `npm run build-only` -- takes ~20 seconds, NEVER CANCEL.
- **Build Output**: Creates `dist/` directory with ~400 assets totaling ~15MB compressed.

### Development Workflow
- Development server: `npm run dev` -- starts in ~300ms at http://localhost:5173/
- Production preview: `npm run preview` -- serves built files at http://localhost:4173/
- **ALWAYS** run development server before making changes to test baseline functionality.

### Code Quality
- Linting: `npm run lint` -- may show errors and warnings, these don't block builds.
  - **KNOWN ISSUES**: RegEx escape warnings, unused variables, duplicate case labels.
  - Linting failures are acceptable if functionality works correctly.
- Formatting: `npm run format` -- formats all files in src/ directory, takes ~10 seconds.
- Type checking: `npm run type-check` -- uses vue-tsc, must pass for builds.

### Testing
- Unit tests: `npm run test:unit` -- **NO TESTS EXIST**: will exit with "No test files found".
- E2E tests: Cypress configured but binary unavailable in restricted environments.
  - `npm run test:e2e:dev` and `npm run test:e2e` will fail due to Cypress binary.
  - Test configuration exists in `cypress/` directory with basic smoke test.

## Validation Scenarios

### Manual Application Testing
After making changes, ALWAYS test these scenarios:

1. **Application Loads**: Navigate to dev server URL and verify bridge interface displays.
2. **UI Components Work**: 
   - Verify "Bridge your assets cross-chain" header appears
   - Check Origin/Destination sections are visible
   - Test "Review your transaction" button shows validation errors when clicked without setup
3. **Console Errors**: Expected configuration errors are normal in development:
   - "Algo indexer for chain undefined not configured"
   - "Unable to load control tx" 
   - "error loading mapping Unable to load configuration"
4. **Build Validation**: After changes, run `npm run build` and verify dist/ directory is created.
5. **Production Preview**: Run `npm run preview` and verify application works at http://localhost:4173/

### User Interface Validation
- **Bridge Interface**: Main page shows origin chain, bridge asset, wallet selection, and destination configuration
- **Responsive Design**: Application uses Tailwind CSS with purple gradient theme
- **Wallet Integration**: Multiple wallet connectors (Defly, Pera, Exodus, Kibisis, WalletConnect)
- **Cross-Chain Support**: Supports Algorand, Ethereum mainnet, Sepolia, Polygon, Aurora, Near, Base, Arbitrum

## Project Structure

### Key Directories
- `src/components/`: Vue components including BridgePage, WalletSource, WalletDestination
- `src/scripts/`: Business logic for blockchain integrations (algo/, eth/, near/ subdirectories)
- `src/views/`: Route components (HomeView, ClaimView, ReviewView, SignView, OptinView)
- `src/assets/contracts/`: Smart contract ABIs for different networks
- `src/env/`: Configuration files including public-configuration.ipfs.ts
- `src/stores/`: Pinia stores for state management
- `cypress/`: E2E test configuration and specs

### Important Files
- `vite.config.ts`: Vite build configuration with chunk size optimization
- `tailwind.config.js`: Extensive custom color palette and design system
- `package.json`: Dependencies include major blockchain libraries (algosdk, ethers, web3)
- `.eslintrc.cjs`: ESLint configuration for Vue 3 + TypeScript
- `tsconfig.*.json`: TypeScript configurations for different environments

## Technology Stack
- **Frontend**: Vue 3 (Composition API), TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system; custom UI components in `src/components/ui/` (toasts via `useToast()` from `@/scripts/common/toast`, `AppMessage`, `v-tooltip` directive from `src/directives/tooltip.ts`)
- **Blockchain**: Algorand SDK, Ethers.js, Web3.js, multiple wallet connectors
- **State Management**: Pinia
- **Routing**: Vue Router with dynamic bridge routes
- **Build**: Vite with TypeScript compilation and asset optimization

## Common Tasks

### Making Code Changes
1. **ALWAYS** start dev server first: `npm run dev`
2. Make your changes
3. Verify in browser that application still loads and functions
4. Run linting: `npm run lint` (warnings acceptable)
5. Run formatting: `npm run format` 
6. Test build: `npm run build` -- NEVER CANCEL, wait 60+ seconds
7. Test production: `npm run preview`

### Working with Blockchain Integration
- **Algorand**: Code in `src/scripts/algo/` - includes account management, token balances, transactions
- **Ethereum**: Code in `src/scripts/eth/` - includes Web3Modal, contract interactions, wallet connections
- **Near**: Code in `src/scripts/near/` - includes account validation and transaction submission
- **Configuration**: Check `src/env/` for network and contract configurations

### Configuration Errors
- Missing `public/config.json` causes configuration loading errors in development
- IPFS configuration loading may fail - this is normal for local development
- Indexer connection errors are expected without proper network configuration

## Troubleshooting

### Common Issues
- **Cypress Install Fails**: Always use `CYPRESS_INSTALL_BINARY=0 npm install`
- **Build Hangs**: NEVER CANCEL - builds take 30+ seconds, set 60+ minute timeout
- **Linting Errors**: Non-blocking, application works despite warnings
- **Configuration Errors**: Normal in development without proper blockchain node access
- **Large Bundle Size**: Expected due to multiple blockchain SDKs and wallet libraries

### Environment Dependencies
- **Node.js**: Uses Node.js 20+ (specified in Dockerfile)
- **NPM**: Latest version recommended
- **Browser**: Modern browser required for Web3 wallet integrations
- **Network Access**: Limited in development due to blockchain API dependencies

## CI/CD Integration
- GitHub Actions workflow in `.github/workflows/main.yml`
- Deployment via SSH to remote server with `deploy-vue.sh` script
- Docker build configuration in `docker/Dockerfile` for production
- **ALWAYS** run `npm run format` and fix critical `npm run lint` errors before CI

## Architecture Notes
- **Multi-Chain Bridge**: Supports 8+ blockchain networks with token mapping
- **Wallet Abstraction**: Uses @txnlab/use-wallet-vue and avm-wallet-vue
- **State Management**: Complex state for multi-step bridge transactions
- **Route Structure**: Dynamic routes for different bridge configurations
- **Asset Management**: Large collection of token logos and contract ABIs

## Internationalization (i18n) Guidelines

### Translation Requirements
- **All user-facing text must be translated** using vue-i18n `t()` function
- Translation files are located in `src/locales/` directory
- Supported languages: English (en), Slovak (sk), Czech (cs), Polish (pl), Spanish (es), German (de), Chinese (zh)

### Terminology Standards
- **ALWAYS translate "chain" as "blockchain"** in all languages
  - English: "blockchain" not "chain"
  - Slovak: "blockchain" not "reťazec"
  - Czech: "blockchain" not "řetězec"
- Use "Transfer your assets" instead of "Bridge your assets"
- Be consistent with blockchain terminology across all translations

### Component Translation Pattern
When adding/editing Vue components with text:

1. **Import i18n in script section:**
   ```typescript
   import { useI18n } from 'vue-i18n'
   const { t } = useI18n()
   ```

2. **Use t() for all text in templates:**
   ```vue
   <SimpleLabel>{{ t('chain.origin') }}</SimpleLabel>
   <button>{{ t('common.approve') }}</button>
   ```

3. **Translate tooltips:**
   ```vue
   <div v-tooltip.top="t('wallet.tooltipOrigin')">
   ```

4. **Add new keys to all locale files** (en, sk, cs, pl, es, de, zh)

### Translation Key Structure
- `common.*` - Basic UI elements (buttons, labels, states)
- `bridge.*` - Bridge-specific terminology and messages
- `wallet.*` - Wallet connection and management
- `chain.*` - Blockchain selection and display
- `asset.*` - Asset/token selection and display
- `amount.*` - Amount inputs and validations
- `address.*` - Address management and validation
- `transaction.*` - Transaction states and operations
- `status.*` - Status indicators
- `error.*` - Error messages
- `loading.*` - Loading states

### Checklist for i18n Changes
- [ ] All hardcoded strings replaced with t() calls
- [ ] Tooltips and v-tooltip text translated
- [ ] New keys added to ALL locale files (7 languages)
- [ ] "chain" replaced with "blockchain" in translations
- [ ] Consistent terminology across all languages
- [ ] Component imports useI18n composable
- [ ] Build and type-check pass
- [ ] Test in dev server with different languages