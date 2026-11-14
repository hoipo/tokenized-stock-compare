import Link from "next/link"
import { SITE_NAME } from "@/lib/constants"

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {SITE_NAME}
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-4 text-sm text-[var(--muted)]">
          <Link
            href="/"
            className="hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Search
          </Link>
          <Link
            href="/markets"
            className="hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Markets
          </Link>
          <Link
            href="/markets/premiums"
            className="hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Premiums
          </Link>
          <Link
            href="/guides"
            className="hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Guides
          </Link>
          <Link
            href="/share"
            className="hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Share
          </Link>
          <Link
            href="/about"
            className="hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  )
}
