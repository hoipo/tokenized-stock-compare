import { cacheLife } from "next/cache"
import { CACHE_REVALIDATE_SECONDS, YAHOO_CHART_BASE } from "@/lib/constants"
import { BROWSER_UA } from "@/lib/http"
import type { SharePrice } from "@/lib/types"

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
        timezone?: string
      }
    }>
    error?: { description?: string } | null
  }
}

let yahooQueue: Promise<void> = Promise.resolve()

function enqueueYahoo<T>(task: () => Promise<T>): Promise<T> {
  const run = yahooQueue.then(task, task)
  yahooQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function fetchYahooOnce(symbol: string): Promise<SharePrice> {
  const url = `${YAHOO_CHART_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=5d`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12_000)

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": BROWSER_UA,
      },
      signal: controller.signal,
    })

    if (!response.ok)
      throw new Error(`HTTP ${response.status} for ${symbol}`)

    const data = (await response.json()) as YahooChartResponse
    const meta = data.chart?.result?.[0]?.meta

    if (!meta?.regularMarketPrice || !Number.isFinite(meta.regularMarketPrice))
      throw new Error(
        data.chart?.error?.description ||
          `Yahoo returned no regularMarketPrice for ${symbol}`,
      )

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
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchSharePrice(
  symbol: string,
): Promise<{ price: SharePrice | null; error: string | null }> {
  "use cache"
  cacheLife({ revalidate: CACHE_REVALIDATE_SECONDS, expire: 3600 })

  let lastError = "Yahoo request failed"
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const price = await enqueueYahoo(async () => {
        if (attempt > 0)
          await new Promise((resolve) => setTimeout(resolve, 600 * attempt))
        return fetchYahooOnce(symbol)
      })
      return { price, error: null }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Yahoo request failed"
      if (lastError.toLowerCase().includes("abort"))
        lastError = `Yahoo request timed out for ${symbol}`
    }
  }

  return { price: null, error: lastError }
}
