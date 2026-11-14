import type { PremiumResult } from "@/lib/types"

export function computePremiumDiscount(params: {
  tokenPrice: number | null | undefined
  sharePrice: number | null | undefined
  tokenCurrency?: string | null
  shareCurrency?: string | null
}): PremiumResult {
  const { tokenPrice, sharePrice, tokenCurrency, shareCurrency } = params

  if (tokenPrice == null || !Number.isFinite(tokenPrice))
    return {
      percent: null,
      unavailableReason: "Token market price is unavailable.",
      reading: "Unavailable — token market price is missing.",
    }

  if (sharePrice == null || !Number.isFinite(sharePrice))
    return {
      percent: null,
      unavailableReason: "Share price is unavailable.",
      reading: "Unavailable — listed share price is missing.",
    }

  if (sharePrice === 0)
    return {
      percent: null,
      unavailableReason: "Share price is zero; premium cannot be computed.",
      reading: "Unavailable — share price is zero.",
    }

  const shareCcy = (shareCurrency || "").toUpperCase()
  const tokenCcy = (tokenCurrency || "").toUpperCase()
  if (!shareCcy || !tokenCcy || shareCcy !== tokenCcy)
    return {
      percent: null,
      unavailableReason: "Share and token currencies do not match.",
      reading: "Unavailable — currencies differ or are missing, so premium would be misleading.",
    }

  const percent = ((tokenPrice - sharePrice) / sharePrice) * 100
  const rounded = Math.round(percent * 100) / 100
  const abs = Math.abs(rounded).toFixed(2)

  if (rounded > 0)
    return {
      percent: rounded,
      unavailableReason: null,
      reading: `Token trading ${abs}% above the share`,
    }

  if (rounded < 0)
    return {
      percent: rounded,
      unavailableReason: null,
      reading: `Token trading ${abs}% below the share`,
    }

  return {
    percent: 0,
    unavailableReason: null,
    reading: "Token trading in line with the share",
  }
}
