import { SHARE_FALLBACK_DELAY_MS, SHARE_FALLBACK_GRACE_MS } from "@/lib/constants"
import { sourceFailureMessage } from "@/lib/http"
import type { SharePrice } from "@/lib/types"

interface SettledPrice {
  ok: boolean
  price?: SharePrice
  error?: string
}

export async function raceShareSources(params: {
  startYahoo: () => Promise<SharePrice>
  startNasdaq: () => Promise<SharePrice>
  startCnbc: () => Promise<SharePrice>
  fallbackDelayMs?: number
  graceMs?: number
  sleep?: (ms: number) => Promise<void>
}): Promise<{ price: SharePrice | null; error: string | null }> {
  const fallbackDelayMs = params.fallbackDelayMs ?? SHARE_FALLBACK_DELAY_MS
  const graceMs = params.graceMs ?? SHARE_FALLBACK_GRACE_MS
  const sleep = params.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))

  const yahoo = settle(params.startYahoo())
  let nasdaq: Promise<SettledPrice> | null = null
  let cnbc: Promise<SettledPrice> | null = null
  let fallbacksStarted = false

  function startFallbacks() {
    if (fallbacksStarted) return
    fallbacksStarted = true
    nasdaq = settle(params.startNasdaq())
    cnbc = settle(params.startCnbc())
  }

  const first = await Promise.race([
    yahoo.then((result) => ({ kind: "yahoo" as const, result })),
    sleep(fallbackDelayMs).then(() => ({ kind: "delay" as const })),
  ])

  if (first.kind === "yahoo" && first.result.ok && first.result.price)
    return { price: first.result.price, error: null }

  startFallbacks()

  if (first.kind === "yahoo")
    return adoptFallback(first.result.error || "request failed", nasdaq, cnbc)

  const fallback = firstFallback(nasdaq, cnbc)
  const next = await Promise.race([
    yahoo.then((result) => ({ kind: "yahoo" as const, result })),
    fallback.then(
      (price) => ({ kind: "fallback" as const, price }),
      (error: unknown) => ({
        kind: "fallback-failed" as const,
        error: sourceFailureMessage(error, "fallbacks failed"),
      }),
    ),
  ])

  if (next.kind === "yahoo" && next.result.ok && next.result.price)
    return { price: next.result.price, error: null }

  if (next.kind === "yahoo")
    return adoptFallback(next.result.error || "request failed", nasdaq, cnbc)

  if (next.kind === "fallback-failed") {
    const yahooResult = await yahoo
    if (yahooResult.ok && yahooResult.price) return { price: yahooResult.price, error: null }
    return {
      price: null,
      error: `Yahoo Finance: ${yahooResult.error || "request failed"}; ${next.error}`,
    }
  }

  const grace = await Promise.race([yahoo, sleep(graceMs).then(() => null)])
  if (grace?.ok && grace.price) return { price: grace.price, error: null }
  return { price: next.price, error: null }
}

function settle(promise: Promise<SharePrice>): Promise<SettledPrice> {
  return promise.then(
    (price) => ({ ok: true, price }),
    (error: unknown) => ({ ok: false, error: sourceFailureMessage(error, "request failed") }),
  )
}

function firstFallback(
  nasdaq: Promise<SettledPrice> | null,
  cnbc: Promise<SettledPrice> | null,
): Promise<SharePrice> {
  const sources = [
    ["Nasdaq", nasdaq],
    ["CNBC", cnbc],
  ] as const

  return new Promise((resolve, reject) => {
    let settled = false
    let failures = 0
    const errors: string[] = []

    for (const [name, promise] of sources) {
      if (!promise) {
        failures += 1
        errors.push(`${name}: not started`)
        continue
      }
      void promise.then((result) => {
        if (settled) return
        if (result.ok && result.price) {
          settled = true
          resolve(result.price)
          return
        }
        failures += 1
        errors.push(`${name}: ${result.error || "request failed"}`)
        if (failures === sources.length) {
          settled = true
          reject(new Error(errors.join("; ")))
        }
      })
    }
  })
}

async function adoptFallback(
  yahooError: string,
  nasdaq: Promise<SettledPrice> | null,
  cnbc: Promise<SettledPrice> | null,
): Promise<{ price: SharePrice | null; error: string | null }> {
  try {
    const price = await firstFallback(nasdaq, cnbc)
    return { price, error: null }
  } catch (error) {
    const fallback = sourceFailureMessage(error, "fallbacks failed")
    return { price: null, error: `Yahoo Finance: ${yahooError}; ${fallback}` }
  }
}
