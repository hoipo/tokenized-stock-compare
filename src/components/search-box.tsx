"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useId, useRef, useState, useTransition } from "react"
import { rankRegistryEntries } from "@/lib/registry-search"
import { comparePath } from "@/lib/ticker"

interface Suggestion {
  tokenSymbol: string
  underlyingSymbol: string
  name: string
}

interface RegistryResponse {
  success: boolean
  data: { entries: Suggestion[] } | null
  error: string | null
}

let registryEntries: Suggestion[] | null = null
let registryLoad: Promise<Suggestion[]> | null = null

function loadRegistryEntries(): Promise<Suggestion[]> {
  if (registryEntries) return Promise.resolve(registryEntries)
  if (!registryLoad) {
    registryLoad = fetch("/api/registry")
      .then(async (response) => {
        if (!response.ok) throw new Error("registry failed")
        const body = (await response.json()) as RegistryResponse
        if (!body.success || !body.data) throw new Error(body.error || "registry failed")
        registryEntries = body.data.entries
        return body.data.entries
      })
      .catch((error: unknown) => {
        registryLoad = null
        throw error
      })
  }
  return registryLoad
}

export function SearchBox({
  initialQuery = "",
  autofocus = false,
}: {
  initialQuery?: string
  autofocus?: boolean
}) {
  const router = useRouter()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(initialQuery)
  const [entries, setEntries] = useState<Suggestion[] | null>(() => registryEntries)
  const [dismissed, setDismissed] = useState(initialQuery.trim().length > 0)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const suggestions = query.trim() && entries ? rankRegistryEntries(entries, query, 8) : []
  const open = !dismissed && suggestions.length > 0

  useEffect(() => {
    if (!autofocus) return
    inputRef.current?.focus()
  }, [autofocus])

  useEffect(() => {
    if (entries) return
    let cancelled = false
    loadRegistryEntries()
      .then((next) => {
        if (!cancelled) setEntries(next)
      })
      .catch(() => {
        if (!cancelled) setError("Autocomplete unavailable right now.")
      })
    return () => {
      cancelled = true
    }
  }, [entries])

  function go(symbol: string) {
    const href = comparePath(symbol)
    if (!href) return
    startTransition(() => {
      router.push(href)
    })
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    const chosen =
      activeIndex >= 0 && suggestions[activeIndex]
        ? suggestions[activeIndex].underlyingSymbol
        : value
    setDismissed(true)
    go(chosen)
  }

  return (
    <div className="relative w-full">
      <form onSubmit={onSubmit} role="search" className="flex flex-col gap-2">
        <label htmlFor="ticker-search" className="text-sm font-medium text-[var(--ink)]">
          Search a stock or token ticker
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id="ticker-search"
            name="q"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(-1)
              setDismissed(false)
            }}
            onFocus={() => setDismissed(false)}
            onBlur={() => window.setTimeout(() => setDismissed(true), 150)}
            onKeyDown={(event) => {
              if (!open || suggestions.length === 0) return
              if (event.key === "ArrowDown") {
                event.preventDefault()
                setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1))
              } else if (event.key === "ArrowUp") {
                event.preventDefault()
                setActiveIndex((index) => Math.max(index - 1, 0))
              } else if (event.key === "Escape") {
                setDismissed(true)
              }
            }}
            placeholder="e.g. TSLA or TSLAx"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open}
            className="w-full rounded-sm border border-[var(--line)] bg-white px-3 py-3 text-base text-[var(--ink)] shadow-sm placeholder:text-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-sm bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--accent-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-60"
          >
            {isPending ? "…" : "Compare"}
          </button>
        </div>
        {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
      </form>

      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-sm border border-[var(--line)] bg-white shadow-md"
        >
          {suggestions.map((item, index) => (
            <li key={`${item.tokenSymbol}-${item.underlyingSymbol}`} role="option" aria-selected={index === activeIndex}>
              <Link
                href={comparePath(item.underlyingSymbol) ?? "/"}
                className={`flex items-center justify-between gap-3 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${
                  index === activeIndex ? "bg-[var(--wash)]" : "hover:bg-[var(--wash)]"
                }`}
                onMouseDown={(event) => event.preventDefault()}
              >
                <span className="font-medium text-[var(--ink)]">
                  {item.underlyingSymbol}
                  <span className="ml-2 font-normal text-[var(--muted)]">{item.tokenSymbol}</span>
                </span>
                <span className="truncate text-[var(--muted)]">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
