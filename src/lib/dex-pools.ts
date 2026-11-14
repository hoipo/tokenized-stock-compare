import { sanitizeDexscreenerUrl } from "@/lib/explorers"
import type { Deployment, LiquidityPool } from "@/lib/types"

export const DEX_CHAIN_BY_NETWORK: Record<string, string> = {
  Solana: "solana",
  Ethereum: "ethereum",
  Arbitrum: "arbitrum",
  Optimism: "optimism",
  Base: "base",
  Polygon: "polygon",
  BNB: "bsc",
  Avalanche: "avalanche",
  XLayer: "xlayer",
  Ink: "ink",
  HyperEVM: "hyperevm",
  Monad: "monad",
  Ton: "ton",
}

export interface DexPair {
  chainId?: string
  dexId?: string
  url?: string
  pairAddress?: string
  priceUsd?: string
  liquidity?: { usd?: number }
  volume?: { h24?: number }
  baseToken?: { address?: string; symbol?: string }
  quoteToken?: { address?: string; symbol?: string }
}

const POOL_LIMIT = 8

export function selectRelevantPools(params: {
  pairs: DexPair[]
  deployments: Deployment[]
  minLiquidityUsd: number
  limit?: number
}): LiquidityPool[] {
  const { pairs, deployments, minLiquidityUsd, limit = POOL_LIMIT } = params
  if (deployments.length === 0) return []

  const seen = new Set<string>()
  const pools: LiquidityPool[] = []

  for (const pair of pairs) {
    if (!pairMatchesDeployment(pair, deployments)) continue
    const pool = mapPool(pair)
    if (!pool) continue
    if ((pool.liquidityUsd ?? 0) < minLiquidityUsd) continue
    const key = `${pool.chainId}:${pool.pairAddress}`
    if (seen.has(key)) continue
    seen.add(key)
    pools.push(pool)
  }

  return [...pools]
    .sort(
      (a, b) =>
        (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0) ||
        a.pairAddress.localeCompare(b.pairAddress),
    )
    .slice(0, limit)
}

function pairMatchesDeployment(pair: DexPair, deployments: Deployment[]): boolean {
  const base = pair.baseToken?.address
  if (!base) return false
  const chain = pair.chainId?.trim().toLowerCase() ?? ""

  return deployments.some((deployment) => {
    if (!deployment.address) return false
    if (!sameAddress(base, deployment.address)) return false
    const expected = DEX_CHAIN_BY_NETWORK[deployment.network]
    if (!expected || !chain) return true
    return chain === expected
  })
}

function sameAddress(left: string, right: string): boolean {
  const a = left.trim()
  const b = right.trim()
  if (a.startsWith("0x") || a.startsWith("0X") || b.startsWith("0x") || b.startsWith("0X"))
    return a.toLowerCase() === b.toLowerCase()
  return a === b
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
    url: sanitizeDexscreenerUrl({
      url: pair.url,
      chainId: pair.chainId,
      pairAddress: pair.pairAddress,
    }),
    baseTokenAddress: pair.baseToken?.address || "",
  }
}
