import { cacheLife } from "next/cache"
import {
  PRICE_CACHE_EXPIRE_SECONDS,
  PRICE_CACHE_REVALIDATE_SECONDS,
  PRICE_CACHE_STALE_SECONDS,
  PYTH_HERMES_BASE,
} from "@/lib/constants"
import { fetchJson, sourceFailureMessage } from "@/lib/http"
import type { TokenMarketPrice } from "@/lib/types"

interface HermesParsed {
  id?: string
  price?: {
    price?: string
    expo?: number
    publish_time?: number
  }
}

interface HermesResponse {
  parsed?: HermesParsed[]
}

export async function fetchPythPrice(
  hermesId: string,
): Promise<{ price: TokenMarketPrice | null; error: string | null }> {
  "use cache"
  cacheLife({
    stale: PRICE_CACHE_STALE_SECONDS,
    revalidate: PRICE_CACHE_REVALIDATE_SECONDS,
    expire: PRICE_CACHE_EXPIRE_SECONDS,
  })

  try {
    const url = `${PYTH_HERMES_BASE}/updates/price/latest?ids%5B%5D=${encodeURIComponent(hermesId)}`
    const data = await fetchJson<HermesResponse>(url)
    const parsed = data.parsed?.[0]
    const priceRaw = parsed?.price?.price
    const expo = parsed?.price?.expo

    if (priceRaw == null || expo == null)
      return { price: null, error: "Pyth Hermes returned no price" }

    const value = Number(priceRaw) * 10 ** expo
    if (!Number.isFinite(value) || value <= 0)
      return { price: null, error: "Pyth Hermes price was not finite" }

    const asOf = parsed?.price?.publish_time
      ? new Date(parsed.price.publish_time * 1000).toISOString()
      : null

    return {
      price: {
        price: value,
        currency: "USD",
        asOf,
        source: "pyth",
        pairUrl: null,
        dexId: null,
        chainId: null,
      },
      error: null,
    }
  } catch (error) {
    return {
      price: null,
      error: sourceFailureMessage(error, "Pyth Hermes request failed"),
    }
  }
}
