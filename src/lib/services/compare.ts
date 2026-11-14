import { cacheLife } from "next/cache"
import { fetchAsset, fetchHaltStatus, fetchPythHermesId } from "@/lib/adapters/xstocks"
import { fetchTokenLiquidity } from "@/lib/adapters/dexscreener"
import { fetchPythPrice } from "@/lib/adapters/pyth"
import { fetchSharePrice } from "@/lib/adapters/share-price"
import {
  PRICE_CACHE_EXPIRE_SECONDS,
  PRICE_CACHE_REVALIDATE_SECONDS,
  PRICE_CACHE_STALE_SECONDS,
} from "@/lib/constants"
import { describePoolDepth } from "@/lib/depth"
import { settledValue, sourceFailureMessage } from "@/lib/http"
import { computePremiumDiscount } from "@/lib/premium"
import { resolveTicker } from "@/lib/services/registry"
import { isValidTickerShape } from "@/lib/ticker"
import type { ComparisonData, Deployment, SourceError, TokenMarketPrice } from "@/lib/types"

export async function buildComparison(query: string): Promise<ComparisonData | null> {
  if (!isValidTickerShape(query)) return null
  const resolved = await resolveTicker(query)
  if (!resolved) return null
  return loadComparison(resolved.underlyingSymbol.toUpperCase())
}

async function loadComparison(underlyingSymbol: string): Promise<ComparisonData | null> {
  "use cache"
  cacheLife({
    stale: PRICE_CACHE_STALE_SECONDS,
    revalidate: PRICE_CACHE_REVALIDATE_SECONDS,
    expire: PRICE_CACHE_EXPIRE_SECONDS,
  })

  const resolved = await resolveTicker(underlyingSymbol)
  if (!resolved) return null

  const sourceErrors: SourceError[] = []
  const registryDeployments = resolved.asset?.deployments ?? []
  const assetPromise = settledValue(
    fetchAsset(resolved.tokenSymbol),
    "Asset details unavailable",
  )

  const [assetResult, shareResult, liquidityResult, haltResult, oracleResult] = await Promise.all([
    assetPromise,
    fetchSharePrice(resolved.underlyingSymbol),
    loadLiquidity(resolved.tokenSymbol, registryDeployments, assetPromise),
    settledValue(fetchHaltStatus(resolved.tokenSymbol), "Halt status unavailable"),
    loadOraclePrice(resolved.tokenSymbol),
  ])

  if (!assetResult.ok)
    sourceErrors.push({ source: "xStocks asset", message: assetResult.error })

  const freshAsset = assetResult.ok ? assetResult.value : null
  const asset = freshAsset ?? resolved.asset
  const deployments = asset?.deployments?.length ? asset.deployments : registryDeployments

  const share = shareResult.price
  if (!share && shareResult.error)
    sourceErrors.push({ source: "Share price", message: shareResult.error })

  const tokenPrice: TokenMarketPrice | null = liquidityResult.tokenPrice
  const liquidity = liquidityResult.pools
  if (liquidityResult.error)
    sourceErrors.push({ source: "Dexscreener", message: liquidityResult.error })

  const oraclePrice = oracleResult.oraclePrice
  sourceErrors.push(...oracleResult.errors)

  if (!haltResult.ok)
    sourceErrors.push({ source: "xStocks halt status", message: haltResult.error })

  const premium = computePremiumDiscount({
    tokenPrice: tokenPrice?.price,
    sharePrice: share?.price,
    tokenCurrency: tokenPrice?.currency,
    shareCurrency: share?.currency,
  })

  const trading = asset?.trading ?? null
  const depth = describePoolDepth({ pools: liquidity, trading })

  return {
    query: resolved.underlyingSymbol,
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
    depth,
    sourceErrors,
    fetchedAt: new Date().toISOString(),
  }
}

async function loadLiquidity(
  tokenSymbol: string,
  registryDeployments: Deployment[],
  assetPromise: ReturnType<typeof settledValue<Awaited<ReturnType<typeof fetchAsset>>>>,
) {
  if (registryDeployments.length > 0)
    return fetchTokenLiquidity({ tokenSymbol, deployments: registryDeployments })

  const assetResult = await assetPromise
  const deployments = assetResult.ok ? assetResult.value?.deployments ?? [] : []
  return fetchTokenLiquidity({ tokenSymbol, deployments })
}

async function loadOraclePrice(tokenSymbol: string): Promise<{
  oraclePrice: TokenMarketPrice | null
  errors: SourceError[]
}> {
  try {
    const hermesId = await fetchPythHermesId(tokenSymbol)
    if (!hermesId) return { oraclePrice: null, errors: [] }
    const pythResult = await fetchPythPrice(hermesId)
    if (pythResult.price) return { oraclePrice: pythResult.price, errors: [] }
    if (pythResult.error && !/HTTP 401|unauthorized/i.test(pythResult.error))
      return {
        oraclePrice: null,
        errors: [{ source: "Pyth Hermes", message: pythResult.error }],
      }
    return { oraclePrice: null, errors: [] }
  } catch (error) {
    return {
      oraclePrice: null,
      errors: [
        {
          source: "xStocks oracles",
          message: sourceFailureMessage(error, "Oracle lookup failed"),
        },
      ],
    }
  }
}
