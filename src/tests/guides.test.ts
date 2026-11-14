import { describe, expect, it } from "vitest"
import { getGuide, getGuideSlugs, listGuides } from "@/lib/guides"

describe("guides catalog", () => {
  it("lists unique slugs", () => {
    const slugs = getGuideSlugs()
    expect(slugs.length).toBeGreaterThanOrEqual(4)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it("returns a guide by slug with related links", () => {
    const guide = getGuide("what-is-a-tokenized-stock")
    expect(guide?.title).toMatch(/tokenized stock/i)
    expect(guide?.sections.length).toBeGreaterThan(0)
    expect(guide?.related.some((link) => link.href.startsWith("/"))).toBe(true)
  })

  it("returns null for unknown slugs", () => {
    expect(getGuide("missing-guide")).toBeNull()
  })

  it("does not mutate the catalog when listing", () => {
    const first = listGuides()
    first[0]!.title = "mutated"
    expect(listGuides()[0]?.title).not.toBe("mutated")
  })
})
