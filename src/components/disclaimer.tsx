export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      className={`rounded-sm border border-[var(--line)] bg-[var(--wash)] text-[var(--muted)] ${
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
      }`}
      role="note"
    >
      <p>
        <strong className="font-medium text-[var(--ink)]">Disclaimer.</strong>{" "}
        Stock Token Compare is an independent informational tool. It is{" "}
        <strong className="font-medium text-[var(--ink)]">not investment advice</strong> and
        not an offer to buy or sell securities or tokens. Availability varies by
        jurisdiction. Data may be delayed or stale (especially on weekends). Prices
        can disagree across venues. This site is not affiliated with Backed, xStocks,
        Nasdaq, or any issuer or exchange.
      </p>
    </aside>
  )
}
