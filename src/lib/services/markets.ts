import { cacheLife } from "next/cache"
import {
  PRICE_CACHE_EXPIRE_SECONDS,
  PRICE_CACHE_REVALIDATE_SECONDS,
  PRICE_CACHE_STALE_SECONDS,
} from "@/lib/constants"
import { buildComparison } from "@/lib/services/compare"
import { getAssetRegistry } from "@/lib/services/registry"
import { FEATURED_UNDERLYINGS } from "@/lib/ticker"
import type { ComparisonData, RegistryEntry } from "@/lib/types"

export const PREMIUM_BOARD_LIMIT = 16

export interface MarketListItem {
  underlyingSymbol: string
  tokenSymbol: string
  name: string
  exchangeName: string | null
}

export interface PremiumBoardRow {
  underlyingSymbol: string
  tokenSymbol: string
  name: string
  premiumPercent: number | null
  reading: string
  sharePrice: number | null
  tokenPrice: number | null
  topLiquidityUsd: number | null
}

export interface PremiumBoard {
  rows: PremiumBoardRow[]
  fetchedAt: string
  attempted: number
  complete: boolean
}

export async function listMarketEntries(): Promise<{
  entries: MarketListItem[]
  complete: boolean
}> {
  const registry = await getAssetRegistry()
  const seen = new Set<string>()
  const entries: MarketListItem[] = []

  for (const entry of registry.entries) {
    const key = entry.underlyingSymbol.toUpperCase()
    if (seen.has(key)) continue
    seen.add(key)
    entries.push(toMarketItem(entry))
  }

  entries.sort((a, b) => a.underlyingSymbol.localeCompare(b.underlyingSymbol))
  return { entries, complete: registry.complete }
}

export async function getRelatedMarketEntries(
  underlyingSymbol: string,
  limit = 5,
): Promise<MarketListItem[]> {
  const registry = await getAssetRegistry()
  return pickRelatedEntries(registry.entries, underlyingSymbol, limit)
}

export function pickRelatedEntries(
  entries: RegistryEntry[],
  underlyingSymbol: string,
  limit = 5,
): MarketListItem[] {
  if (limit <= 0) return []

  const current = underlyingSymbol.toUpperCase()
  const unique = uniqueByUnderlying(entries).filter(
    (entry) => entry.underlyingSymbol.toUpperCase() !== current,
  )
  if (unique.length === 0) return []

  const featuredSet = new Set(FEATURED_UNDERLYINGS.map((symbol) => symbol.toUpperCase()))
  const featured = unique.filter((entry) =>
    featuredSet.has(entry.underlyingSymbol.toUpperCase()),
  )
  const rest = unique
    .filter((entry) => !featuredSet.has(entry.underlyingSymbol.toUpperCase()))
    .sort((a, b) => a.underlyingSymbol.localeCompare(b.underlyingSymbol))

  const near = [...rest].sort(
    (a, b) =>
      alphabeticalDistance(a.underlyingSymbol, current) -
      alphabeticalDistance(b.underlyingSymbol, current),
  )

  const picked: RegistryEntry[] = []
  const seen = new Set<string>()

  for (const entry of [...featured, ...near]) {
    const key = entry.underlyingSymbol.toUpperCase()
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(entry)
    if (picked.length >= limit) break
  }

  return picked.map(toMarketItem)
}

export function selectPremiumBoardSymbols(
  underlyings: string[],
  limit = PREMIUM_BOARD_LIMIT,
): string[] {
  const unique = [...new Set(underlyings.map((symbol) => symbol.toUpperCase()))]
  const featuredSet = new Set(FEATURED_UNDERLYINGS.map((symbol) => symbol.toUpperCase()))
  const featured = FEATURED_UNDERLYINGS.map((symbol) => symbol.toUpperCase()).filter((symbol) =>
    unique.includes(symbol),
  )
  const rest = unique
    .filter((symbol) => !featuredSet.has(symbol))
    .sort((a, b) => a.localeCompare(b))

  return [...featured, ...rest].slice(0, limit)
}

export async function getPremiumBoard(
  limit = PREMIUM_BOARD_LIMIT,
): Promise<PremiumBoard> {
  "use cache"
  cacheLife({
    stale: PRICE_CACHE_STALE_SECONDS,
    revalidate: PRICE_CACHE_REVALIDATE_SECONDS,
    expire: PRICE_CACHE_EXPIRE_SECONDS,
  })

  try {
    const registry = await getAssetRegistry()
    const underlyings = Object.keys(registry.byUnderlying)
    const symbols = selectPremiumBoardSymbols(underlyings, limit)

    const comparisons = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          return await buildComparison(symbol)
        } catch {
          return null
        }
      }),
    )

    const rows = comparisons
      .filter((row): row is ComparisonData => row != null)
      .map(toPremiumRow)
      .sort(comparePremiumRows)

    const fetchedAt =
      comparisons.find((row) => row != null)?.fetchedAt ?? new Date().toISOString()

    return {
      rows,
      fetchedAt,
      attempted: symbols.length,
      complete: registry.complete,
    }
  } catch {
    return {
      rows: [],
      fetchedAt: new Date().toISOString(),
      attempted: 0,
      complete: false,
    }
  }
}

function toPremiumRow(data: ComparisonData): PremiumBoardRow {
  return {
    underlyingSymbol: data.underlyingSymbol,
    tokenSymbol: data.tokenSymbol,
    name: data.tokenName,
    premiumPercent: data.premium.percent,
    reading: data.premium.reading,
    sharePrice: data.share?.price ?? null,
    tokenPrice: data.tokenPrice?.price ?? null,
    topLiquidityUsd: data.liquidity[0]?.liquidityUsd ?? null,
  }
}

function comparePremiumRows(a: PremiumBoardRow, b: PremiumBoardRow): number {
  if (a.premiumPercent == null && b.premiumPercent == null)
    return a.underlyingSymbol.localeCompare(b.underlyingSymbol)
  if (a.premiumPercent == null) return 1
  if (b.premiumPercent == null) return -1
  if (b.premiumPercent !== a.premiumPercent) return b.premiumPercent - a.premiumPercent
  return a.underlyingSymbol.localeCompare(b.underlyingSymbol)
}

function uniqueByUnderlying(entries: RegistryEntry[]): RegistryEntry[] {
  const seen = new Set<string>()
  const unique: RegistryEntry[] = []
  for (const entry of entries) {
    const key = entry.underlyingSymbol.toUpperCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(entry)
  }
  return unique
}

function alphabeticalDistance(symbol: string, pivot: string): number {
  const a = symbol.toUpperCase()
  const b = pivot.toUpperCase()
  const len = Math.max(a.length, b.length)
  let dist = 0
  for (let i = 0; i < len; i++)
    dist += Math.abs((a.charCodeAt(i) || 0) - (b.charCodeAt(i) || 0))
  return dist
}

function toMarketItem(entry: RegistryEntry): MarketListItem {
  return {
    underlyingSymbol: entry.underlyingSymbol,
    tokenSymbol: entry.tokenSymbol,
    name: entry.name,
    exchangeName: entry.exchangeName,
  }
}
