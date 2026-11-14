import { describe, expect, it } from "vitest"
import { raceShareSources } from "@/lib/share-price-race"
import type { SharePrice } from "@/lib/types"

function quote(source: SharePrice["source"]): SharePrice {
  return {
    symbol: "TSLA",
    price: source === "yahoo" ? 10 : 11,
    currency: "USD",
    exchangeName: null,
    asOf: null,
    marketState: null,
    source,
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

describe("raceShareSources", () => {
  it("returns Yahoo without starting the other sources when Yahoo is fast", async () => {
    let fallbacks = 0
    const result = await raceShareSources({
      startYahoo: async () => quote("yahoo"),
      startNasdaq: async () => {
        fallbacks += 1
        return quote("nasdaq")
      },
      startCnbc: async () => {
        fallbacks += 1
        return quote("cnbc")
      },
      fallbackDelayMs: 40,
      graceMs: 20,
      sleep,
    })
    expect(result.price?.source).toBe("yahoo")
    expect(fallbacks).toBe(0)
  })

  it("uses a fallback when Yahoo does not answer, then prefers Yahoo if it arrives during the grace", async () => {
    const result = await raceShareSources({
      startYahoo: () => sleep(30).then(() => quote("yahoo")),
      startNasdaq: async () => quote("nasdaq"),
      startCnbc: async () => Promise.reject(new Error("no quote")),
      fallbackDelayMs: 10,
      graceMs: 50,
      sleep,
    })
    expect(result.price?.source).toBe("yahoo")
  })

  it("keeps the fallback when Yahoo stays pending past the grace", async () => {
    const result = await raceShareSources({
      startYahoo: () => new Promise<SharePrice>(() => undefined),
      startNasdaq: async () => quote("nasdaq"),
      startCnbc: async () => Promise.reject(new Error("no quote")),
      fallbackDelayMs: 10,
      graceMs: 20,
      sleep,
    })
    expect(result.price?.source).toBe("nasdaq")
  })

  it("names every failed source and omits URLs", async () => {
    const result = await raceShareSources({
      startYahoo: async () => Promise.reject(new Error("HTTP 429 for https://quotes.example/tsla")),
      startNasdaq: async () => Promise.reject(new Error("no quote")),
      startCnbc: async () => Promise.reject(new Error("timed out")),
      fallbackDelayMs: 5,
      graceMs: 5,
      sleep,
    })
    expect(result.price).toBeNull()
    expect(result.error).toContain("Yahoo Finance")
    expect(result.error).toContain("Nasdaq")
    expect(result.error).toContain("CNBC")
    expect(result.error).not.toContain("https://")
  })
})
