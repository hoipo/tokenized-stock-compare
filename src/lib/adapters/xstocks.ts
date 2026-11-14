import { cacheLife } from "next/cache"
import {
  PRICE_CACHE_EXPIRE_SECONDS,
  PRICE_CACHE_REVALIDATE_SECONDS,
  PRICE_CACHE_STALE_SECONDS,
  REGISTRY_CACHE_EXPIRE_SECONDS,
  REGISTRY_CACHE_REVALIDATE_SECONDS,
  REGISTRY_CACHE_STALE_SECONDS,
  XSTOCKS_API_BASE,
} from "@/lib/constants"
import { fetchJson, isNotFoundError, sourceFailureMessage } from "@/lib/http"
import type { HaltStatus, XStockAsset } from "@/lib/types"

interface AssetsPage {
  nodes: XStockAsset[]
  page: { currentPage: number; hasNextPage: boolean }
}

interface OraclesResponse {
  nodes: Array<{
    managedBy: string
    metadata?: { hermesId?: string }
  }>
}

const MAX_PAGES = 40

export async function fetchAllAssets(): Promise<{ assets: XStockAsset[]; complete: boolean }> {
  "use cache"
  const loaded = await loadAssetPages()
  if (loaded.complete) {
    cacheLife({
      stale: REGISTRY_CACHE_STALE_SECONDS,
      revalidate: REGISTRY_CACHE_REVALIDATE_SECONDS,
      expire: REGISTRY_CACHE_EXPIRE_SECONDS,
    })
  } else {
    cacheLife({ stale: 30, revalidate: 120, expire: 600 })
  }
  return loaded
}

async function loadAssetPages(): Promise<{ assets: XStockAsset[]; complete: boolean }> {
  const assets: XStockAsset[] = []
  let page = 1

  while (page <= MAX_PAGES) {
    let data: AssetsPage
    try {
      data = await loadPage(page)
    } catch (error) {
      if (assets.length === 0) throw error
      console.error(
        `xStocks registry page ${page} failed; returning the pages already loaded. ${sourceFailureMessage(error, "request failed")}`,
      )
      return { assets, complete: false }
    }
    assets.push(...(data.nodes ?? []))
    if (!data.page?.hasNextPage) return { assets, complete: true }
    page += 1
  }

  return { assets, complete: false }
}

async function loadPage(page: number): Promise<AssetsPage> {
  const url = `${XSTOCKS_API_BASE}/assets?page=${page}`
  try {
    return await fetchJson<AssetsPage>(url)
  } catch (first) {
    try {
      return await fetchJson<AssetsPage>(url)
    } catch {
      throw first
    }
  }
}

export async function fetchAsset(symbol: string): Promise<XStockAsset | null> {
  "use cache"
  cacheLife({
    stale: PRICE_CACHE_STALE_SECONDS,
    revalidate: PRICE_CACHE_REVALIDATE_SECONDS,
    expire: PRICE_CACHE_EXPIRE_SECONDS,
  })

  try {
    return await fetchJson<XStockAsset>(
      `${XSTOCKS_API_BASE}/assets/${encodeURIComponent(symbol)}`,
    )
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}

export async function fetchHaltStatus(symbol: string): Promise<HaltStatus> {
  "use cache"
  cacheLife({
    stale: PRICE_CACHE_STALE_SECONDS,
    revalidate: PRICE_CACHE_REVALIDATE_SECONDS,
    expire: PRICE_CACHE_EXPIRE_SECONDS,
  })

  return fetchJson<HaltStatus>(
    `${XSTOCKS_API_BASE}/system/status/${encodeURIComponent(symbol)}`,
  )
}

export async function fetchPythHermesId(symbol: string): Promise<string | null> {
  "use cache"
  cacheLife({
    stale: REGISTRY_CACHE_STALE_SECONDS,
    revalidate: REGISTRY_CACHE_REVALIDATE_SECONDS,
    expire: REGISTRY_CACHE_EXPIRE_SECONDS,
  })

  try {
    const data = await fetchJson<OraclesResponse>(
      `${XSTOCKS_API_BASE}/oracles/${encodeURIComponent(symbol)}`,
    )
    const pyth = data.nodes.find(
      (node) => node.managedBy === "Pyth" && node.metadata?.hermesId,
    )
    return pyth?.metadata?.hermesId ?? null
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}
