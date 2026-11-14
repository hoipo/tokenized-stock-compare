import { normalizeTicker } from "@/lib/ticker"
import type { RegistryEntry, XStockAsset } from "@/lib/types"

export interface AssetRegistry {
  entries: RegistryEntry[]
  byToken: Record<string, RegistryEntry>
  byUnderlying: Record<string, RegistryEntry[]>
  assetsByToken: Record<string, XStockAsset>
  complete: boolean
}

export interface ResolvedTicker {
  underlyingSymbol: string
  tokenSymbol: string
  entry: RegistryEntry
  asset: XStockAsset | null
}

export function toRegistryEntries(assets: XStockAsset[]): RegistryEntry[] {
  return assets.map((asset) => ({
    tokenSymbol: asset.symbol,
    underlyingSymbol: asset.underlyingSymbol,
    name: asset.name,
    logo: asset.logo ?? null,
    isin: asset.isin,
    underlyingIsin: asset.underlyingIsin,
    currency: asset.underlying?.currency ?? asset.trading?.currency ?? null,
    exchangeName:
      asset.underlying?.exchange?.name ?? asset.trading?.exchange?.name ?? null,
  }))
}

export function indexAssets(assets: XStockAsset[], complete: boolean): AssetRegistry {
  const entries = toRegistryEntries(assets)
  const byToken: Record<string, RegistryEntry> = {}
  const byUnderlying: Record<string, RegistryEntry[]> = {}
  const assetsByToken: Record<string, XStockAsset> = {}

  for (const asset of assets) assetsByToken[asset.symbol.toUpperCase()] = asset

  for (const entry of entries) {
    byToken[entry.tokenSymbol.toUpperCase()] = entry
    const key = entry.underlyingSymbol.toUpperCase()
    byUnderlying[key] = [...(byUnderlying[key] ?? []), entry]
  }

  return { entries, byToken, byUnderlying, assetsByToken, complete }
}

export function resolveFromRegistry(
  registry: AssetRegistry,
  input: string,
): ResolvedTicker | null {
  const normalized = normalizeTicker(input)
  if (!normalized.cleaned) return null

  const upper = normalized.upper
  const tokenKey = normalized.tokenCandidate.toUpperCase()
  const underlyingKey = normalized.underlyingCandidate.toUpperCase()
  const directToken = registry.byToken[upper] || registry.byToken[tokenKey]

  if (directToken) return toResolved(registry, directToken)

  const underlyingMatches = registry.byUnderlying[underlyingKey]
  if (!underlyingMatches || underlyingMatches.length === 0) return null

  const preferred =
    underlyingMatches.find((item) => item.tokenSymbol.toUpperCase() === tokenKey) ||
    underlyingMatches[0]
  return toResolved(registry, preferred)
}

function toResolved(registry: AssetRegistry, entry: RegistryEntry): ResolvedTicker {
  return {
    underlyingSymbol: entry.underlyingSymbol,
    tokenSymbol: entry.tokenSymbol,
    entry,
    asset: registry.assetsByToken[entry.tokenSymbol.toUpperCase()] ?? null,
  }
}
