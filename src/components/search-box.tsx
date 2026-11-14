"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useId, useRef, useState, useTransition } from "react"

interface Suggestion {
  tokenSymbol: string
  underlyingSymbol: string
  name: string
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!autofocus) return
    inputRef.current?.focus()
  }, [autofocus])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 1) {
      setSuggestions([])
      setOpen(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error("Search failed")
        const data = (await response.json()) as {
          success: boolean
          data: Suggestion[] | null
          error: string | null
        }
        if (!data.success) throw new Error(data.error || "Search failed")
        setSuggestions(data.data ?? [])
        setOpen(true)
        setActiveIndex(-1)
        setError(null)
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        setError("Autocomplete unavailable right now.")
      }
    }, 180)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  function go(symbol: string) {
    startTransition(() => {
      router.push(`/compare/${encodeURIComponent(symbol)}`)
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
    setOpen(false)
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
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            onKeyDown={(event) => {
              if (!open || suggestions.length === 0) return
              if (event.key === "ArrowDown") {
                event.preventDefault()
                setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1))
              } else if (event.key === "ArrowUp") {
                event.preventDefault()
                setActiveIndex((index) => Math.max(index - 1, 0))
              } else if (event.key === "Escape") {
                setOpen(false)
              }
            }}
            placeholder="e.g. TSLA or TSLAx"
            autoComplete="off"
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
                href={`/compare/${item.underlyingSymbol}`}
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
