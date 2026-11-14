import type { Metadata } from "next"
import { Disclaimer } from "@/components/disclaimer"
import { SITE_NAME } from "@/lib/constants"

export const metadata: Metadata = {
  title: "About & methodology",
  description: `How ${SITE_NAME} sources prices, liquidity, and trading status.`,
}

export default function AboutPage() {
  return (
    <article className="prose-like max-w-3xl space-y-6 text-[var(--muted)]">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
        About & methodology
      </h1>
      <p>
        {SITE_NAME} is an independent, unofficial informational site. It compares listed
        equity quotes with publicly observable tokenized-stock markets. It does not
        custody assets, connect wallets, execute trades, or solicit investments.
      </p>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Data sources
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-[var(--ink)]">xStocks public API</strong> — asset
            registry, deployments, trading hours, halt status, and optional oracle
            identifiers. Paginated via <code>?page=</code>.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Share quotes</strong> — Yahoo Finance
            when it responds quickly. Nasdaq and CNBC are requested together if Yahoo is
            slow or unavailable. Weekend and after-hours figures may reflect the prior
            regular-session close. A missing timestamp stays unlabeled.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Dexscreener</strong> — token market mid
            and pool liquidity looked up by deployment address. Only pairs whose base
            token matches a known deployment are kept. Thin pairs are ignored. A $1,000
            figure on the page is that notional divided by reported pool depth, not a
            fee or price-impact estimate.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Pyth Hermes</strong> — optional oracle
            reference only, and only when the public endpoint responds. It is not used
            for the premium calculation. A 401 means the feed currently requires
            credentials, so the page skips it.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Premium / discount
        </h2>
        <p>
          Premium % = (tokenPrice − sharePrice) / sharePrice. If either leg is missing
          or non-finite, the UI shows Unavailable with a reason. No invented spreads.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Caching
        </h2>
        <p>
          The asset list is cached for about 30 minutes. Share quotes, DEX pools, halt
          status, and each assembled comparison are cached for about 90 seconds. Search
          downloads that registry once and filters it in the browser, so keystrokes do
          not call issuer, Yahoo, or Dexscreener.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Contact
        </h2>
        <p>
          This build ships without a contact form or support channel. Treat all figures
          as observational and verify against primary sources before making decisions.
        </p>
      </section>

      <Disclaimer />
    </article>
  )
}
