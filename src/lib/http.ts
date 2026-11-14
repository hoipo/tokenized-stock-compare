export const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

const FRAMEWORK_RENDER_ERROR =
  /server components render|omitted in production|digest property is included/i

export function sourceFailureMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback
  const withoutUrl = error.message.replace(/https?:\/\/\S+/gi, "").replace(/\s+/g, " ").trim()
  if (!withoutUrl || FRAMEWORK_RENDER_ERROR.test(withoutUrl)) return fallback
  if (withoutUrl.length > 180) return `${withoutUrl.slice(0, 177)}…`
  return withoutUrl
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message === "HTTP 404"
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.toLowerCase().includes("abort"))
  )
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const { timeoutMs = 12_000, ...rest } = init ?? {}
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": BROWSER_UA,
        ...(rest.headers || {}),
      },
    })

    if (response.status === 404) throw new Error("HTTP 404")
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    try {
      return (await response.json()) as T
    } catch (error) {
      if (isAbortError(error)) throw error
      throw new Error("response was not JSON")
    }
  } catch (error) {
    if (isAbortError(error)) throw new Error("timed out")
    throw error
  } finally {
    clearTimeout(timer)
  }
}

export async function settledValue<T>(
  promise: Promise<T>,
  fallback = "request failed",
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await promise }
  } catch (error) {
    return { ok: false, error: sourceFailureMessage(error, fallback) }
  }
}
