import { describe, expect, it } from "vitest"
import { computePremiumDiscount } from "@/lib/premium"

describe("computePremiumDiscount", () => {
  it("computes a discount when token is below the share", () => {
    const result = computePremiumDiscount({
      tokenPrice: 388.63,
      sharePrice: 390.22,
      tokenCurrency: "USD",
      shareCurrency: "USD",
    })
    expect(result.percent).toBeCloseTo(-0.41, 2)
    expect(result.unavailableReason).toBeNull()
    expect(result.reading).toContain("below the share")
  })

  it("computes a premium when token is above the share", () => {
    const result = computePremiumDiscount({
      tokenPrice: 102,
      sharePrice: 100,
      tokenCurrency: "USD",
      shareCurrency: "USD",
    })
    expect(result.percent).toBe(2)
    expect(result.reading).toContain("above the share")
  })

  it("returns unavailable when share price is missing", () => {
    const result = computePremiumDiscount({
      tokenPrice: 10,
      sharePrice: null,
      tokenCurrency: "USD",
      shareCurrency: "USD",
    })
    expect(result.percent).toBeNull()
    expect(result.reading).toMatch(/Unavailable/i)
  })

  it("returns unavailable when token price is missing", () => {
    const result = computePremiumDiscount({
      tokenPrice: undefined,
      sharePrice: 10,
      tokenCurrency: "USD",
      shareCurrency: "USD",
    })
    expect(result.percent).toBeNull()
    expect(result.unavailableReason).toMatch(/Token market price/i)
  })

  it("returns unavailable when share price is zero", () => {
    const result = computePremiumDiscount({
      tokenPrice: 10,
      sharePrice: 0,
      tokenCurrency: "USD",
      shareCurrency: "USD",
    })
    expect(result.percent).toBeNull()
    expect(result.unavailableReason).toMatch(/zero/i)
  })

  it("reports in-line when prices match", () => {
    const result = computePremiumDiscount({
      tokenPrice: 50,
      sharePrice: 50,
      tokenCurrency: "USD",
      shareCurrency: "USD",
    })
    expect(result.percent).toBe(0)
    expect(result.reading).toMatch(/in line/i)
  })

  it("returns unavailable when currencies differ", () => {
    const result = computePremiumDiscount({
      tokenPrice: 100,
      sharePrice: 100,
      tokenCurrency: "USD",
      shareCurrency: "HKD",
    })
    expect(result.percent).toBeNull()
    expect(result.reading).toMatch(/Unavailable/i)
  })
})
