export interface GuideSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface GuideLink {
  href: string
  label: string
}

export interface Guide {
  slug: string
  title: string
  description: string
  updated: string
  sections: GuideSection[]
  related: GuideLink[]
}

const GUIDES: Guide[] = [
  {
    slug: "what-is-a-tokenized-stock",
    title: "What is a tokenized stock?",
    description:
      "A plain-language definition of tokenized stocks, how they relate to listed shares, and what this site does and does not claim.",
    updated: "2026-11-14",
    sections: [
      {
        heading: "Short definition",
        paragraphs: [
          "A tokenized stock is a blockchain token designed to track the economic exposure of a listed share. Issuers typically describe custody, redemption, and eligibility in their own terms. Holding a token is not automatically the same as holding the listed share.",
        ],
      },
      {
        heading: "What usually differs from the listed share",
        paragraphs: [
          "Listed shares trade on regulated equity venues during exchange hours. Tokenized versions may trade on crypto venues with different hours, counterparties, settlement rules, and geographic restrictions.",
        ],
        bullets: [
          "Venue and market hours can diverge, especially on weekends.",
          "Custody and redemption rights depend on the issuer, not on this website.",
          "Eligibility can be limited by residency or regulation.",
        ],
      },
      {
        heading: "How Stock Token Compare uses the term",
        paragraphs: [
          "This site is unofficial and informational. It compares an observable listed share quote with an observable token market price, then shows premium or discount, trading-status flags, deployments, and DEX liquidity when those figures can be computed honestly.",
          "It does not custody assets, connect wallets, execute trades, or assess whether you are eligible to hold a token.",
        ],
      },
    ],
    related: [
      { href: "/compare/tsla", label: "TSLA vs TSLAx comparison" },
      { href: "/markets", label: "Browse all markets" },
      { href: "/about", label: "Methodology & data sources" },
    ],
  },
  {
    slug: "why-token-and-share-prices-diverge",
    title: "Why token and share prices diverge",
    description:
      "Why a tokenized ticker can trade above or below its listed share, especially on weekends and after hours.",
    updated: "2026-11-14",
    sections: [
      {
        heading: "Premium and discount are observations",
        paragraphs: [
          "On this site, premium % = (tokenPrice − sharePrice) / sharePrice when both legs are available in the same currency. A positive reading means the token mid is above the share quote; a negative reading means it is below.",
          "Those readings are observational. They are not a forecast, arb signal, or recommendation.",
        ],
      },
      {
        heading: "Common reasons prices disagree",
        paragraphs: [
          "Token and share markets are not the same venue. Liquidity, fees, inventory, bridging delays, oracle updates, and local demand can all create gaps.",
        ],
        bullets: [
          "Weekend and holiday gaps: equity closes while DEX pools may still quote.",
          "Thin pools: a mid can move quickly when depth is low.",
          "Different settlement and eligibility rules for primary-market flows.",
          "Source timing: a last equity close compared with a live DEX mid.",
        ],
      },
      {
        heading: "How to inspect a live example",
        paragraphs: [
          "Open a comparison page and check the as-of times, source labels, halt flags, and top-pool liquidity. If either price leg is missing, the page shows Unavailable instead of inventing a spread.",
        ],
      },
    ],
    related: [
      { href: "/markets/premiums", label: "Premium / discount leaders" },
      { href: "/compare/tsla", label: "TSLA vs TSLAx comparison" },
      {
        href: "/guides/how-to-read-premium-and-discount",
        label: "How to read premium and discount",
      },
    ],
  },
  {
    slug: "how-to-read-premium-and-discount",
    title: "How to read premium and discount on this site",
    description:
      "A field guide to the premium reading, source labels, Unavailable states, and liquidity context shown on comparison pages.",
    updated: "2026-11-14",
    sections: [
      {
        heading: "The formula",
        paragraphs: [
          "Premium % = (tokenPrice − sharePrice) / sharePrice. Currencies must match. If a leg is missing, non-finite, zero on the share side, or currency-mismatched, the UI shows Unavailable with a reason.",
        ],
      },
      {
        heading: "What to check before trusting a reading",
        paragraphs: [
          "A useful check is not only the percentage. Look at when each leg was observed and which source produced it.",
        ],
        bullets: [
          "Share quote source and as-of time (Yahoo, Nasdaq, or CNBC fallbacks).",
          "Token mid source and as-of time (usually Dexscreener for matched deployments).",
          "Halt / trading-period flags from the public registry feed.",
          "Top pool liquidity and the $1,000 depth context section.",
        ],
      },
      {
        heading: "What the depth section is not",
        paragraphs: [
          "The $1,000 figure compares that notional with reported pool depth. It is not a fee schedule, slippage model, or guaranteed execution cost. Issuer primary-market min/max notionals are shown as context only.",
        ],
      },
    ],
    related: [
      { href: "/compare/aapl", label: "AAPL vs AAPLx comparison" },
      { href: "/markets/premiums", label: "Premium / discount leaders" },
      { href: "/about", label: "Methodology & data sources" },
    ],
  },
  {
    slug: "tokenized-stock-vs-owning-the-share",
    title: "Tokenized stock vs owning the listed share",
    description:
      "Key practical differences between holding a listed share and holding a tokenized representation, including eligibility and custody caveats.",
    updated: "2026-11-14",
    sections: [
      {
        heading: "Different instruments, different rails",
        paragraphs: [
          "A listed share sits in a brokerage or custody account under equity-market rules. A tokenized representation sits on a blockchain address under issuer terms and crypto-venue rules. They may track similar price exposure and still differ on rights, hours, and who can hold them.",
        ],
      },
      {
        heading: "Eligibility, custody, and redemption",
        paragraphs: [
          "Issuance, redemption, and sometimes secondary trading can be limited by residency and regulation. Custody arrangements and redemption mechanics are defined by the issuer, not by Stock Token Compare.",
          "Always read issuer disclosures. This site does not determine whether a product is available to you.",
        ],
      },
      {
        heading: "What this tool is for",
        paragraphs: [
          "Use comparison pages to inspect prices, premium or discount, deployments, and liquidity. Use the markets directory to browse the registry. Do not treat any page as investment advice or an offer to buy or sell securities.",
        ],
      },
    ],
    related: [
      { href: "/guides/what-is-a-tokenized-stock", label: "What is a tokenized stock?" },
      { href: "/markets", label: "Browse all markets" },
      { href: "/about", label: "Methodology & data sources" },
    ],
  },
]

export function listGuides(): Guide[] {
  return GUIDES.map((guide) => ({
    ...guide,
    sections: guide.sections.map((section) => ({
      ...section,
      paragraphs: [...section.paragraphs],
      bullets: section.bullets ? [...section.bullets] : undefined,
    })),
    related: guide.related.map((link) => ({ ...link })),
  }))
}

export function getGuide(slug: string): Guide | null {
  return listGuides().find((item) => item.slug === slug) ?? null
}

export function getGuideSlugs(): string[] {
  return GUIDES.map((guide) => guide.slug)
}
