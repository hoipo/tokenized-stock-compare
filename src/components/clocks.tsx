"use client"

import { useEffect, useState } from "react"

function formatClock(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
      timeZoneName: "short",
    }).format(date)
  } catch {
    return date.toISOString()
  }
}

export function DualClocks({
  exchangeTimezone,
  exchangeLabel,
  nextChangeAt,
}: {
  exchangeTimezone: string | null
  exchangeLabel: string | null
  nextChangeAt: string | null
}) {
  const [now, setNow] = useState<Date | null>(null)
  const exchangeTz = exchangeTimezone || "America/New_York"

  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  let nextChange: string | null = null
  if (nextChangeAt) {
    try {
      nextChange = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: exchangeTz,
        timeZoneName: "short",
      }).format(new Date(nextChangeAt))
    } catch {
      nextChange = nextChangeAt
    }
  }

  return (
    <div className="grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
      <p>
        <span className="font-medium text-[var(--ink)]">
          {exchangeLabel || "Exchange"} clock:
        </span>{" "}
        {now ? formatClock(now, exchangeTz) : "—"}
      </p>
      <p>
        <span className="font-medium text-[var(--ink)]">Hong Kong clock:</span>{" "}
        {now ? formatClock(now, "Asia/Hong_Kong") : "—"}
      </p>
      {nextChange ? (
        <p className="sm:col-span-2">
          <span className="font-medium text-[var(--ink)]">Next period change:</span>{" "}
          {nextChange}
        </p>
      ) : null}
    </div>
  )
}
