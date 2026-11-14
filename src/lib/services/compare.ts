import { cacheLife } from "next/cache"
import { fetchAsset, fetchHaltStatus, fetchPythHermesId } from "@/lib/adapters/xstocks"
import { fetchTokenLiquidity } from "@/lib/adapters/dexscreener"
import { fetchPythPrice } from "@/lib/adapters/pyth"
import { fetchSharePrice } from "@/lib/adapters/yahoo"
import { CACHE_REVALIDATE_SECONDS } from "@/lib/constants"
import { settledValue } from "@/lib/http"
import { computePremiumDiscount } from "@/lib/premium"
import { estimateRoundTripCost } from "@/lib/services/round-trip"
import { resolveTicker } from "@/lib/services/registry"
import { isValidTickerShape } from "@/lib/ticker"
import type { ComparisonData, SourceError, TokenMarketPrice } from "@/lib/types"

export async function buildComparison(query: string): Promise<ComparisonData | null> {
  "use cache"
  cacheLife({ revalidate: CACHE_REVALIDATE_SECONDS, expire: 3600 })

  if (!isValidTickerShape(query)) return null

  const resolved = await resolveTicker(query)
  if (!resolved) return null

  const sourceErrors: SourceError[] = []
  const assetResult = await settledValue(
    resolved.asset
      ? Promise.resolve(resolved.asset)
      : fetchAsset(resolved.tokenSymbol),
  )

  const asset = assetResult.ok ? assetResult.value : null
  if (!assetResult.ok)
    sourceErrors.push({ source: "xStocks asset", message: assetResult.error })

  const deployments = asset?.deployments ?? []

  const sharePromise = fetchSharePrice(resolved.underlyingSymbol)
  const liquidityPromise = fetchTokenLiquidity({
    tokenSymbol: resolved.tokenSymbol,
    deployments,
  })
  const haltPromise = settledValue(fetchHaltStatus(resolved.tokenSymbol))
  const hermesPromise = settledValue(fetchPythHermesId(resolved.tokenSymbol))

  const [shareResult, liquidityResult, haltResult, hermesResult] = await Promise.all([
    sharePromise,
    liquidityPromise,
    haltPromise,
    hermesPromise,
  ])

  const share = shareResult.price
  if (shareResult.error)
    sourceErrors.push({ source: "Yahoo Finance", message: shareResult.error })

  let tokenPrice: TokenMarketPrice | null = liquidityResult.tokenPrice
  const liquidity = liquidityResult.pools
  if (liquidityResult.error)
    sourceErrors.push({ source: "Dexscreener", message: liquidityResult.error })

  // Pyth is reference-only and must not invent a secondary-market mid for premium.
  let oraclePrice: TokenMarketPrice | null = null
  if (hermesResult.ok && hermesResult.value) {
    const pythResult = await fetchPythPrice(hermesResult.value)
    if (pythResult.price) oraclePrice = pythResult.price
    else if (pythResult.error)
      sourceErrors.push({ source: "Pyth Hermes", message: pythResult.error })
  } else if (!hermesResult.ok) {
    sourceErrors.push({ source: "xStocks oracles", message: hermesResult.error })
  }

  if (!haltResult.ok)
    sourceErrors.push({ source: "xStocks halt status", message: haltResult.error })

  const premium = computePremiumDiscount({
    tokenPrice: tokenPrice?.price,
    sharePrice: share?.price,
    tokenCurrency: tokenPrice?.currency,
    shareCurrency: share?.currency,
  })

  const trading = asset?.trading ?? null
  const roundTrip = estimateRoundTripCost({ pools: liquidity, trading })

  return {
    query,
    underlyingSymbol: resolved.underlyingSymbol,
    tokenSymbol: resolved.tokenSymbol,
    tokenName: asset?.name ?? resolved.entry.name,
    tokenLogo: asset?.logo ?? resolved.entry.logo,
    share,
    tokenPrice,
    oraclePrice,
    premium,
    trading,
    halt: haltResult.ok ? haltResult.value : null,
    deployments,
    liquidity,
    roundTrip,
    sourceErrors,
    fetchedAt: new Date().toISOString(),
  }
}
