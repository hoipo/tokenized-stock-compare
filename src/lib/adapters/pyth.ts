import { cacheLife } from "next/cache"
import { CACHE_REVALIDATE_SECONDS, PYTH_HERMES_BASE } from "@/lib/constants"
import { fetchJson } from "@/lib/http"
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
  cacheLife({ revalidate: CACHE_REVALIDATE_SECONDS, expire: 3600 })

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
      : new Date().toISOString()

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
      error: error instanceof Error ? error.message : "Pyth Hermes request failed",
    }
  }
}
