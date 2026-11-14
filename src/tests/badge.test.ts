import { describe, expect, it } from "vitest"
import { buildBadgeImageSnippet, buildBadgeIframeSnippet } from "@/lib/badge"

describe("badge snippets", () => {
  it("builds an image deep-link snippet", () => {
    const html = buildBadgeImageSnippet({
      siteUrl: "https://stockvs.top",
      ticker: "TSLA",
      underlyingSymbol: "TSLA",
      tokenSymbol: "TSLAx",
    })
    expect(html).toContain('href="https://stockvs.top/compare/tsla"')
    expect(html).toContain('src="https://stockvs.top/api/badge/tsla"')
    expect(html).toContain("TSLA vs TSLAx premium")
  })

  it("builds an iframe snippet", () => {
    const html = buildBadgeIframeSnippet({
      siteUrl: "https://stockvs.top",
      ticker: "AAPL",
    })
    expect(html).toContain('src="https://stockvs.top/embed/aapl"')
    expect(html).toContain("iframe")
  })
})
