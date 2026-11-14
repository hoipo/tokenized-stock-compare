# Build Stock Token Compare (MVP)

You are implementing a complete, runnable web app in this workspace: `/Users/bobo/code/tokenized-stock-compare`.

Do the work end to end. Do not wait for a person, do not ask questions, and do not touch any other project under `/Users/bobo/code` (especially `/Users/bobo/code/UniStock`).

## Product

Independent informational tool. Display name: **Stock Token Compare**.

A user types a stock ticker (e.g. `TSLA`) or a token ticker (e.g. `TSLAx`) and sees a comparison of the listed share vs its tokenized version(s): prices, premium/discount, trading hours / halt status, deployments (chain + contract), and DEX liquidity where available.

Hard product rules:
- English UI first.
- No wallet, no swap, no "Buy" / trade execution, no referral deep-links that look like a brokerage or official issuer product.
- Not affiliated with Backed, xStocks, Nasdaq, or any issuer/company. Do not use an official wordmark in the header. A small issuer logo next to a token is OK only with a clear "unofficial" caption; prefer typography/tickers in the chrome.
- Prominent disclaimer: not investment advice, not an offer to buy or sell securities, availability varies by jurisdiction, data may be delayed or stale (especially on weekends), prices can disagree across venues.
- If a number cannot be computed honestly, show "Unavailable" and why. Never invent a premium, fee, or liquidity figure.

## Stack

- Next.js App Router (current stable), TypeScript, Tailwind CSS, App Router Route Handlers
- pnpm (this machine has pnpm 12.x and Node 24)
- No API keys required for MVP
- Dev server default port 3000
- Initialize a local git repo, but do not create a GitHub remote and do not push
- Add a solid README (install, `pnpm dev`, `pnpm build`, data sources, disclaimer)

## Verified APIs (checked 2026-11-14, weekend / market closed)

xStocks public API, no auth:
- List (paginated): `GET https://api.xstocks.fi/api/v2/public/assets` returns `{ nodes, page: { currentPage, hasNextPage } }`. You must paginate until `hasNextPage` is false. Inspect the actual page query param; do not guess blindly — try the API.
- One asset: `GET https://api.xstocks.fi/api/v2/public/assets/{symbol}` e.g. `TSLAx`
  Useful fields already present: `name`, `symbol`, `isin`, `underlyingSymbol`, `underlyingIsin`, `underlying.exchange`, `logo`, `isTradingHalted`, `allowedOperations`, `trading` (`tradingHoursMode`, `currentPeriod`, `openNow`, `nextChangeAt`, limits), `deployments[]` (`network`, `chainId`, `address`, `supportsAtomicSwaps`, `stablecoins`).
- Halt: `GET https://api.xstocks.fi/api/v2/public/system/status/{symbol}`
- `GET .../price-data` returned `{"quote":null}` today. Do **not** depend on it as the only price source.
- Oracles: `GET https://api.xstocks.fi/api/v2/public/oracles/{symbol}` includes Pyth `hermesId` (for TSLAx: `47a156470288850a440df3a6ce85a55917b813a19bb5b31128a33a986566a362`).

Price / liquidity fallbacks that worked today:
- Underlying: Yahoo chart API with a browser User-Agent, e.g. `https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=5d`. Today TSLA `regularMarketPrice` was `390.22` USD. Cache and handle failures.
- Token market price + liquidity: Dexscreener `https://api.dexscreener.com/latest/dex/search?q=TSLAx` (or token-address lookup). Today a Solana Raydium TSLAx pair was about `$388.63` with ~`$2.3M` liquidity. Prefer the most liquid **relevant** pair(s) whose base/quote token mint matches a known deployment address. Ignore thin or obviously unrelated pairs.
- Optional extra: Pyth Hermes when `hermesId` exists.

Server-side fetch + cache (60–120s revalidate). Never call issuer/Dexscreener/Yahoo directly from the browser on every keystroke.

## Pages and UX

1. `/` — search box with autocomplete from the cached registry; a few featured names if they exist in the registry (TSLA, AAPL, NVDA, MSFT, AMZN, META, GOOGL, SPY or nearest available). Short explanation of what the tool does. Disclaimer footer.
2. `/compare/[ticker]` — canonical comparison page. Accept `tsla`, `TSLA`, or `TSLAx` and resolve to the underlying. Show:
   - Share last price, currency, exchange, as-of time
   - Token mid/market price, source, as-of time
   - Premium/discount % = (tokenPrice - sharePrice) / sharePrice, with sign and a one-line reading ("token trading 0.4% below the share")
   - Trading hours / open-closed / next change, halt flags
   - Deployments table: network, contract address with copy, explorer link (Solscan / Etherscan / official explorer when obvious)
   - Liquidity: top pools by USD liquidity, 24h volume, DEX name; link to Dexscreener as a data source, not a "buy here" CTA
   - Cost section: if you can defensibly estimate a $1,000 notional round-trip from available data, show it and list assumptions; otherwise say liquidity is shown but a reliable round-trip cost is unavailable. Mention issuer primary-market min notionals from `trading.limitsPerPeriod` as context only, not as a user fee.
   - Short unique FAQ: what is a tokenized stock, how it differs from the listed share, why prices diverge, regional restrictions, this site is unofficial
3. `/token/[symbol]` can redirect or be a thin alias to the compare page.
4. `/about` — methodology, data sources, contact-less disclaimer.
5. `sitemap.xml` + `robots.txt` + good metadata/title/description on compare pages (e.g. "TSLA vs TSLAx: price, premium, and liquidity"). `generateStaticParams` for featured/popular tickers; other tickers on demand.

UI should look clean, calm, and serious — readable numbers, not a crypto casino. Mobile-usable. Asia/Hong_Kong can be shown as an additional clock label next to the exchange clock, because the owner is in Hong Kong; do not replace the exchange timezone.

## Engineering quality

- Normalize tickers carefully (`TSLA`, `tsla`, `TSLAx`, `tslax`).
- Unit-test the premium/discount math and ticker normalization.
- Typed API adapters; isolate Yahoo/Dexscreener/xStocks so one failure does not blank the page.
- If a source fails, show the rest of the data plus a source-error note.
- Accessibility: keyboard search, visible focus, sufficient contrast, copy buttons with labels.
- `.env.example` if any optional overrides exist; no secrets in the repo.
- `pnpm build` and `pnpm test` (or `pnpm exec vitest` / `tsx --test`) must pass when you finish.
- Delete leftover scaffold junk and this brief can stay or be moved to `docs/`.

## Done when

- `pnpm install` succeeded
- `pnpm build` succeeded
- Tests for premium math and ticker parse passed
- README explains how to run locally
- Searching TSLA or TSLAx on the built app would render a real comparison using live public data (it is a weekend; prices may be last close / DEX mid — label them correctly)
