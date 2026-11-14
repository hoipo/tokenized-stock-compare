import { describe, expect, it } from "vitest"
import {
  pickRelatedEntries,
  selectPremiumBoardSymbols,
} from "@/lib/services/markets"
import type { RegistryEntry } from "@/lib/types"

function entry(underlying: string, token = `${underlying}x`): RegistryEntry {
  return {
    tokenSymbol: token,
    underlyingSymbol: underlying,
    name: `${underlying} token`,
    logo: null,
    isin: "",
    underlyingIsin: "",
    currency: "USD",
    exchangeName: "NASDAQ",
  }
}

describe("pickRelatedEntries", () => {
  it("prefers featured names and excludes the current ticker", () => {
    const related = pickRelatedEntries(
      [
        entry("TSLA"),
        entry("AAPL"),
        entry("ZZZZ"),
        entry("NVDA"),
        entry("MSFT"),
        entry("AMZN"),
        entry("META"),
        entry("GOOGL"),
        entry("SPY"),
        entry("AAAA"),
      ],
      "TSLA",
      5,
    )

    expect(related.map((item) => item.underlyingSymbol)).toEqual([
      "AAPL",
      "NVDA",
      "MSFT",
      "AMZN",
      "META",
    ])
    expect(related.every((item) => item.underlyingSymbol !== "TSLA")).toBe(true)
  })

  it("dedupes multiple tokens for the same underlying", () => {
    const related = pickRelatedEntries(
      [entry("AAPL"), entry("AAPL", "AAPLy"), entry("NVDA")],
      "TSLA",
      5,
    )
    expect(related.map((item) => item.underlyingSymbol)).toEqual(["AAPL", "NVDA"])
  })

  it("orders non-featured neighbors by alphabetical proximity", () => {
    const related = pickRelatedEntries(
      [entry("AAAA"), entry("MMMM"), entry("ZZZZ"), entry("NUDA")],
      "NVDA",
      3,
    )
    expect(related.map((item) => item.underlyingSymbol)).toEqual([
      "NUDA",
      "MMMM",
      "AAAA",
    ])
  })
})

describe("selectPremiumBoardSymbols", () => {
  it("puts featured tickers first then fills alphabetically", () => {
    const symbols = selectPremiumBoardSymbols(
      ["ZZZZ", "TSLA", "AAAA", "NVDA", "MSFT"],
      4,
    )
    expect(symbols).toEqual(["TSLA", "NVDA", "MSFT", "AAAA"])
  })
})
