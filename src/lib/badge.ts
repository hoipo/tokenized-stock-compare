import { formatPercentSigned } from "@/lib/format"
import { buildComparison } from "@/lib/services/compare"
import { normalizeTicker } from "@/lib/ticker"

export interface BadgeSnapshot {
  underlyingSymbol: string
  tokenSymbol: string
  premiumLabel: string
  reading: string
  comparePath: string
  ok: boolean
}

export async function resolveBadgeSnapshot(ticker: string): Promise<BadgeSnapshot> {
  const normalized = normalizeTicker(ticker)
  const fallbackUnderlying = normalized.underlyingCandidate || ticker.toUpperCase()
  const fallbackToken = normalized.tokenCandidate || `${fallbackUnderlying}x`
  const fallbackPath = `/compare/${fallbackUnderlying.toLowerCase()}`

  try {
    const data = await buildComparison(normalized.cleaned || ticker)
    if (!data) {
      return {
        underlyingSymbol: fallbackUnderlying,
        tokenSymbol: fallbackToken,
        premiumLabel: "Unavailable",
        reading: "Ticker not found in registry",
        comparePath: fallbackPath,
        ok: false,
      }
    }

    return {
      underlyingSymbol: data.underlyingSymbol,
      tokenSymbol: data.tokenSymbol,
      premiumLabel: formatPercentSigned(data.premium.percent),
      reading: data.premium.reading,
      comparePath: `/compare/${data.underlyingSymbol.toLowerCase()}`,
      ok: true,
    }
  } catch {
    return {
      underlyingSymbol: fallbackUnderlying,
      tokenSymbol: fallbackToken,
      premiumLabel: "Unavailable",
      reading: "Comparison temporarily unavailable",
      comparePath: fallbackPath,
      ok: false,
    }
  }
}

export function buildBadgeImageSnippet(params: {
  siteUrl: string
  ticker: string
  underlyingSymbol: string
  tokenSymbol: string
}): string {
  const { siteUrl, ticker, underlyingSymbol, tokenSymbol } = params
  const slug = ticker.trim().toLowerCase() || underlyingSymbol.toLowerCase()
  const href = `${siteUrl}/compare/${underlyingSymbol.toLowerCase()}`
  const src = `${siteUrl}/api/badge/${slug}`
  return `<a href="${href}" rel="noopener noreferrer"><img src="${src}" alt="${underlyingSymbol} vs ${tokenSymbol} premium" width="480" height="120" /></a>`
}

export function buildBadgeIframeSnippet(params: {
  siteUrl: string
  ticker: string
}): string {
  const slug = params.ticker.trim().toLowerCase()
  return `<iframe src="${params.siteUrl}/embed/${slug}" title="Stock Token Compare badge" width="320" height="140" loading="lazy" style="border:0;overflow:hidden;border-radius:2px;max-width:100%"></iframe>`
}
