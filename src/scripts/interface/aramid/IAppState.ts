import type { IAssetData } from '@/scripts/interface/algo/IAssetData'
import type { IResult } from '@/scripts/interface/algo/IResult'
import type { IEthIPFSData } from '@/scripts/interface/aramid/IEthIPFSData'
import type { ITxStatus } from '@/scripts/interface/aramid/ITxStatus'
import type { AppConfiguration } from '@/scripts/interface/configuration/AppConfiguration'
import type { SecureConfiguration } from '@/scripts/interface/configuration/SecureConfiguration'
import type { ChainId2ChainItem } from '@/scripts/interface/mapping/ChainId2ChainItem'
import type { ChainItem } from '@/scripts/interface/mapping/ChainItem'
import type { MappingItem } from '@/scripts/interface/mapping/MappingItem'
import type { PublicConfigurationRoot } from '@/scripts/interface/mapping/PublicConfigurationRoot'
import type { TokenItem } from '@/scripts/interface/mapping/TokenItem'
import type { AlgoConnectorType } from '../algo/AlgoConnectorType'

export interface IAppState {
  // Configurations

  appConfiguration: AppConfiguration | null
  publicConfiguration: PublicConfigurationRoot | null
  secureConfiguration: SecureConfiguration | null
  // Interface

  isBridgeTabOpen: boolean
  isReviewTabOpen: boolean
  isClaimTabOpen: boolean
  isMintScreen: boolean
  requestDestinationTokenBalanceRefresh: boolean
  bridgeErrorMessage?: string

  chainConfigs?: ChainId2ChainItem
  routeConfig?: MappingItem

  dialogSelectSourceChainIsOpen: boolean
  dialogSelectSourceAssetIsOpen: boolean
  dialogSelectSourceWalletIsOpen: boolean
  dialogSelectDestinationChainIsOpen: boolean
  dialogSelectDestinationAssetIsOpen: boolean
  dialogSelectDestinationWalletAVMIsOpen: boolean
  dialogSelectDestinationWalletIsOpen: boolean

  dialogSelectArc200BridgeChainIsOpen: boolean
  dialogSelectArc200BridgeAssetIsOpen: boolean
  dialogSelectArc200BridgeWalletIsOpen: boolean

  // app

  sourceProvider?: any
  destinationProvider?: any

  sourceAddress?: string // sender address
  sourceChain?: number // currently selected chain
  sourceChainConfiguration?: ChainItem // currently selected network
  sourceChainGenesis?: string // the network id for qr code
  sourceToken?: string // currently selected token.
  sourceTokenConfiguration?: TokenItem // currently selected token.
  connectedSourceChain?: number
  sourceAmount: string //base source amount
  sourceAmountUpdateEnabled: boolean // enable/disable source amount input. Used for swap networks
  sourceAmountNet: string //base source amount
  sourceAmountFormatted: string //formatted source amount
  sourceBridgeAddress: string // aramid msig address of the source network

  memo: string // person can move data cross chain

  feeToken?: string // token selected to pay fee with
  feeTokenConfiguration?: TokenItem // token selected to pay fee with
  feePercentage?: number

  destinationAddress?: string // receiver address
  destinationChain?: number // currently selected network
  destinationChainConfiguration?: ChainItem // currently selected network
  destinationChainGenesis?: string // the network id for qr code
  destinationToken?: string //currently selected token.
  destinationTokenConfiguration?: TokenItem // currently selected network
  destinationAmount: string //base destination amount
  destinationAmountFormatted: string //formatted destination amount
  destinationBridgeAddress: string // aramid msig address of the destination network

  arc200BridgeAddress?: string // receiver address
  arc200BridgeChain?: number // currently selected network
  arc200BridgeChainConfiguration?: ChainItem // currently selected network
  arc200BridgeChainGenesis?: string // the network id for qr code
  arc200BridgeToken?: string //currently selected token.
  arc200BridgeTokenConfiguration?: TokenItem // currently selected network
  arc200BridgeAmount: string //base destination amount
  arc200BridgeAmountFormatted: string //formatted destination amount
  arc200BridgeAlgoConnectorType?: AlgoConnectorType // WalletConnect | MyAlgo | QR
  arc200BridgeAddressASABalance?: string // balance of tokens at the source account
  arc200BridgeAddressARC200Balance?: string // balance of tokens at the source account
  arc200BridgeDirection: 'ARC200ToASA' | 'ASAToARC200' // direction for bridginig
  connectedArc200BridgeChain?: number

  feeAmount: string //base fee amount
  feeAmountFormatted: string //formatted fee amount

  connectedDestinationChain?: number

  sourceAddressBalance?: string // balance of tokens at the source account
  destinationAddressBalance?: string
  destinationBridgeBalance?: string // balance of tokens at the bridge address of the destination chain
  approvedBalance?: string // balance of approved source token to be used by the bridge contract

  escrowBalanceIsSufficient?: boolean
  escrowBalanceIsSufficient10x?: boolean

  destinationAddressConfirmed?: boolean
  networksAndDestinationAddressConfirmed?: boolean // enable/disable NetworkSelect element
  assetAndAmountConfirmed?: boolean // enable/disable AssetSelect element
  transferApproved?: boolean
  assetLocked?: boolean // if the transaction has been sent to the bridge . lockAssetHash is the tx
  assetClaimed?: boolean
  approvingAndSendingAsset?: boolean // enable/disable Send element
  approvalTxHash?: string
  lockAssetHash?: string
  claimTxHash?: string // tx hash of claiming the tokens from eth network
  claimDataTxHash?: string // tx from algo network with IClaim data
  claimData?: IEthIPFSData // data loaded from ipfs

  // In Case of Algorand Network Selected //
  sourceAlgoConnectorType?: AlgoConnectorType // WalletConnect | MyAlgo | QR
  qrContent?: string
  sourceTxNote?: string
  algoFetching?: boolean
  sourceAlgoConnected?: boolean
  destinationAlgoConnected?: boolean
  destinationAccountOptedIn?: boolean
  algoShowModal?: boolean
  algoPendingRequest?: boolean
  algoSignedTxns?: Uint8Array[][] | null
  algoPendingSubmissions?: Array<string | Error>
  algoUri?: string
  algoAccounts?: string[]
  algoBridgeAddress?: string
  algoResult?: IResult | null
  algoAssets?: IAssetData[]
  destAlgoAssets?: IAssetData[]

  //to Trigger Saved Data
  saveTrigger?: boolean

  // Tx Status Variables
  approveTxStatus?: ITxStatus
  BridgeTxStatus?: ITxStatus
  claimTxStatus?: ITxStatus

  approveTx?: string
  bridgeTx?: string
  claimTx?: string

  isNearTxPending?: boolean
  swapTrigger?: boolean
  isNearClaimed?: boolean
  currentMetamaskChain?: number

  // for Near Tx reload behavior to show values on modal
  savedFormattedSourceAmount?: string
  savedFormattedDestAmount?: string

  nearTokenDepositedFee?: boolean
  approvalUpdated?: boolean
  escrowBalance?: string

  loadingSourceAddressBalance: boolean
  loadingDestinationAddressBalance: boolean
  loadingDestinationEscrowAddressBalance: boolean

  lockRouteForSwitch: boolean
}
