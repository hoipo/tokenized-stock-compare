import { fetchAllAssets } from "@/lib/adapters/xstocks"
import {
  indexAssets,
  resolveFromRegistry,
  type AssetRegistry,
  type ResolvedTicker,
} from "@/lib/registry-match"
import { rankRegistryEntries } from "@/lib/registry-search"
import { FEATURED_UNDERLYINGS } from "@/lib/ticker"
import type { RegistryEntry } from "@/lib/types"

export type { AssetRegistry, ResolvedTicker }

export async function getAssetRegistry(): Promise<AssetRegistry> {
  const { assets, complete } = await fetchAllAssets()
  return indexAssets(assets, complete)
}

export async function resolveTicker(input: string): Promise<ResolvedTicker | null> {
  const registry = await getAssetRegistry()
  return resolveFromRegistry(registry, input)
}

export async function searchRegistry(query: string, limit = 8): Promise<RegistryEntry[]> {
  const registry = await getAssetRegistry()
  return rankRegistryEntries(registry.entries, query, limit)
}

export async function getFeaturedEntries(): Promise<{
  entries: RegistryEntry[]
  complete: boolean
}> {
  const registry = await getAssetRegistry()
  const entries = FEATURED_UNDERLYINGS.flatMap((symbol) => {
    const match = registry.byUnderlying[symbol]?.[0]
    return match ? [match] : []
  })
  return { entries, complete: registry.complete }
}
