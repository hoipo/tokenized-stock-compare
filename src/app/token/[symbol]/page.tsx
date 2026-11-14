import { Suspense } from "react"
import { permanentRedirect } from "next/navigation"
import { resolveTicker } from "@/lib/services/registry"
import { FEATURED_UNDERLYINGS, comparePath, normalizeTicker } from "@/lib/ticker"

interface PageProps {
  params: Promise<{ symbol: string }>
}

export async function generateStaticParams() {
  return FEATURED_UNDERLYINGS.flatMap((ticker) => [
    { symbol: ticker.toLowerCase() },
    { symbol: `${ticker.toLowerCase()}x` },
  ])
}

async function TokenRedirect({ params }: PageProps) {
  const { symbol } = await params
  const normalized = normalizeTicker(symbol)
  let target = normalized.underlyingCandidate || normalized.cleaned || symbol
  try {
    const resolved = await resolveTicker(symbol)
    if (resolved) target = resolved.underlyingSymbol
  } catch {
    // Fall back to the normalized ticker when the registry is unavailable.
  }
  const href = comparePath(target)
  if (!href) return null
  permanentRedirect(href)
  return null
}

export default function TokenAliasPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[var(--muted)]" role="status">
          Redirecting to comparison…
        </p>
      }
    >
      <TokenRedirect params={params} />
    </Suspense>
  )
}
