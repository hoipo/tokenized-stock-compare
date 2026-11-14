import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { CompareView } from "@/components/compare-view"
import { SearchBox } from "@/components/search-box"
import { FEATURED_UNDERLYINGS, normalizeTicker } from "@/lib/ticker"
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
    return { title, description, openGraph: { title, description } }
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

  let data = null
  let fatal: string | null = null
  try {
    data = await buildComparison(normalized.cleaned)
  } catch (error) {
    fatal = error instanceof Error ? error.message : "Comparison failed"
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

  return <CompareView data={data} />
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
