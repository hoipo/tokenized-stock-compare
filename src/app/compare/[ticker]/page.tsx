import type { Metadata } from "next"
import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import { Suspense } from "react"
import { CompareView } from "@/components/compare-view"
import { SearchBox } from "@/components/search-box"
import { sourceFailureMessage } from "@/lib/http"
import { FEATURED_UNDERLYINGS, comparePath, normalizeTicker } from "@/lib/ticker"
import { buildComparison } from "@/lib/services/compare"
import { resolveTicker } from "@/lib/services/registry"

interface PageProps {
  params: Promise<{ ticker: string }>
}

export async function generateStaticParams() {
  return FEATURED_UNDERLYINGS.map((ticker) => ({ ticker: ticker.toLowerCase() }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ticker } = await params
  try {
    const resolved = await resolveTicker(ticker)
    if (!resolved) {
      return {
        title: `${ticker.toUpperCase()} comparison`,
        description: "Tokenized stock comparison could not be resolved.",
      }
    }

    const title = `${resolved.underlyingSymbol} vs ${resolved.tokenSymbol}: price, premium, and liquidity`
    const description = `Compare ${resolved.underlyingSymbol} listed share price with ${resolved.tokenSymbol}, including premium/discount, trading hours, deployments, and DEX liquidity.`
    const canonical = comparePath(resolved.underlyingSymbol)
    return {
      title,
      description,
      openGraph: { title, description },
      alternates: canonical ? { canonical } : undefined,
    }
  } catch {
    return {
      title: `${ticker.toUpperCase()} comparison`,
      description: "Tokenized stock comparison.",
    }
  }
}

async function ComparisonSection({ ticker }: { ticker: string }) {
  const normalized = normalizeTicker(ticker)
  if (!normalized.cleaned) notFound()

  let resolved: Awaited<ReturnType<typeof resolveTicker>> = null
  let fatal: string | null = null
  try {
    resolved = await resolveTicker(normalized.cleaned)
  } catch (error) {
    fatal = sourceFailureMessage(error, "Comparison failed")
  }

  if (!fatal && resolved) {
    const canonical = comparePath(resolved.underlyingSymbol)
    if (canonical && ticker !== resolved.underlyingSymbol.toLowerCase())
      permanentRedirect(canonical)
  }

  let data: Awaited<ReturnType<typeof buildComparison>> = null
  if (!fatal && resolved) {
    try {
      data = await buildComparison(resolved.underlyingSymbol)
    } catch (error) {
      fatal = sourceFailureMessage(error, "Comparison failed")
    }
  }

  if (fatal) {
    return (
      <div className="space-y-4 rounded-sm border border-[var(--line)] bg-white p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          Comparison temporarily unavailable
        </h1>
        <p className="text-[var(--muted)]">{fatal}</p>
        <Link
          href="/"
          className="inline-flex text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Back to search
        </Link>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4 rounded-sm border border-[var(--line)] bg-white p-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          No match for “{normalized.cleaned}”
        </h1>
        <p className="text-[var(--muted)]">
          That ticker was not found in the cached xStocks public registry. Try another
          symbol or return home.
        </p>
        <Link
          href="/"
          className="inline-flex text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Back to search
        </Link>
      </div>
    )
  }

  return <CompareView data={data} initialNow={data.fetchedAt} />
}

export default async function ComparePage({ params }: PageProps) {
  const { ticker } = await params

  return (
    <div className="space-y-8">
      <div className="max-w-xl">
        <SearchBox initialQuery={ticker} />
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-[var(--muted)]" role="status">
            Loading comparison…
          </p>
        }
      >
        <ComparisonSection ticker={ticker} />
      </Suspense>
    </div>
  )
}
