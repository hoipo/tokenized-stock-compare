import { cacheLife } from "next/cache"
import {
  DEXSCREENER_API_BASE,
  MIN_LIQUIDITY_USD,
  PRICE_CACHE_EXPIRE_SECONDS,
  PRICE_CACHE_REVALIDATE_SECONDS,
  PRICE_CACHE_STALE_SECONDS,
  UPSTREAM_TIMEOUT_MS,
} from "@/lib/constants"
import { selectRelevantPools, type DexPair } from "@/lib/dex-pools"
import { fetchJson, sourceFailureMessage } from "@/lib/http"
import type { Deployment, LiquidityPool, TokenMarketPrice } from "@/lib/types"

interface DexTokensResponse {
  pairs?: DexPair[] | null
}

const ADDRESS_CHUNK = 30

export async function fetchTokenLiquidity(params: {
  tokenSymbol: string
  deployments: Deployment[]
}): Promise<{
  pools: LiquidityPool[]
  tokenPrice: TokenMarketPrice | null
  error: string | null
}> {
  "use cache"
  cacheLife({
    stale: PRICE_CACHE_STALE_SECONDS,
    revalidate: PRICE_CACHE_REVALIDATE_SECONDS,
    expire: PRICE_CACHE_EXPIRE_SECONDS,
  })

  try {
    const addresses = uniqueAddresses(params.deployments)
    if (addresses.length === 0) return { pools: [], tokenPrice: null, error: null }

    const pairs = await fetchPairsByAddress(addresses)
    const pools = selectRelevantPools({
      pairs,
      deployments: params.deployments,
      minLiquidityUsd: MIN_LIQUIDITY_USD,
    })
    const best = pools[0]
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

    return { pools, tokenPrice, error: null }
  } catch (error) {
    return {
      pools: [],
      tokenPrice: null,
      error: sourceFailureMessage(error, "Dexscreener request failed"),
    }
  }
}

function uniqueAddresses(deployments: Deployment[]): string[] {
  const seen = new Set<string>()
  const addresses: string[] = []
  for (const deployment of deployments) {
    const address = deployment.address?.trim()
    if (!address) continue
    const key = address.startsWith("0x") || address.startsWith("0X") ? address.toLowerCase() : address
    if (seen.has(key)) continue
    seen.add(key)
    addresses.push(address)
  }
  return addresses
}

async function fetchPairsByAddress(addresses: string[]): Promise<DexPair[]> {
  const chunks: string[][] = []
  for (let index = 0; index < addresses.length; index += ADDRESS_CHUNK)
    chunks.push(addresses.slice(index, index + ADDRESS_CHUNK))

  const results = await Promise.allSettled(
    chunks.map((chunk) => {
      const path = chunk.map((address) => encodeURIComponent(address)).join(",")
      return fetchJson<DexTokensResponse>(`${DEXSCREENER_API_BASE}/tokens/${path}`, {
        timeoutMs: UPSTREAM_TIMEOUT_MS,
      })
    }),
  )

  const pairs: DexPair[] = []
  const errors: string[] = []
  for (const result of results) {
    if (result.status === "fulfilled") {
      pairs.push(...(result.value.pairs ?? []))
      continue
    }
    errors.push(sourceFailureMessage(result.reason, "Dexscreener request failed"))
  }
  if (pairs.length === 0 && errors.length > 0) throw new Error(errors[0])
  return pairs
}
