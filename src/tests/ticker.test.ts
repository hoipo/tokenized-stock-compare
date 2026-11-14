import { describe, expect, it } from "vitest"
import { isValidTickerShape, normalizeTicker } from "@/lib/ticker"

describe("normalizeTicker", () => {
  it("normalizes bare equity tickers", () => {
    expect(normalizeTicker("tsla")).toMatchObject({
      cleaned: "tsla",
      upper: "TSLA",
      underlyingCandidate: "TSLA",
      tokenCandidate: "TSLAx",
      looksLikeToken: false,
    })
  })

  it("normalizes token tickers with trailing x", () => {
    expect(normalizeTicker("TSLAx")).toMatchObject({
      underlyingCandidate: "TSLA",
      tokenCandidate: "TSLAx",
      looksLikeToken: true,
    })
    expect(normalizeTicker("tslax")).toMatchObject({
      underlyingCandidate: "TSLA",
      tokenCandidate: "TSLAx",
      looksLikeToken: true,
    })
    expect(normalizeTicker("TSLAX")).toMatchObject({
      underlyingCandidate: "TSLA",
      tokenCandidate: "TSLAx",
      looksLikeToken: true,
    })
  })

  it("strips $ and whitespace", () => {
    expect(normalizeTicker("  $aapl ")).toMatchObject({
      cleaned: "aapl",
      underlyingCandidate: "AAPL",
      tokenCandidate: "AAPLx",
    })
  })

  it("handles empty input", () => {
    expect(normalizeTicker("")).toMatchObject({
      cleaned: "",
      underlyingCandidate: "",
      tokenCandidate: "",
    })
  })
})

describe("isValidTickerShape", () => {
  it("accepts common shapes", () => {
    expect(isValidTickerShape("TSLA")).toBe(true)
    expect(isValidTickerShape("BRK.B")).toBe(true)
    expect(isValidTickerShape("TSLAx")).toBe(true)
  })

  it("rejects empty or oversized input", () => {
    expect(isValidTickerShape("")).toBe(false)
    expect(isValidTickerShape("THISISWAYTOOLONGTICKER")).toBe(false)
  })
})
