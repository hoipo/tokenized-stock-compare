import type { Metadata } from "next"
import Link from "next/link"
import {
  formatCompactUsd,
  formatDateTime,
  formatPercentSigned,
  formatUsd,
} from "@/lib/format"
import { sourceFailureMessage } from "@/lib/http"
import { getPremiumBoard, type PremiumBoardRow } from "@/lib/services/markets"
import { comparePath } from "@/lib/ticker"

export const metadata: Metadata = {
  title: "Premium and discount leaders",
  description:
    "Ranked premium or discount of tokenized stocks versus listed share prices, with liquidity context.",
}

export default async function PremiumsPage() {
  let rows: PremiumBoardRow[] = []
  let fetchedAt: string | null = null
  let attempted = 0
  let complete = true
  let error: string | null = null

  try {
    const board = await getPremiumBoard()
    rows = board.rows
    fetchedAt = board.fetchedAt
    attempted = board.attempted
    complete = board.complete
  } catch (err) {
    error = sourceFailureMessage(err, "Premium board unavailable.")
  }

  const withPremium = rows.filter((row) => row.premiumPercent != null)
  const premiums = [...withPremium].sort(
    (a, b) => (b.premiumPercent ?? 0) - (a.premiumPercent ?? 0),
  )
  const discounts = [...withPremium].sort(
    (a, b) => (a.premiumPercent ?? 0) - (b.premiumPercent ?? 0),
  )

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          Snapshot board
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Premium & discount leaders
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          Featured and additional registry names ranked by observed token premium or
          discount versus the listed share. Weekend and after-hours readings may compare
          a last equity close with a live DEX mid.
        </p>
        <p className="text-xs text-[var(--muted)]">
          {fetchedAt
            ? `Snapshot ${formatDateTime(fetchedAt, "Asia/Hong_Kong")} · attempted ${attempted} symbols`
            : "Snapshot unavailable"}
          {!complete ? " · registry may be incomplete" : ""}
        </p>
        <p>
          <Link
            href="/markets"
            className="text-sm text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Browse full markets directory
          </Link>
        </p>
      </header>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      {!error && rows.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No premium rows available.</p>
      ) : null}

      {!error && rows.length > 0 ? (
        <div className="space-y-10">
          <LeaderTable
            title="Highest premiums"
            caption="Token trading furthest above the share"
            rows={premiums.slice(0, 8)}
          />
          <LeaderTable
            title="Deepest discounts"
            caption="Token trading furthest below the share"
            rows={discounts.slice(0, 8)}
          />
          <LeaderTable
            title="Full board"
            caption="All attempted symbols in this snapshot"
            rows={rows}
          />
        </div>
      ) : null}
    </div>
  )
}

function LeaderTable({
  title,
  caption,
  rows,
}: {
  title: string
  caption: string
  rows: PremiumBoardRow[]
}) {
  const headingId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-")

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div>
        <h2
          id={headingId}
          className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]"
        >
          {title}
        </h2>
        <p className="text-sm text-[var(--muted)]">{caption}</p>
      </div>
      <div className="overflow-x-auto border border-[var(--line)] bg-white/80">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">Pair</th>
              <th className="px-3 py-2 font-medium">Premium</th>
              <th className="px-3 py-2 font-medium">Share</th>
              <th className="px-3 py-2 font-medium">Token</th>
              <th className="px-3 py-2 font-medium">Top pool</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {rows.map((row) => {
              const href = comparePath(row.underlyingSymbol)
              return (
                <tr key={`${title}-${row.underlyingSymbol}`}>
                  <td className="px-3 py-3">
                    {href ? (
                      <Link
                        href={href}
                        className="font-medium text-[var(--ink)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                      >
                        {row.underlyingSymbol}
                        <span className="font-normal text-[var(--muted)]">
                          {" "}
                          vs {row.tokenSymbol}
                        </span>
                      </Link>
                    ) : (
                      <span>
                        {row.underlyingSymbol} vs {row.tokenSymbol}
                      </span>
                    )}
                    <span className="mt-1 block text-xs text-[var(--muted)]">{row.name}</span>
                  </td>
                  <td className="px-3 py-3 tabular-nums text-[var(--ink)]">
                    {formatPercentSigned(row.premiumPercent)}
                    <span className="mt-1 block text-xs text-[var(--muted)]">{row.reading}</span>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{formatUsd(row.sharePrice)}</td>
                  <td className="px-3 py-3 tabular-nums">{formatUsd(row.tokenPrice)}</td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatCompactUsd(row.topLiquidityUsd)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
