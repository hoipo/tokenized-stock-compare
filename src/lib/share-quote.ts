import type { SharePrice } from "@/lib/types"

export function listedSymbolCandidates(symbol: string): string[] {
  const raw = symbol.trim().toUpperCase()
  const variants = [raw]
  if (raw.includes("-")) variants.push(raw.replace(/-/g, "."))
  if (raw.includes(".")) variants.push(raw.replace(/\./g, "-"))
  return [...new Set(variants)]
}

export function parseMoney(value: string | number | null | undefined): number | null {
  if (typeof value === "number")
    return Number.isFinite(value) && value > 0 ? value : null
  if (value == null || value === "") return null
  const n = Number(String(value).replace(/[^0-9.+\-]/g, ""))
  return Number.isFinite(n) && n > 0 ? n : null
}

const ETF_UNDERLYINGS = new Set([
  "SPY",
  "QQQ",
  "IWM",
  "DIA",
  "VOO",
  "VTI",
  "EFA",
  "EEM",
  "GLD",
  "SLV",
  "TLT",
  "HYG",
  "LQD",
  "XLF",
  "XLK",
  "XLE",
  "ARKK",
])

export function quoteAssetClasses(symbol: string): Array<"stocks" | "etf"> {
  const upper = symbol.trim().toUpperCase()
  if (ETF_UNDERLYINGS.has(upper)) return ["etf", "stocks"]
  return ["stocks", "etf"]
}

export function shareSourceLabel(source: SharePrice["source"]): string {
  switch (source) {
    case "yahoo":
      return "Yahoo Finance"
    case "nasdaq":
      return "Nasdaq"
    case "cnbc":
      return "CNBC"
  }
}

/** Interpret a date-only US market timestamp as 16:00 America/New_York. */
export function closeAsOfInNewYork(year: number, month: number, day: number): string {
  const timeZone = "America/New_York"
  const hour = 16
  const minute = 0
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0)
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
  for (let i = 0; i < 3; i += 1) {
    const parts = Object.fromEntries(
      fmt.formatToParts(new Date(utc)).map((part) => [part.type, part.value]),
    )
    const got = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    )
    const wanted = Date.UTC(year, month - 1, day, hour, minute, 0)
    utc += wanted - got
  }
  return new Date(utc).toISOString()
}

export function parseLooseDate(text: string): { year: number; month: number; day: number } | null {
  const months: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  }
  const named = text.match(/([A-Za-z]{3,})\s+(\d{1,2}),\s*(\d{4})/)
  if (named) {
    const month = months[named[1].slice(0, 3).toLowerCase()]
    if (month) return { year: Number(named[3]), month, day: Number(named[2]) }
  }
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) }
  const us = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (us) {
    let year = Number(us[3])
    if (year < 100) year += 2000
    return { year, month: Number(us[1]), day: Number(us[2]) }
  }
  return null
}

export function asOfFromMarketDate(text: string | null | undefined): string | null {
  if (!text) return null
  const parsed = parseLooseDate(text)
  if (!parsed) return null
  return closeAsOfInNewYork(parsed.year, parsed.month, parsed.day)
}
