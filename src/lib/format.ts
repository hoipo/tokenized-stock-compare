export function formatUsd(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "Unavailable"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "Unavailable"
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatPercentSigned(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "Unavailable"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

export function formatCompactUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "Unavailable"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function resolveTimeZone(timeZone?: string): string {
  const candidate = timeZone || "UTC"
  try {
    Intl.DateTimeFormat("en-US", { timeZone: candidate })
    return candidate
  } catch {
    return "UTC"
  }
}

export function formatDateTime(iso: string | null | undefined, timeZone?: string): string {
  if (!iso) return "Unavailable"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "Unavailable"

  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: resolveTimeZone(timeZone),
      timeZoneName: "short",
    }).format(date)
  } catch {
    return date.toISOString()
  }
}

export function shortenAddress(address: string, left = 6, right = 4): string {
  if (address.length <= left + right + 3) return address
  return `${address.slice(0, left)}…${address.slice(-right)}`
}
