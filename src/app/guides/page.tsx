import type { Metadata } from "next"
import Link from "next/link"
import { listGuides } from "@/lib/guides"

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Plain-language guides on tokenized stocks, premium and discount readings, and how this unofficial comparison tool works.",
}

export default function GuidesIndexPage() {
  const guides = listGuides()

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          Explainers
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Guides
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          Short reference articles for reading comparison pages. Informal and unofficial —
          not investment advice.
        </p>
      </header>

      <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)] bg-white/70">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={`/guides/${guide.slug}`}
              className="block space-y-1 px-3 py-4 hover:bg-[var(--wash)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <span className="font-medium text-[var(--ink)]">{guide.title}</span>
              <span className="block text-sm text-[var(--muted)]">{guide.description}</span>
              <span className="block text-xs text-[var(--muted)]">
                Updated {guide.updated}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
