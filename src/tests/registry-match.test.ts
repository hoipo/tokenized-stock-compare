import { describe, expect, it } from "vitest"
import { indexAssets, resolveFromRegistry } from "@/lib/registry-match"
import type { XStockAsset } from "@/lib/types"

function asset(symbol: string, underlying: string): XStockAsset {
  return {
    id: symbol,
    name: `${underlying} token`,
    symbol,
    isin: "ISIN",
    underlyingSymbol: underlying,
    underlyingIsin: "UNDER",
    underlying: {
      symbol: underlying,
      isin: "UNDER",
      type: "stock",
      currency: "USD",
      exchange: null,
    },
    description: "",
    logo: null,
    isTradingHalted: false,
    allowedOperations: [],
    trading: {
      currency: "USD",
      tradingHoursMode: "regular",
      isTradingHalted: false,
      currentPeriod: "closed",
      openNow: false,
      nextChangeAt: null,
      exchange: null,
      limitsPerPeriod: {
        market: { minOrderFiatValue: 1, maxOrderFiatValue: 10 },
        extended: { minOrderFiatValue: 1, maxOrderFiatValue: 10 },
        overnight: { minOrderFiatValue: 1, maxOrderFiatValue: 10 },
        closed: { minOrderFiatValue: 1, maxOrderFiatValue: 10 },
      },
    },
    deployments: [],
  }
}

describe("resolveFromRegistry", () => {
  const registry = indexAssets(
    [asset("TSLAx", "TSLA"), asset("TSLA2x", "TSLA"), asset("AAPLx", "AAPL")],
    true,
  )

  it("resolves share and token spellings to the same underlying", () => {
    expect(resolveFromRegistry(registry, "tsla")?.tokenSymbol).toBe("TSLAx")
    expect(resolveFromRegistry(registry, "TSLAx")?.underlyingSymbol).toBe("TSLA")
    expect(resolveFromRegistry(registry, "$tslax")?.underlyingSymbol).toBe("TSLA")
  })

  it("prefers the token that matches the x suffix when several share an underlying", () => {
    expect(resolveFromRegistry(registry, "TSLA2x")?.tokenSymbol).toBe("TSLA2x")
  })

  it("returns null for an unknown ticker", () => {
    expect(resolveFromRegistry(registry, "ZZZZ")).toBeNull()
  })
})
