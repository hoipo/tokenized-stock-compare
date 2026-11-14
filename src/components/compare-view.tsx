import Link from "next/link"
import { CopyButton } from "@/components/copy-button"
import { CompareFaq } from "@/components/compare-faq"
import { DualClocks } from "@/components/clocks"
import { getExplorerUrl } from "@/lib/explorers"
import {
  formatCompactUsd,
  formatDateTime,
  formatNumber,
  formatPercentSigned,
  formatUsd,
  shortenAddress,
} from "@/lib/format"
import type { MarketListItem } from "@/lib/services/markets"
import { shareSourceLabel } from "@/lib/share-quote"
import { comparePath } from "@/lib/ticker"
import type { ComparisonData } from "@/lib/types"

export function CompareView({
  data,
  initialNow,
  related = [],
}: {
  data: ComparisonData
  initialNow: string
  related?: MarketListItem[]
}) {
  const exchangeTz = data.trading?.exchange?.timezone || "America/New_York"
  const isHalted =
    data.halt?.isMarketTradingHalted ||
    data.halt?.isAtomicTradingHalted ||
    data.trading?.isTradingHalted ||
    false
  const haltLabel = isHalted
    ? "Trading halt indicated"
    : data.halt
      ? "No halt indicated"
      : data.trading
        ? "Halt endpoint unavailable; asset feed does not flag a halt"
        : "Unavailable"

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          Unofficial comparison
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
          {data.underlyingSymbol} vs {data.tokenSymbol}
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          {data.tokenName}. Listed share versus observed token market price, trading
          status, deployments, and DEX liquidity.
        </p>
        <p className="text-xs text-[var(--muted)]">
          Snapshot fetched {formatDateTime(data.fetchedAt, "Asia/Hong_Kong")}. Weekend
          and after-hours figures may reflect last equity close vs DEX mid.
        </p>
      </header>

      {data.sourceErrors.length > 0 ? (
        <div
          className="rounded-sm border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-medium">Some sources failed; remaining data is shown.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {data.sourceErrors.map((error) => (
              <li key={`${error.source}-${error.message}`}>
                {error.source}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <section
        aria-labelledby="prices-heading"
        className="grid gap-4 md:grid-cols-3"
      >
        <h2 id="prices-heading" className="sr-only">
          Prices and premium
        </h2>
        <Metric
          label={`${data.underlyingSymbol} share`}
          value={formatUsd(data.share?.price)}
          detail={shareDetail(data, exchangeTz)}
        />
        <Metric
          label={`${data.tokenSymbol} token`}
          value={formatUsd(data.tokenPrice?.price)}
          detail={
            data.tokenPrice
              ? `USD DEX mid · ${data.tokenPrice.source}${data.tokenPrice.dexId ? ` / ${data.tokenPrice.dexId}` : ""}${data.tokenPrice.asOf ? ` · as of ${formatDateTime(data.tokenPrice.asOf, "UTC")}` : " · as-of time unavailable from venue"}`
              : "Unavailable — no matching liquid DEX pair for known deployments."
          }
        />
        <Metric
          label="Premium / discount"
          value={formatPercentSigned(data.premium.percent)}
          detail={data.premium.reading}
          emphasize
        />
      </section>

      {data.oraclePrice ? (
        <p className="text-xs text-[var(--muted)]">
          Optional oracle reference (not used for premium): {formatUsd(data.oraclePrice.price)} via Pyth
          {data.oraclePrice.asOf ? ` · as of ${formatDateTime(data.oraclePrice.asOf, "UTC")}` : ""}.
        </p>
      ) : null}

      <section aria-labelledby="hours-heading" className="space-y-3">
        <h2 id="hours-heading" className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Trading hours & halt status
        </h2>
        <div className="grid gap-3 rounded-sm border border-[var(--line)] bg-white p-4 sm:grid-cols-2">
          <StatusRow
            label="Token period"
            value={data.trading?.currentPeriod ?? "Unavailable"}
          />
          <StatusRow
            label="Open now"
            value={
              data.trading
                ? data.trading.openNow
                  ? "Yes"
                  : "No"
                : "Unavailable"
            }
          />
          <StatusRow
            label="Hours mode"
            value={data.trading?.tradingHoursMode ?? "Unavailable"}
          />
          <StatusRow
            label="Halt flags"
            value={haltLabel}
          />
        </div>
        <DualClocks
          initialNow={initialNow}
          exchangeTimezone={exchangeTz}
          exchangeLabel={data.trading?.exchange?.abbreviation || data.trading?.exchange?.name || null}
          nextChangeAt={data.trading?.nextChangeAt ?? null}
        />
      </section>

      <section aria-labelledby="deployments-heading" className="space-y-3">
        <h2 id="deployments-heading" className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Deployments
        </h2>
        {data.deployments.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Unavailable — no deployment list returned.</p>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-[var(--line)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--wash)] text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Network</th>
                  <th className="px-3 py-2 font-medium">Contract</th>
                  <th className="px-3 py-2 font-medium">Explorer</th>
                  <th className="px-3 py-2 font-medium">Atomic swaps</th>
                </tr>
              </thead>
              <tbody>
                {data.deployments.map((deployment) => {
                  const explorer = getExplorerUrl(deployment.network, deployment.address)
                  return (
                    <tr key={`${deployment.network}-${deployment.address}`} className="border-t border-[var(--line)]">
                      <td className="px-3 py-2 text-[var(--ink)]">{deployment.network}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span title={deployment.address}>{shortenAddress(deployment.address, 8, 6)}</span>
                          <CopyButton value={deployment.address} label={`Copy ${deployment.network} contract address`} />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {explorer ? (
                          <a
                            href={explorer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                          >
                            Open explorer
                          </a>
                        ) : (
                          <span className="text-[var(--muted)]">Unavailable</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[var(--muted)]">
                        {deployment.supportsAtomicSwaps ? "Supported" : "Not indicated"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="liquidity-heading" className="space-y-3">
        <h2 id="liquidity-heading" className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          DEX liquidity
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Top pools matched to known deployment addresses. Links open Dexscreener as a
          data source — not a buy or trade call-to-action.
        </p>
        {data.liquidity.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Unavailable — no sufficiently liquid relevant pools matched deployment addresses.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-[var(--line)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--wash)] text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">DEX</th>
                  <th className="px-3 py-2 font-medium">Pair</th>
                  <th className="px-3 py-2 font-medium">Liquidity</th>
                  <th className="px-3 py-2 font-medium">24h volume</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {data.liquidity.map((pool) => (
                  <tr key={`${pool.chainId}-${pool.pairAddress}`} className="border-t border-[var(--line)]">
                    <td className="px-3 py-2 capitalize text-[var(--ink)]">
                      {pool.dexId}
                      <span className="ml-1 text-xs text-[var(--muted)]">{pool.chainId}</span>
                    </td>
                    <td className="px-3 py-2 text-[var(--muted)]">
                      {pool.baseTokenSymbol}/{pool.quoteTokenSymbol}
                    </td>
                    <td className="px-3 py-2">{formatCompactUsd(pool.liquidityUsd)}</td>
                    <td className="px-3 py-2">{formatCompactUsd(pool.volume24hUsd)}</td>
                    <td className="px-3 py-2">
                      <a
                        href={pool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                      >
                        Dexscreener data
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="depth-heading" className="space-y-3">
        <h2 id="depth-heading" className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Depth versus $1,000
        </h2>
        <div className="rounded-sm border border-[var(--line)] bg-white p-4 text-sm text-[var(--muted)]">
          <p className="text-[var(--ink)]">{data.depth.reading}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {data.depth.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {data.trading?.limitsPerPeriod?.market ? (
            <p className="mt-3">
              Issuer primary-market limits (context only): min{" "}
              {formatNumber(data.trading.limitsPerPeriod.market.minOrderFiatValue, 0)} / max{" "}
              {formatNumber(data.trading.limitsPerPeriod.market.maxOrderFiatValue, 0)}{" "}
              {data.trading.currency} during market period. These are not fees charged by
              this site.
            </p>
          ) : null}
        </div>
      </section>

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="space-y-3">
          <h2
            id="related-heading"
            className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]"
          >
            Related comparisons
          </h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((item) => {
              const href = comparePath(item.underlyingSymbol)
              if (!href) return null
              return (
                <li key={item.underlyingSymbol}>
                  <Link
                    href={href}
                    className="inline-flex items-center gap-2 rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--wash)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    <span className="font-medium">{item.underlyingSymbol}</span>
                    <span className="text-[var(--muted)]">{item.tokenSymbol}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <p>
            <Link
              href="/markets"
              className="text-sm text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Browse all markets
            </Link>
          </p>
        </section>
      ) : null}

      <CompareFaq
        underlyingSymbol={data.underlyingSymbol}
        tokenSymbol={data.tokenSymbol}
      />
    </div>
  )
}

function shareDetail(data: ComparisonData, exchangeTz: string): string {
  if (!data.share) return "Unavailable — share quote could not be loaded."
  const asOf = data.share.asOf
    ? `as of ${formatDateTime(data.share.asOf, exchangeTz)}`
    : "as-of time unavailable"
  const state = data.share.marketState ? ` · ${data.share.marketState}` : ""
  return `${data.share.currency} · ${data.share.exchangeName || "exchange"} · ${shareSourceLabel(data.share.source)} · ${asOf}${state}`
}

function Metric({
  label,
  value,
  detail,
  emphasize = false,
}: {
  label: string
  value: string
  detail: string
  emphasize?: boolean
}) {
  return (
    <div className="rounded-sm border border-[var(--line)] bg-white p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p
        className={`mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums ${
          emphasize ? "text-[var(--accent)]" : "text-[var(--ink)]"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{detail}</p>
    </div>
  )
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-medium text-[var(--ink)]">{label}:</span>{" "}
      <span className="text-[var(--muted)]">{value}</span>
    </p>
  )
}
