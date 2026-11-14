import Link from "next/link"
import { SearchBox } from "@/components/search-box"
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants"
import { sourceFailureMessage } from "@/lib/http"
import { getFeaturedEntries } from "@/lib/services/registry"
import { comparePath } from "@/lib/ticker"
import type { RegistryEntry } from "@/lib/types"

export default async function HomePage() {
  let featured: RegistryEntry[] = []
  let registryIncomplete = false
  let featuredError: string | null = null

  try {
    const result = await getFeaturedEntries()
    featured = result.entries
    registryIncomplete = !result.complete
  } catch (error) {
    featuredError = sourceFailureMessage(error, "Featured registry unavailable.")
  }

  return (
    <div className="space-y-12">
      <section className="space-y-5 pt-4 sm:pt-8">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
          Independent · informational · unofficial
        </p>
        <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--ink)] sm:text-5xl">
          {SITE_NAME}
        </h1>
        <p className="max-w-2xl text-lg text-[var(--muted)]">{SITE_TAGLINE}</p>
        <div className="max-w-xl">
          <SearchBox autofocus />
        </div>
      </section>

      <section className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/markets"
          className="text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Browse all markets
        </Link>
        <Link
          href="/markets/premiums"
          className="text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Premium / discount leaders
        </Link>
        <Link
          href="/guides"
          className="text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Guides
        </Link>
        <Link
          href="/share"
          className="text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Share & embed
        </Link>
      </section>

      <section aria-labelledby="featured-heading" className="space-y-4">
        <h2
          id="featured-heading"
          className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]"
        >
          Featured comparisons
        </h2>
        {registryIncomplete ? (
          <p className="text-sm text-[var(--muted)]">
            The registry may be missing names because a later page failed to load. Search
            still covers the names that were retrieved.
          </p>
        ) : null}
        {featuredError ? (
          <p className="text-sm text-[var(--danger)]">
            Featured names unavailable: {featuredError}
          </p>
        ) : featured.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No featured tickers found in the current registry.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {featured.map((entry) => (
              <li key={entry.tokenSymbol}>
                <Link
                  href={comparePath(entry.underlyingSymbol) ?? "/"}
                  className="inline-flex items-center gap-2 rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--wash)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  <span className="font-medium">{entry.underlyingSymbol}</span>
                  <span className="text-[var(--muted)]">{entry.tokenSymbol}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="max-w-2xl space-y-3 text-sm leading-relaxed text-[var(--muted)]">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          What this tool does
        </h2>
        <p>
          Enter a listed ticker or its tokenized ticker to compare last share price,
          observed token market price, premium or discount, trading hours / halt
          flags, on-chain deployments, and DEX liquidity where a relevant pool can
          be identified.
        </p>
        <p>
          There is no wallet connection, no swap flow, and no brokerage-style buy
          button. If a figure cannot be computed honestly, the page shows
          Unavailable and explains why.
        </p>
      </section>
    </div>
  )
}
