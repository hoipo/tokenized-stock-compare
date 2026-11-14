import { describe, expect, it } from "vitest"
import {
  closeAsOfInNewYork,
  listedSymbolCandidates,
  parseMoney,
  shareSourceLabel,
} from "@/lib/share-quote"

describe("listedSymbolCandidates", () => {
  it("keeps a plain ticker", () => {
    expect(listedSymbolCandidates("googl")).toEqual(["GOOGL"])
  })

  it("adds dot and hyphen variants for class shares", () => {
    expect(listedSymbolCandidates("BRK-B")).toEqual(["BRK-B", "BRK.B"])
    expect(listedSymbolCandidates("BRK.B")).toEqual(["BRK.B", "BRK-B"])
  })
})

describe("parseMoney", () => {
  it("parses a Nasdaq-style last sale price", () => {
    expect(parseMoney("$1,295.77")).toBeCloseTo(1295.77)
  })

  it("returns null for empty or non-positive values", () => {
    expect(parseMoney("")).toBeNull()
    expect(parseMoney("N/A")).toBeNull()
    expect(parseMoney(0)).toBeNull()
  })
})

describe("share quote helpers", () => {
  it("labels sources for the UI", () => {
    expect(shareSourceLabel("nasdaq")).toBe("Nasdaq")
    expect(shareSourceLabel("cnbc")).toBe("CNBC")
  })

  it("treats a date-only Nasdaq stamp as 16:00 in New York", () => {
    expect(closeAsOfInNewYork(2026, 11, 13)).toBe("2026-11-13T21:00:00.000Z")
  })
})
