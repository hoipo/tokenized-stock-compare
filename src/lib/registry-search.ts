import { normalizeTicker } from "@/lib/ticker"
import type { RegistryEntry } from "@/lib/types"

export function rankRegistryEntries<T extends Pick<RegistryEntry, "tokenSymbol" | "underlyingSymbol" | "name">>(
  entries: T[],
  query: string,
  limit = 8,
): T[] {
  const normalized = normalizeTicker(query)
  if (!normalized.cleaned) return []

  const q = normalized.upper
  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, q) }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.entry.tokenSymbol.localeCompare(b.entry.tokenSymbol),
    )
    .slice(0, limit)
    .map((item) => item.entry)
}

function scoreEntry(
  entry: Pick<RegistryEntry, "tokenSymbol" | "underlyingSymbol" | "name">,
  query: string,
): number {
  const token = entry.tokenSymbol.toUpperCase()
  const under = entry.underlyingSymbol.toUpperCase()
  const name = entry.name.toUpperCase()
  if (token === query || under === query) return 100
  if (token.startsWith(query) || under.startsWith(query)) return 80
  if (token.includes(query) || under.includes(query)) return 50
  if (name.includes(query)) return 20
  return 0
}
