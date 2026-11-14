import { describe, expect, it } from "vitest"
import { selectRelevantPools, type DexPair } from "@/lib/dex-pools"
import type { Deployment } from "@/lib/types"

function deployment(address: string, network: string): Deployment {
  return {
    address,
    network,
    chainId: null,
    supportsAtomicSwaps: false,
    stablecoins: [],
  }
}

function pair(overrides: DexPair): DexPair {
  return {
    chainId: "solana",
    dexId: "raydium",
    pairAddress: "pair-a",
    priceUsd: "10",
    liquidity: { usd: 50_000 },
    volume: { h24: 1_000 },
    baseToken: { address: "Mint111", symbol: "TSLAx" },
    quoteToken: { address: "Usdc111", symbol: "USDC" },
    ...overrides,
  }
}

describe("selectRelevantPools", () => {
  const deployments = [deployment("Mint111", "Solana"), deployment("0xAbC", "Ethereum")]

  it("keeps the most liquid pair whose base token is the deployment", () => {
    const pools = selectRelevantPools({
      pairs: [
        pair({ pairAddress: "thin", liquidity: { usd: 8_000 } }),
        pair({ pairAddress: "deep", liquidity: { usd: 80_000 }, priceUsd: "12.5" }),
      ],
      deployments,
      minLiquidityUsd: 5_000,
    })
    expect(pools.map((pool) => pool.pairAddress)).toEqual(["deep", "thin"])
    expect(pools[0]?.priceUsd).toBe(12.5)
  })

  it("drops quote-side matches, other chains, and thin pools", () => {
    const pools = selectRelevantPools({
      pairs: [
        pair({
          pairAddress: "quote-side",
          baseToken: { address: "Other", symbol: "USDC" },
          quoteToken: { address: "Mint111", symbol: "TSLAx" },
        }),
        pair({
          pairAddress: "wrong-chain",
          chainId: "ethereum",
          baseToken: { address: "Mint111", symbol: "TSLAx" },
        }),
        pair({ pairAddress: "thin", liquidity: { usd: 100 } }),
        pair({
          pairAddress: "evm",
          chainId: "ethereum",
          baseToken: { address: "0xabc", symbol: "TSLAx" },
        }),
      ],
      deployments,
      minLiquidityUsd: 5_000,
    })
    expect(pools.map((pool) => pool.pairAddress)).toEqual(["evm"])
  })

  it("does not lowercase Solana addresses into a match", () => {
    const pools = selectRelevantPools({
      pairs: [pair({ baseToken: { address: "mint111", symbol: "TSLAx" } })],
      deployments,
      minLiquidityUsd: 1,
    })
    expect(pools).toEqual([])
  })

  it("returns nothing when there are no deployments", () => {
    const pools = selectRelevantPools({
      pairs: [pair({})],
      deployments: [],
      minLiquidityUsd: 1,
    })
    expect(pools).toEqual([])
  })
})
