import { NextResponse } from "next/server"
import { isValidTickerShape } from "@/lib/ticker"
import { searchRegistry } from "@/lib/services/registry"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") || "").trim()

  if (!q)
    return NextResponse.json({ success: true, data: [], error: null })

  if (!isValidTickerShape(q))
    return NextResponse.json({ success: true, data: [], error: null })

  try {
    const data = await searchRegistry(q, 8)
    return NextResponse.json(
      { success: true, data, error: null },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed"
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 502 },
    )
  }
}
