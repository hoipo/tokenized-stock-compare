import { cacheLife } from "next/cache"
import {
  PRICE_CACHE_EXPIRE_SECONDS,
  PRICE_CACHE_REVALIDATE_SECONDS,
  PRICE_CACHE_STALE_SECONDS,
  UPSTREAM_TIMEOUT_MS,
  YAHOO_CHART_BASE,
} from "@/lib/constants"
import { fetchJson } from "@/lib/http"
import { preferFirstSuccess } from "@/lib/prefer-first"
import { raceShareSources } from "@/lib/share-price-race"
import {
  asOfFromMarketDate,
  listedSymbolCandidates,
  parseMoney,
  quoteAssetClasses,
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

const quoteHeaders = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
}

async function fetchYahoo(symbol: string): Promise<SharePrice> {
  const url = `${YAHOO_CHART_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=5d`
  const data = await fetchJson<YahooChartResponse>(url, {
    timeoutMs: UPSTREAM_TIMEOUT_MS,
    headers: quoteHeaders,
  })
  const meta = data.chart?.result?.[0]?.meta
  if (!meta?.regularMarketPrice || !Number.isFinite(meta.regularMarketPrice))
    throw new Error(data.chart?.error?.description || "no regularMarketPrice")

  return {
    symbol: meta.symbol || symbol,
    price: meta.regularMarketPrice,
    currency: meta.currency || "USD",
    exchangeName: meta.exchangeName || null,
    asOf: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
    marketState: meta.marketState || null,
    source: "yahoo",
  }
}

async function fetchNasdaqQuote(
  candidate: string,
  assetClass: "stocks" | "etf",
): Promise<SharePrice> {
  const url = `${NASDAQ_QUOTE_BASE}/${encodeURIComponent(candidate)}/info?assetclass=${assetClass}`
  const data = await fetchJson<NasdaqQuoteResponse>(url, {
    timeoutMs: UPSTREAM_TIMEOUT_MS,
    headers: {
      ...quoteHeaders,
      Origin: "https://www.nasdaq.com",
      Referer: "https://www.nasdaq.com/",
    },
  })
  const statusCode = data.status?.rCode
  if (statusCode && statusCode !== 200) {
    const msg = data.status?.bCodeMessage?.[0]?.errorMessage || `rCode ${statusCode}`
    throw new Error(msg)
  }
  const price = parseMoney(data.data?.primaryData?.lastSalePrice)
  if (!price) throw new Error("no lastSalePrice")
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

async function fetchNasdaq(symbol: string): Promise<SharePrice> {
  const attempts = listedSymbolCandidates(symbol).flatMap((candidate) =>
    quoteAssetClasses(candidate).map((assetClass) => ({
      label: `${candidate}/${assetClass}`,
      run: () => fetchNasdaqQuote(candidate, assetClass),
    })),
  )
  return preferFirstSuccess(attempts)
}

async function fetchCnbcQuote(candidate: string): Promise<SharePrice> {
  const url = `${CNBC_QUOTE_URL}?symbols=${encodeURIComponent(candidate)}&requestMethod=itv&noform=1&partnerId=2&fundamentals=1&exthrs=1&output=json&events=1`
  const data = await fetchJson<CnbcResponse>(url, {
    timeoutMs: UPSTREAM_TIMEOUT_MS,
    headers: quoteHeaders,
  })
  const raw = data.FormattedQuoteResult?.FormattedQuote
  const quote = Array.isArray(raw) ? raw[0] : raw
  const price = parseMoney(quote?.last)
  if (!quote || quote.code !== 0 || !price) throw new Error("no usable last price")
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

async function fetchCnbc(symbol: string): Promise<SharePrice> {
  const attempts = listedSymbolCandidates(symbol).map((candidate) => ({
    label: candidate,
    run: () => fetchCnbcQuote(candidate),
  }))
  return preferFirstSuccess(attempts)
}

export async function fetchSharePrice(
  symbol: string,
): Promise<{ price: SharePrice | null; error: string | null }> {
  "use cache"
  cacheLife({
    stale: PRICE_CACHE_STALE_SECONDS,
    revalidate: PRICE_CACHE_REVALIDATE_SECONDS,
    expire: PRICE_CACHE_EXPIRE_SECONDS,
  })

  return raceShareSources({
    startYahoo: () => fetchYahoo(symbol),
    startNasdaq: () => fetchNasdaq(symbol),
    startCnbc: () => fetchCnbc(symbol),
  })
}
