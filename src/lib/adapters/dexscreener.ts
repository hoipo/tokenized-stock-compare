import { cacheLife } from "next/cache"
import {
  CACHE_REVALIDATE_SECONDS,
  DEXSCREENER_API_BASE,
  MIN_LIQUIDITY_USD,
} from "@/lib/constants"
import { sanitizeDexscreenerUrl } from "@/lib/explorers"
import { fetchJson } from "@/lib/http"
import type { Deployment, LiquidityPool, TokenMarketPrice } from "@/lib/types"

interface DexPair {
  chainId?: string
  dexId?: string
  url?: string
  pairAddress?: string
  priceUsd?: string
  liquidity?: { usd?: number }
  volume?: { h24?: number }
  pairCreatedAt?: number
  baseToken?: { address?: string; symbol?: string }
  quoteToken?: { address?: string; symbol?: string }
}

interface DexSearchResponse {
  pairs?: DexPair[] | null
}

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase()
}

function deploymentAddresses(deployments: Deployment[]): Set<string> {
  return new Set(
    deployments
      .map((d) => d.address)
      .filter(Boolean)
      .map(normalizeAddress),
  )
}

function mapPool(pair: DexPair): LiquidityPool | null {
  if (!pair.pairAddress || !pair.chainId || !pair.dexId) return null
  const price = pair.priceUsd ? Number(pair.priceUsd) : null
  return {
    pairAddress: pair.pairAddress,
    dexId: pair.dexId,
    chainId: pair.chainId,
    baseTokenSymbol: pair.baseToken?.symbol || "?",
    quoteTokenSymbol: pair.quoteToken?.symbol || "?",
    priceUsd: price != null && Number.isFinite(price) ? price : null,
    liquidityUsd: pair.liquidity?.usd ?? null,
    volume24hUsd: pair.volume?.h24 ?? null,
    url: sanitizeDexscreenerUrl({ url: pair.url, chainId: pair.chainId, pairAddress: pair.pairAddress }),
    baseTokenAddress: pair.baseToken?.address || "",
  }
}

export async function fetchTokenLiquidity(params: {
  tokenSymbol: string
  deployments: Deployment[]
}): Promise<{
  pools: LiquidityPool[]
  tokenPrice: TokenMarketPrice | null
  error: string | null
}> {
  "use cache"
  cacheLife({ revalidate: CACHE_REVALIDATE_SECONDS, expire: 3600 })

  try {
    const { tokenSymbol, deployments } = params
    const known = deploymentAddresses(deployments)
    const data = await fetchJson<DexSearchResponse>(
      `${DEXSCREENER_API_BASE}/search?q=${encodeURIComponent(tokenSymbol)}`,
    )

    const pairs = data.pairs ?? []
    const relevant = pairs
      .filter((pair) => {
        const base = pair.baseToken?.address
        const quote = pair.quoteToken?.address
        if (!base && !quote) return false
        const baseMatch = base ? known.has(normalizeAddress(base)) : false
        const quoteMatch = quote ? known.has(normalizeAddress(quote)) : false
        return baseMatch || quoteMatch
      })
      .map(mapPool)
      .filter((pool): pool is LiquidityPool => pool != null)
      .filter((pool) => (pool.liquidityUsd ?? 0) >= MIN_LIQUIDITY_USD)
      .sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0))

    const preferred = relevant.filter((pool) =>
      known.has(normalizeAddress(pool.baseTokenAddress)),
    )
    const ranked = preferred.length > 0 ? preferred : relevant
    const top = ranked.slice(0, 8)
    const best = top[0]

    const tokenPrice: TokenMarketPrice | null =
      best?.priceUsd != null
        ? {
            price: best.priceUsd,
            currency: "USD",
            asOf: null,
            source: "dexscreener",
            pairUrl: best.url,
            dexId: best.dexId,
            chainId: best.chainId,
          }
        : null

    return { pools: top, tokenPrice, error: null }
  } catch (error) {
    return {
      pools: [],
      tokenPrice: null,
      error: error instanceof Error ? error.message : "Dexscreener request failed",
    }
  }
}
