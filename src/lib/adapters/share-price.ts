import { cacheLife } from "next/cache"
import { CACHE_REVALIDATE_SECONDS, YAHOO_CHART_BASE } from "@/lib/constants"
import { BROWSER_UA } from "@/lib/http"
import {
  asOfFromMarketDate,
  listedSymbolCandidates,
  parseMoney,
} from "@/lib/share-quote"
import type { SharePrice } from "@/lib/types"

const NASDAQ_QUOTE_BASE = "https://api.nasdaq.com/api/quote"
const CNBC_QUOTE_URL =
  "https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol"

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string
        regularMarketPrice?: number
        currency?: string
        exchangeName?: string
        regularMarketTime?: number
        marketState?: string
      }
    }>
    error?: { description?: string } | null
  }
}

interface NasdaqQuoteResponse {
  status?: { rCode?: number; bCodeMessage?: Array<{ errorMessage?: string }> | null }
  data?: {
    symbol?: string
    exchange?: string
    marketStatus?: string | null
    primaryData?: {
      lastSalePrice?: string
      lastTradeTimestamp?: string
    } | null
  } | null
}

interface CnbcQuote {
  symbol?: string
  last?: string
  last_time?: string
  last_timedate?: string
  exchange?: string
  currencyCode?: string
  code?: number
  name?: string
}

interface CnbcResponse {
  FormattedQuoteResult?: { FormattedQuote?: CnbcQuote | CnbcQuote[] }
}

async function fetchText(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 10_000,
): Promise<{ ok: true; body: string } | { ok: false; error: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { headers, signal: controller.signal })
    const body = await response.text()
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` }
    return { ok: true, body }
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed"
    if (message.toLowerCase().includes("abort")) return { ok: false, error: "timed out" }
    return { ok: false, error: message }
  } finally {
    clearTimeout(timer)
  }
}

async function fetchYahoo(symbol: string): Promise<SharePrice> {
  const url = `${YAHOO_CHART_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=5d`
  const result = await fetchText(url, {
    Accept: "application/json",
    "User-Agent": BROWSER_UA,
    "Accept-Language": "en-US,en;q=0.9",
  })
  if (!result.ok) throw new Error(result.error)

  const data = JSON.parse(result.body) as YahooChartResponse
  const meta = data.chart?.result?.[0]?.meta
  if (!meta?.regularMarketPrice || !Number.isFinite(meta.regularMarketPrice))
    throw new Error(data.chart?.error?.description || "no regularMarketPrice")

  const asOf = meta.regularMarketTime
    ? new Date(meta.regularMarketTime * 1000).toISOString()
    : new Date().toISOString()

  return {
    symbol: meta.symbol || symbol,
    price: meta.regularMarketPrice,
    currency: meta.currency || "USD",
    exchangeName: meta.exchangeName || null,
    asOf,
    marketState: meta.marketState || null,
    source: "yahoo",
  }
}

async function fetchNasdaq(symbol: string): Promise<SharePrice> {
  const headers = {
    Accept: "application/json, text/plain, */*",
    "User-Agent": BROWSER_UA,
    "Accept-Language": "en-US,en;q=0.9",
    Origin: "https://www.nasdaq.com",
    Referer: "https://www.nasdaq.com/",
  }
  const errors: string[] = []

  for (const candidate of listedSymbolCandidates(symbol)) {
    for (const assetClass of ["stocks", "etf"] as const) {
      const url = `${NASDAQ_QUOTE_BASE}/${encodeURIComponent(candidate)}/info?assetclass=${assetClass}`
      const result = await fetchText(url, headers)
      if (!result.ok) {
        errors.push(`${candidate}/${assetClass}: ${result.error}`)
        continue
      }
      const data = JSON.parse(result.body) as NasdaqQuoteResponse
      const statusCode = data.status?.rCode
      if (statusCode && statusCode !== 200) {
        const msg = data.status?.bCodeMessage?.[0]?.errorMessage || `rCode ${statusCode}`
        errors.push(`${candidate}/${assetClass}: ${msg}`)
        continue
      }
      const price = parseMoney(data.data?.primaryData?.lastSalePrice)
      if (!price) {
        errors.push(`${candidate}/${assetClass}: no lastSalePrice`)
        continue
      }
      return {
        symbol: data.data?.symbol || candidate,
        price,
        currency: "USD",
        exchangeName: data.data?.exchange || null,
        asOf: asOfFromMarketDate(data.data?.primaryData?.lastTradeTimestamp),
        marketState: data.data?.marketStatus || null,
        source: "nasdaq",
      }
    }
  }

  throw new Error(errors[0] || "no quote")
}

async function fetchCnbc(symbol: string): Promise<SharePrice> {
  const headers = {
    Accept: "application/json",
    "User-Agent": BROWSER_UA,
    "Accept-Language": "en-US,en;q=0.9",
  }
  const errors: string[] = []

  for (const candidate of listedSymbolCandidates(symbol)) {
    const url = `${CNBC_QUOTE_URL}?symbols=${encodeURIComponent(candidate)}&requestMethod=itv&noform=1&partnerId=2&fundamentals=1&exthrs=1&output=json&events=1`
    const result = await fetchText(url, headers)
    if (!result.ok) {
      errors.push(`${candidate}: ${result.error}`)
      continue
    }
    const data = JSON.parse(result.body) as CnbcResponse
    const raw = data.FormattedQuoteResult?.FormattedQuote
    const quote = Array.isArray(raw) ? raw[0] : raw
    const price = parseMoney(quote?.last)
    if (!quote || quote.code !== 0 || !price) {
      errors.push(`${candidate}: no usable last price`)
      continue
    }
    return {
      symbol: quote.symbol || candidate,
      price,
      currency: quote.currencyCode || "USD",
      exchangeName: quote.exchange || null,
      asOf: asOfFromMarketDate(quote.last_time || quote.last_timedate),
      marketState: null,
      source: "cnbc",
    }
  }

  throw new Error(errors[0] || "no quote")
}

export async function fetchSharePrice(
  symbol: string,
): Promise<{ price: SharePrice | null; error: string | null }> {
  "use cache"
  cacheLife({ revalidate: CACHE_REVALIDATE_SECONDS, expire: 3600 })

  const attempts: Array<{ name: string; run: () => Promise<SharePrice> }> = [
    { name: "Yahoo Finance", run: () => fetchYahoo(symbol) },
    { name: "Nasdaq", run: () => fetchNasdaq(symbol) },
    { name: "CNBC", run: () => fetchCnbc(symbol) },
  ]
  const errors: string[] = []

  for (const attempt of attempts) {
    try {
      const price = await attempt.run()
      return { price, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : "request failed"
      errors.push(`${attempt.name}: ${message}`)
    }
  }

  return { price: null, error: errors.join("; ") }
}
