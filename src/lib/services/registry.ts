import { cacheLife } from "next/cache"
import { fetchAllAssets, toRegistryEntries } from "@/lib/adapters/xstocks"
import { FEATURED_UNDERLYINGS, normalizeTicker } from "@/lib/ticker"
import type { RegistryEntry, XStockAsset } from "@/lib/types"
import { CACHE_REVALIDATE_SECONDS } from "@/lib/constants"

export interface AssetRegistry {
  entries: RegistryEntry[]
  byToken: Record<string, RegistryEntry>
  byUnderlying: Record<string, RegistryEntry[]>
  assetsByToken: Record<string, XStockAsset>
}

export async function getAssetRegistry(): Promise<AssetRegistry> {
  "use cache"
  cacheLife({ revalidate: CACHE_REVALIDATE_SECONDS, expire: 3600 })

  const assets = await fetchAllAssets()
  const entries = toRegistryEntries(assets)
  const byToken: Record<string, RegistryEntry> = {}
  const byUnderlying: Record<string, RegistryEntry[]> = {}
  const assetsByToken: Record<string, XStockAsset> = {}

  for (const asset of assets)
    assetsByToken[asset.symbol.toUpperCase()] = asset

  for (const entry of entries) {
    byToken[entry.tokenSymbol.toUpperCase()] = entry
    const key = entry.underlyingSymbol.toUpperCase()
    byUnderlying[key] = [...(byUnderlying[key] ?? []), entry]
  }

  return { entries, byToken, byUnderlying, assetsByToken }
}

export interface ResolvedTicker {
  underlyingSymbol: string
  tokenSymbol: string
  entry: RegistryEntry
  asset: XStockAsset | null
}

export async function resolveTicker(input: string): Promise<ResolvedTicker | null> {
  const normalized = normalizeTicker(input)
  if (!normalized.cleaned) return null

  const registry = await getAssetRegistry()
  const upper = normalized.upper
  const tokenKey = normalized.tokenCandidate.toUpperCase()
  const underlyingKey = normalized.underlyingCandidate.toUpperCase()

  const directToken = registry.byToken[upper] || registry.byToken[tokenKey]

  if (directToken) {
    return {
      underlyingSymbol: directToken.underlyingSymbol,
      tokenSymbol: directToken.tokenSymbol,
      entry: directToken,
      asset: registry.assetsByToken[directToken.tokenSymbol.toUpperCase()] ?? null,
    }
  }

  const underlyingMatches = registry.byUnderlying[underlyingKey]
  if (underlyingMatches && underlyingMatches.length > 0) {
    const preferred =
      underlyingMatches.find(
        (item) => item.tokenSymbol.toUpperCase() === tokenKey,
      ) || underlyingMatches[0]
    return {
      underlyingSymbol: preferred.underlyingSymbol,
      tokenSymbol: preferred.tokenSymbol,
      entry: preferred,
      asset: registry.assetsByToken[preferred.tokenSymbol.toUpperCase()] ?? null,
    }
  }

  return null
}

export async function searchRegistry(query: string, limit = 8): Promise<RegistryEntry[]> {
  const normalized = normalizeTicker(query)
  if (!normalized.cleaned) return []

  const registry = await getAssetRegistry()
  const q = normalized.upper
  const scored = registry.entries
    .map((entry) => {
      const token = entry.tokenSymbol.toUpperCase()
      const under = entry.underlyingSymbol.toUpperCase()
      const name = entry.name.toUpperCase()
      let score = 0
      if (token === q || under === q) score = 100
      else if (token.startsWith(q) || under.startsWith(q)) score = 80
      else if (token.includes(q) || under.includes(q)) score = 50
      else if (name.includes(q)) score = 20
      return { entry, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.tokenSymbol.localeCompare(b.entry.tokenSymbol))

  return scored.slice(0, limit).map((item) => item.entry)
}

export async function getFeaturedEntries(): Promise<RegistryEntry[]> {
  const registry = await getAssetRegistry()
  const featured: RegistryEntry[] = []

  for (const symbol of FEATURED_UNDERLYINGS) {
    const matches = registry.byUnderlying[symbol]
    if (matches && matches[0]) featured.push(matches[0])
  }

  return featured
}
