import { describe, expect, it } from "vitest"
import { describePoolDepth } from "@/lib/depth"
import type { LiquidityPool, TradingInfo } from "@/lib/types"

function pool(liquidityUsd: number): LiquidityPool {
  return {
    pairAddress: "pair",
    dexId: "raydium",
    chainId: "solana",
    baseTokenSymbol: "TSLAx",
    quoteTokenSymbol: "USDC",
    priceUsd: 100,
    liquidityUsd,
    volume24hUsd: 10,
    url: "https://dexscreener.com/solana/pair",
    baseTokenAddress: "mint",
  }
}

describe("describePoolDepth", () => {
  it("states the share of pool depth and does not invent a trading cost", () => {
    const result = describePoolDepth({
      pools: [pool(2_300_000)],
      trading: null,
    })
    expect(result.unavailableReason).toBeNull()
    expect(result.fractionOfPool).toBeCloseTo(1000 / 2_300_000)
    expect(result.reading).toContain("0.04%")
    expect(result.reading).toContain("not a trading cost")
  })

  it("still reports a thin pool as a percentage", () => {
    const result = describePoolDepth({ pools: [pool(10_000)], trading: null })
    expect(result.unavailableReason).toBeNull()
    expect(result.reading).toContain("10.00%")
  })

  it("stays unavailable without positive liquidity", () => {
    const result = describePoolDepth({ pools: [], trading: null })
    expect(result.fractionOfPool).toBeNull()
    expect(result.unavailableReason).toMatch(/positive USD liquidity/)
  })

  it("keeps the issuer minimum as context", () => {
    const trading = {
      limitsPerPeriod: { market: { minOrderFiatValue: 50 } },
    } as TradingInfo
    const result = describePoolDepth({ pools: [pool(1_000_000)], trading })
    expect(result.assumptions.some((item) => item.includes("$50"))).toBe(true)
  })
})
