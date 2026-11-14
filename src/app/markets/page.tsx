import type { Metadata } from "next"
import Link from "next/link"
import { sourceFailureMessage } from "@/lib/http"
import { listMarketEntries } from "@/lib/services/markets"
import { comparePath } from "@/lib/ticker"

export const metadata: Metadata = {
  title: "All tokenized stock comparisons",
  description:
    "Browse every listed share and tokenized ticker in the public registry, then open a price, premium, and liquidity comparison.",
}

export default async function MarketsPage() {
  let entries: Awaited<ReturnType<typeof listMarketEntries>>["entries"] = []
  let complete = true
  let error: string | null = null

  try {
    const result = await listMarketEntries()
    entries = result.entries
    complete = result.complete
  } catch (err) {
    error = sourceFailureMessage(err, "Market registry unavailable.")
  }

  const groups = groupByLetter(entries)

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          Directory
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Markets
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          Every underlying share currently present in the cached xStocks public registry,
          linked to its comparison page.
        </p>
        <p>
          <Link
            href="/markets/premiums"
            className="text-sm text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            View premium / discount leaders
          </Link>
        </p>
      </header>

      {!complete ? (
        <p className="text-sm text-[var(--muted)]">
          The registry may be incomplete because a later page failed to load.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No market entries available.</p>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.letter} aria-labelledby={`letter-${group.letter}`} className="space-y-3">
              <h2
                id={`letter-${group.letter}`}
                className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]"
              >
                {group.letter}
              </h2>
              <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)] bg-white/70">
                {group.items.map((item) => {
                  const href = comparePath(item.underlyingSymbol)
                  if (!href) return null
                  return (
                    <li key={`${item.underlyingSymbol}-${item.tokenSymbol}`}>
                      <Link
                        href={href}
                        className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-3 text-sm hover:bg-[var(--wash)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                      >
                        <span>
                          <span className="font-medium text-[var(--ink)]">
                            {item.underlyingSymbol}
                          </span>
                          <span className="text-[var(--muted)]"> vs {item.tokenSymbol}</span>
                          <span className="mt-1 block text-xs text-[var(--muted)] sm:mt-0 sm:ml-3 sm:inline">
                            {item.name}
                          </span>
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          {item.exchangeName || "Exchange n/a"}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function groupByLetter(entries: Awaited<ReturnType<typeof listMarketEntries>>["entries"]) {
  const map = new Map<string, typeof entries>()
  for (const entry of entries) {
    const letter = entry.underlyingSymbol.slice(0, 1).toUpperCase() || "#"
    map.set(letter, [...(map.get(letter) ?? []), entry])
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, items]) => ({ letter, items }))
}
