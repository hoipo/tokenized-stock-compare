export interface NormalizedTicker {
  raw: string
  cleaned: string
  upper: string
  /** Underlying equity ticker candidate, e.g. TSLA */
  underlyingCandidate: string
  /** Token ticker candidate with trailing x, e.g. TSLAx */
  tokenCandidate: string
  looksLikeToken: boolean
}

/**
 * Normalize user input such as `tsla`, `TSLA`, `TSLAx`, `tslax`.
 * xStocks token symbols end with a lowercase `x` (e.g. TSLAx).
 */
export function normalizeTicker(input: string): NormalizedTicker {
  const raw = input ?? ""
  const cleaned = raw.trim().replace(/^\$/, "").replace(/\s+/g, "")
  const upper = cleaned.toUpperCase()

  if (!cleaned)
    return {
      raw,
      cleaned: "",
      upper: "",
      underlyingCandidate: "",
      tokenCandidate: "",
      looksLikeToken: false,
    }

  const endsWithX = /x$/i.test(cleaned) && cleaned.length > 1
  const underlyingCandidate = endsWithX ? upper.slice(0, -1) : upper
  const tokenCandidate = `${underlyingCandidate}x`
  const looksLikeToken = endsWithX

  return {
    raw,
    cleaned,
    upper,
    underlyingCandidate,
    tokenCandidate,
    looksLikeToken,
  }
}

export function isValidTickerShape(input: string): boolean {
  const { cleaned } = normalizeTicker(input)
  return /^[A-Za-z0-9.]{1,16}$/.test(cleaned)
}

export const FEATURED_UNDERLYINGS = [
  "TSLA",
  "AAPL",
  "NVDA",
  "MSFT",
  "AMZN",
  "META",
  "GOOGL",
  "SPY",
] as const
