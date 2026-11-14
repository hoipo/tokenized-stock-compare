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
            <strong className="text-[var(--ink)]">Yahoo Finance chart API</strong> —
            underlying share last / regular market price. May reflect prior close when
            markets are shut.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Dexscreener</strong> — token market mid
            and pool liquidity for pairs whose base/quote mint matches a known
            deployment address. Thin or unrelated pairs are ignored.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Pyth Hermes</strong> — optional fallback
            when a hermesId is published and the endpoint responds.
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
          Server-side fetches are cached for roughly 60–120 seconds. Browser clients do
          not call issuer, Yahoo, or Dexscreener APIs on every keystroke; search
          autocomplete uses this site&apos;s route handlers against the cached registry.
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
