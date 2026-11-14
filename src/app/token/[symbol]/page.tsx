import { Suspense } from "react"
import { redirect } from "next/navigation"
import { FEATURED_UNDERLYINGS, normalizeTicker } from "@/lib/ticker"

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
  const target =
    normalized.underlyingCandidate || normalized.cleaned || symbol
  redirect(`/compare/${encodeURIComponent(target)}`)
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
