import { DEPTH_NOTIONAL_USD } from "@/lib/constants"
import type { DepthContext, LiquidityPool, TradingInfo } from "@/lib/types"

/**
 * Compare a fixed notional with the largest matched pool.
 * The result is visible depth, not a fee or price-impact estimate.
 */
export function describePoolDepth(params: {
  pools: LiquidityPool[]
  trading: TradingInfo | null
  notionalUsd?: number
}): DepthContext {
  const notionalUsd = params.notionalUsd ?? DEPTH_NOTIONAL_USD
  const notionalLabel = `$${notionalUsd.toLocaleString("en-US")}`
  const top = params.pools[0]
  const assumptions = [
    `Comparison notional: ${notionalLabel}. This site does not place orders.`,
    "The percentage is notional divided by reported pool liquidity. It is not a fee, spread, or price-impact estimate.",
  ]

  const minOrder = params.trading?.limitsPerPeriod?.market?.minOrderFiatValue
  if (minOrder)
    assumptions.push(
      `Issuer primary-market minimum notional (context only, not a fee on this site): $${minOrder.toLocaleString("en-US")}.`,
    )

  if (!top || top.liquidityUsd == null || top.liquidityUsd <= 0) {
    return {
      notionalUsd,
      topPoolLiquidityUsd: top?.liquidityUsd ?? null,
      fractionOfPool: null,
      reading: `Unavailable — no matched pool liquidity to compare with a ${notionalLabel} notional.`,
      assumptions,
      unavailableReason: "No matched pool reported a positive USD liquidity figure.",
    }
  }

  const fractionOfPool = notionalUsd / top.liquidityUsd
  const percentLabel = formatDepthPercent(fractionOfPool)
  const liquidityLabel = `$${Math.round(top.liquidityUsd).toLocaleString("en-US")}`
  assumptions.push(`Largest matched pool: ${liquidityLabel} on ${top.dexId} (${top.chainId}).`)

  return {
    notionalUsd,
    topPoolLiquidityUsd: top.liquidityUsd,
    fractionOfPool,
    reading: `A ${notionalLabel} notional is ${percentLabel} of the largest matched pool (${liquidityLabel} on ${top.dexId}). This compares size with visible depth and is not a trading cost.`,
    assumptions,
    unavailableReason: null,
  }
}

function formatDepthPercent(fraction: number): string {
  const percent = fraction * 100
  if (percent >= 0.01) return `${percent.toFixed(2)}%`
  if (percent >= 0.0001) return `${percent.toFixed(4)}%`
  return "<0.0001%"
}
