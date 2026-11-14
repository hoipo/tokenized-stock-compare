import type { LiquidityPool, RoundTripEstimate, TradingInfo } from "@/lib/types"

const NOTIONAL_USD = 1_000

/**
 * Only estimate when top-pool liquidity is large enough that a $1,000
 * round-trip is a small fraction of depth. Without pool fee / impact models
 * from the venue, we refuse to invent a cost figure.
 */
export function estimateRoundTripCost(params: {
  pools: LiquidityPool[]
  trading: TradingInfo | null
}): RoundTripEstimate {
  const { pools, trading } = params
  const top = pools[0]
  const assumptions: string[] = [
    `Notional size assumed: $${NOTIONAL_USD.toLocaleString("en-US")} USD round-trip.`,
    "Secondary-market DEX liquidity is observational only; this site does not execute trades.",
  ]

  if (trading?.limitsPerPeriod?.market?.minOrderFiatValue) {
    assumptions.push(
      `Issuer primary-market minimum notional (context only, not a user fee on this site): $${trading.limitsPerPeriod.market.minOrderFiatValue.toLocaleString("en-US")}.`,
    )
  }

  if (!top || top.liquidityUsd == null) {
    return {
      available: false,
      estimatedCostUsd: null,
      assumptions,
      unavailableReason:
        "Liquidity is shown where available, but a reliable round-trip cost cannot be derived without venue fee and impact models.",
    }
  }

  assumptions.push(
    `Largest observed relevant pool liquidity: $${Math.round(top.liquidityUsd).toLocaleString("en-US")} on ${top.dexId}.`,
  )

  const fraction = NOTIONAL_USD / top.liquidityUsd
  if (fraction > 0.02 || top.liquidityUsd < 250_000) {
    return {
      available: false,
      estimatedCostUsd: null,
      assumptions,
      unavailableReason:
        "Top-pool depth is too thin relative to a $1,000 notional (or below $250k) to defensibly estimate round-trip cost without inventing impact.",
    }
  }

  // Dexscreener does not expose a deterministic fee+impact curve we can defend.
  return {
    available: false,
    estimatedCostUsd: null,
    assumptions,
    unavailableReason:
      "Liquidity depth is shown, but pool fee tiers and expected price impact are not published in a form that supports an honest $1,000 round-trip cost estimate.",
  }
}
