import Link from "next/link"

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        Page not found
      </h1>
      <p className="text-[var(--muted)]">That route does not exist.</p>
      <Link
        href="/"
        className="inline-flex text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        Back to Stock Token Compare
      </Link>
    </div>
  )
}
