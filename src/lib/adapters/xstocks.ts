import { cacheLife } from "next/cache"
import { CACHE_REVALIDATE_SECONDS, XSTOCKS_API_BASE } from "@/lib/constants"
import { fetchJson } from "@/lib/http"
import type { HaltStatus, RegistryEntry, XStockAsset } from "@/lib/types"

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

export async function fetchAllAssets(): Promise<XStockAsset[]> {
  "use cache"
  cacheLife({ revalidate: CACHE_REVALIDATE_SECONDS, expire: 3600 })

  const assets: XStockAsset[] = []
  let page = 1
  const maxPages = 40

  while (page <= maxPages) {
    const data = await fetchJson<AssetsPage>(
      `${XSTOCKS_API_BASE}/assets?page=${page}`,
    )
    assets.push(...data.nodes)
    if (!data.page.hasNextPage) break
    page += 1
  }

  return assets
}

export async function fetchAsset(symbol: string): Promise<XStockAsset | null> {
  "use cache"
  cacheLife({ revalidate: CACHE_REVALIDATE_SECONDS, expire: 3600 })

  try {
    return await fetchJson<XStockAsset>(
      `${XSTOCKS_API_BASE}/assets/${encodeURIComponent(symbol)}`,
    )
  } catch {
    return null
  }
}

export async function fetchHaltStatus(symbol: string): Promise<HaltStatus | null> {
  "use cache"
  cacheLife({ revalidate: CACHE_REVALIDATE_SECONDS, expire: 3600 })

  try {
    return await fetchJson<HaltStatus>(
      `${XSTOCKS_API_BASE}/system/status/${encodeURIComponent(symbol)}`,
    )
  } catch {
    return null
  }
}

export async function fetchPythHermesId(symbol: string): Promise<string | null> {
  "use cache"
  cacheLife({ revalidate: 600, expire: 3600 })

  try {
    const data = await fetchJson<OraclesResponse>(
      `${XSTOCKS_API_BASE}/oracles/${encodeURIComponent(symbol)}`,
    )
    const pyth = data.nodes.find(
      (node) => node.managedBy === "Pyth" && node.metadata?.hermesId,
    )
    return pyth?.metadata?.hermesId ?? null
  } catch {
    return null
  }
}

export function toRegistryEntries(assets: XStockAsset[]): RegistryEntry[] {
  return assets.map((asset) => ({
    tokenSymbol: asset.symbol,
    underlyingSymbol: asset.underlyingSymbol,
    name: asset.name,
    logo: asset.logo,
    isin: asset.isin,
    underlyingIsin: asset.underlyingIsin,
    currency: asset.underlying?.currency ?? asset.trading?.currency ?? null,
    exchangeName:
      asset.underlying?.exchange?.name ??
      asset.trading?.exchange?.name ??
      null,
  }))
}
