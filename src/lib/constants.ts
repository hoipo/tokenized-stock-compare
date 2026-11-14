export const SITE_NAME = "Stock Token Compare"
export const SITE_TAGLINE =
  "Independent comparison of listed shares and tokenized versions — prices, premium, hours, and liquidity."
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const XSTOCKS_API_BASE =
  process.env.XSTOCKS_API_BASE || "https://api.xstocks.fi/api/v2/public"

export const YAHOO_CHART_BASE =
  process.env.YAHOO_CHART_BASE || "https://query1.finance.yahoo.com/v8/finance/chart"

export const DEXSCREENER_API_BASE =
  process.env.DEXSCREENER_API_BASE || "https://api.dexscreener.com/latest/dex"

export const PYTH_HERMES_BASE =
  process.env.PYTH_HERMES_BASE || "https://hermes.pyth.network/v2"

/** Quotes, DEX pools, halt flags, and assembled comparisons. */
export const PRICE_CACHE_STALE_SECONDS = 30
export const PRICE_CACHE_REVALIDATE_SECONDS = 90
export const PRICE_CACHE_EXPIRE_SECONDS = 60 * 60

/** Symbol list, deployments, and oracle ids. Live trading status uses the price lifetime. */
export const REGISTRY_CACHE_STALE_SECONDS = 5 * 60
export const REGISTRY_CACHE_REVALIDATE_SECONDS = 30 * 60
export const REGISTRY_CACHE_EXPIRE_SECONDS = 6 * 60 * 60

export const UPSTREAM_TIMEOUT_MS = 4_000
export const SHARE_FALLBACK_DELAY_MS = 400
export const SHARE_FALLBACK_GRACE_MS = 1_100

export const MIN_LIQUIDITY_USD = 5_000
export const DEPTH_NOTIONAL_USD = 1_000
