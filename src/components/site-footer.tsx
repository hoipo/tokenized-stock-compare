import Link from "next/link"
import { Disclaimer } from "@/components/disclaimer"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 sm:px-6">
        <Disclaimer />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <p>Unofficial comparison tool. Typography-first chrome — no issuer wordmarks.</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/markets"
              className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Markets
            </Link>
            <Link
              href="/markets/premiums"
              className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Premiums
            </Link>
            <Link
              href="/guides"
              className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Guides
            </Link>
            <Link
              href="/share"
              className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Share & embed
            </Link>
            <Link
              href="/about"
              className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Methodology & data sources
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
