import { describe, expect, it } from "vitest"
import { buildCompareFaqItems, buildFaqPageJsonLd } from "@/lib/faq"

describe("compare FAQ", () => {
  it("builds ticker-specific questions", () => {
    const items = buildCompareFaqItems({
      underlyingSymbol: "TSLA",
      tokenSymbol: "TSLAx",
    })
    expect(items[0]?.q).toContain("TSLAx")
    expect(items[1]?.q).toContain("TSLA")
  })

  it("builds FAQPage JSON-LD", () => {
    const jsonLd = buildFaqPageJsonLd(
      buildCompareFaqItems({ underlyingSymbol: "AAPL", tokenSymbol: "AAPLx" }),
    )
    expect(jsonLd["@type"]).toBe("FAQPage")
    expect(jsonLd.mainEntity).toHaveLength(5)
    expect(jsonLd.mainEntity[0]).toMatchObject({
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer" },
    })
  })
})
