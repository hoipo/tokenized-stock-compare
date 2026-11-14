export interface ExchangeInfo {
  mic: string | null
  abbreviation: string | null
  name: string | null
  timezone: string | null
  country?: string | null
}

export interface TradingLimits {
  minOrderFiatValue: number
  maxOrderFiatValue: number
}

export interface TradingInfo {
  currency: string
  tradingHoursMode: string
  isTradingHalted: boolean
  currentPeriod: string
  openNow: boolean
  nextChangeAt: string | null
  exchange: ExchangeInfo | null
  limitsPerPeriod: {
    market: TradingLimits
    extended: TradingLimits
    overnight: TradingLimits
    closed: TradingLimits
  }
}

export interface StablecoinInfo {
  symbol: string
  currency: string
  network: string
  address: string
  decimals: number
  issuance: boolean
  redemption: boolean
  supportsAtomicSwaps: boolean
}

export interface Deployment {
  address: string
  network: string
  chainId: number | null
  wrapperAddressV2?: string
  supportsAtomicSwaps: boolean
  stablecoins: StablecoinInfo[]
}

export interface XStockAsset {
  id: string
  name: string
  symbol: string
  isin: string
  underlyingSymbol: string
  underlyingIsin: string
  underlying: {
    symbol: string
    isin: string
    type: string | null
    currency: string | null
    exchange: ExchangeInfo | null
  }
  description: string
  logo: string | null
  isTradingHalted: boolean
  allowedOperations: string[]
  trading: TradingInfo
  deployments: Deployment[]
}

export interface RegistryEntry {
  tokenSymbol: string
  underlyingSymbol: string
  name: string
  logo: string | null
  isin: string
  underlyingIsin: string
  currency: string | null
  exchangeName: string | null
}

export interface SharePrice {
  symbol: string
  price: number
  currency: string
  exchangeName: string | null
  asOf: string
  marketState: string | null
  source: "yahoo" | "nasdaq" | "cnbc"
}

export interface TokenMarketPrice {
  price: number
  currency: string
  asOf: string | null
  source: "dexscreener" | "pyth"
  pairUrl: string | null
  dexId: string | null
  chainId: string | null
}

export interface LiquidityPool {
  pairAddress: string
  dexId: string
  chainId: string
  baseTokenSymbol: string
  quoteTokenSymbol: string
  priceUsd: number | null
  liquidityUsd: number | null
  volume24hUsd: number | null
  url: string
  baseTokenAddress: string
}

export interface HaltStatus {
  symbol: string
  isMarketTradingHalted: boolean
  isAtomicTradingHalted: boolean
  allowedOperations: string[]
}

export interface SourceError {
  source: string
  message: string
}

export interface PremiumResult {
  percent: number | null
  unavailableReason: string | null
  reading: string
}

export interface RoundTripEstimate {
  available: boolean
  estimatedCostUsd: number | null
  assumptions: string[]
  unavailableReason: string | null
}

export interface ComparisonData {
  query: string
  underlyingSymbol: string
  tokenSymbol: string
  tokenName: string
  tokenLogo: string | null
  share: SharePrice | null
  tokenPrice: TokenMarketPrice | null
  oraclePrice: TokenMarketPrice | null
  premium: PremiumResult
  trading: TradingInfo | null
  halt: HaltStatus | null
  deployments: Deployment[]
  liquidity: LiquidityPool[]
  roundTrip: RoundTripEstimate
  sourceErrors: SourceError[]
  fetchedAt: string
}
