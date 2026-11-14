import type { Metadata } from "next"
import Link from "next/link"
import {
  buildBadgeIframeSnippet,
  buildBadgeImageSnippet,
} from "@/lib/badge"
import { SITE_NAME, SITE_URL } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Share & embed",
  description:
    "Embed Stock Token Compare premium badges, copy Product Hunt / Show HN blurbs, and follow a light posting cadence for X, Discord, and Chinese channels.",
}

const EXAMPLE_TICKER = "tsla"
const EXAMPLE_UNDERLYING = "TSLA"
const EXAMPLE_TOKEN = "TSLAx"

export default function SharePage() {
  const imageSnippet = buildBadgeImageSnippet({
    siteUrl: SITE_URL,
    ticker: EXAMPLE_TICKER,
    underlyingSymbol: EXAMPLE_UNDERLYING,
    tokenSymbol: EXAMPLE_TOKEN,
  })
  const iframeSnippet = buildBadgeIframeSnippet({
    siteUrl: SITE_URL,
    ticker: EXAMPLE_TICKER,
  })

  return (
    <div className="max-w-3xl space-y-10 text-[var(--muted)]">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.14em]">Distribution</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Share & embed
        </h1>
        <p className="text-lg">
          Drop a live premium badge on another site, or reuse the launch blurbs below.
          Badges stay informational — no wallet, swap, or buy buttons.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Image badge
        </h2>
        <p>
          Best default. Links back to the comparison page and refreshes with the public
          cache (~90s).
        </p>
        <div className="overflow-hidden border border-[var(--line)] bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/badge/${EXAMPLE_TICKER}`}
            alt={`${EXAMPLE_UNDERLYING} vs ${EXAMPLE_TOKEN} premium`}
            width={480}
            height={120}
          />
        </div>
        <CodeBlock value={imageSnippet} />
        <p className="text-sm">
          Swap <code>tsla</code> for any supported ticker. Preview:{" "}
          <Link
            href={`/api/badge/${EXAMPLE_TICKER}`}
            className="text-[var(--accent)] underline-offset-2 hover:underline"
          >
            /api/badge/{EXAMPLE_TICKER}
          </Link>
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Iframe badge
        </h2>
        <p>
          Use when you want a clickable HTML card. The embed route is framed intentionally
          and marked <code>noindex</code>.
        </p>
        <div className="overflow-hidden border border-[var(--line)] bg-white">
          <iframe
            src={`/embed/${EXAMPLE_TICKER}`}
            title={`${SITE_NAME} badge`}
            width={320}
            height={140}
            loading="lazy"
            className="max-w-full border-0"
          />
        </div>
        <CodeBlock value={iframeSnippet} />
      </section>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Posting cadence
        </h2>
        <p>
          Keep volume low and data-first. Every post should show a real snapshot, name
          sources, and stay unofficial — no buy/sell language.
        </p>

        <h3 className="font-medium text-[var(--ink)]">Launch week</h3>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>
            <strong className="text-[var(--ink)]">Day 0 (Tue or Wed PT)</strong> — Product
            Hunt launch with the blurb below. Pin {SITE_URL}/compare/tsla and{" "}
            {SITE_URL}/markets/premiums in the first hunter comment.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Day 0 evening</strong> — Show HN with the
            blurb below. Reply to technical questions with /about and /guides links.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Day 1</strong> — X thread: 1 screenshot of
            premiums board + 1 compare page OG image + one sentence on weekend caveats.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Day 2–3</strong> — Discord / Telegram crypto
            research rooms: short note + badge embed snippet from this page. Ask mods first
            if the channel bans links.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Day 4–5</strong> — Chinese-language posts
            (X / 即刻 / 小红书科技区均可): 同一截图，强调「非官方对照工具、非投资建议」。
          </li>
          <li>
            <strong className="text-[var(--ink)]">Day 6–7</strong> — Answer PH / HN comments;
            no new launch posts. Collect which ticker people ask about most.
          </li>
        </ol>

        <h3 className="font-medium text-[var(--ink)]">Ongoing weekly rhythm</h3>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>
            <strong className="text-[var(--ink)]">Monday (HK morning)</strong> — Post weekend
            gap reading: last equity close vs DEX mid, link /markets/premiums.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Wednesday</strong> — One featured ticker
            deep dive (TSLA / NVDA / AAPL rotation) with /compare/… screenshot.
          </li>
          <li>
            <strong className="text-[var(--ink)]">Friday</strong> — Share one guide link
            answering a recurring question; soft CTA to embed badge from /share.
          </li>
          <li>
            Cap at <strong className="text-[var(--ink)]">3 owned posts / week</strong> plus
            replies. Prefer answering others over broadcasting.
          </li>
        </ul>

        <h3 className="font-medium text-[var(--ink)]">X / Discord templates</h3>
        <CodeBlock
          value={`X — Monday premiums
Weekend snapshot: tokenized names vs last equity close.

Largest premiums / discounts (observational, unofficial):
${SITE_URL}/markets/premiums

Not investment advice. Sources labeled on-page.

—

X — Midweek ticker
${EXAMPLE_UNDERLYING} vs ${EXAMPLE_TOKEN}: listed share vs token mid, premium, hours, liquidity.
${SITE_URL}/compare/${EXAMPLE_TICKER}

—

Discord (short)
Built a read-only compare page for share vs tokenized tickers (no wallet/swap).
Example: ${SITE_URL}/compare/${EXAMPLE_TICKER}
Board: ${SITE_URL}/markets/premiums
Embed: ${SITE_URL}/share`}
        />

        <h3 className="font-medium text-[var(--ink)]">中文短帖模板</h3>
        <CodeBlock
          value={`周末对照：股票收盘价 vs 代币化版本盘口（非官方、非投资建议）
溢价/折价榜：${SITE_URL}/markets/premiums
单票示例：${SITE_URL}/compare/${EXAMPLE_TICKER}

说明：站点不接钱包、不下单；数字算不出来会显示 Unavailable。`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Product Hunt blurb
        </h2>
        <CodeBlock
          value={`${SITE_NAME} — independent share vs tokenized-stock comparisons

Tagline: Compare listed share prices with tokenized versions (premium, hours, liquidity)

Description:
Stock Token Compare is an unofficial informational tool. Type TSLA or TSLAx and see listed share price vs observed token market price, premium/discount, trading hours / halt flags, on-chain deployments, and DEX liquidity.

No wallet. No swap. No brokerage-style buy button. When a figure cannot be computed honestly, the page shows Unavailable and why.

Built for people who want a calm, source-labeled readout — not a trading terminal.`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Show HN blurb
        </h2>
        <CodeBlock
          value={`Show HN: Stock Token Compare – listed shares vs tokenized versions

I built a small Next.js tool that compares a listed equity quote with its tokenized counterpart (e.g. TSLA vs TSLAx): premium/discount, trading hours, deployments, and DEX liquidity.

Rules I kept: no wallet, no trade CTA, no invented numbers. Sources are public (xStocks registry, Yahoo/Nasdaq/CNBC fallbacks, Dexscreener). Weekend readings often compare last equity close with a live DEX mid and are labeled that way.

Live: ${SITE_URL}
Example: ${SITE_URL}/compare/tsla
Premium board: ${SITE_URL}/markets/premiums
Embed badges: ${SITE_URL}/share`}
        />
      </section>

      <section className="space-y-3 text-sm">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Also useful
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link href="/markets/premiums" className="text-[var(--accent)] underline-offset-2 hover:underline">
              Premium / discount leaders
            </Link>{" "}
            — weekly screenshot fodder for X / Discord
          </li>
          <li>
            <Link href="/guides" className="text-[var(--accent)] underline-offset-2 hover:underline">
              Guides
            </Link>{" "}
            — link in replies when people ask what tokenized stocks are
          </li>
          <li>
            <Link href="/about" className="text-[var(--accent)] underline-offset-2 hover:underline">
              Methodology
            </Link>{" "}
            — cite data sources when posting
          </li>
        </ul>
      </section>
    </div>
  )
}

function CodeBlock({ value }: { value: string }) {
  return (
    <pre className="overflow-x-auto rounded-sm border border-[var(--line)] bg-[var(--wash)] p-4 text-xs leading-relaxed text-[var(--ink)] whitespace-pre-wrap">
      <code>{value}</code>
    </pre>
  )
}
