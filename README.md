# Stock Token Compare

Independent informational tool that compares a listed share with its tokenized version(s): prices, premium/discount, trading hours / halt status, deployments, and DEX liquidity.

**Not investment advice. Not an offer to buy or sell securities. Unofficial and unaffiliated with Backed, xStocks, Nasdaq, or any issuer.**

## Stack

- Next.js App Router (TypeScript)
- Tailwind CSS
- pnpm
- Vitest for unit tests

No API keys are required for the MVP.

## Setup

```bash
pnpm install
pnpm dev
```

App defaults to http://localhost:3000.

Optional environment overrides: copy `.env.example` to `.env.local`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server on port 3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm test` | Run unit tests (ticker + premium math) |
| `pnpm lint` | ESLint |

## Data sources

| Source | Use |
| --- | --- |
| xStocks public API (`/api/v2/public/assets`) | Registry, deployments, trading hours, halt status, oracles |
| Yahoo Finance, Nasdaq, or CNBC | Underlying share last / regular market price (Yahoo first, then fallbacks) |
| Dexscreener | Token mid and pool liquidity for deployment-matched pairs |
| Pyth Hermes | Optional oracle mid when a hermesId is available |

Server-side fetches are cached (~90s). The browser does not call issuer/Yahoo/Dexscreener on every keystroke.

## Product rules

- English UI
- No wallet, swap, buy CTA, or brokerage-style referral deep links
- Show **Unavailable** with a reason when a number cannot be computed honestly
- Prominent disclaimer on every page footer

## Local git

This project initializes a local git repository. Do not add a GitHub remote unless you intend to publish.

## License

Informational project. Verify all figures against primary sources.
