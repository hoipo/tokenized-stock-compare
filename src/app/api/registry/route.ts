import { NextResponse } from "next/server"
import { getAssetRegistry } from "@/lib/services/registry"

export async function GET() {
  try {
    const registry = await getAssetRegistry()
    return NextResponse.json(
      {
        success: true,
        data: {
          count: registry.entries.length,
          entries: registry.entries,
        },
        error: null,
        meta: { total: registry.entries.length },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=90, stale-while-revalidate=180",
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registry failed"
    return NextResponse.json(
      { success: false, data: null, error: message, meta: null },
      { status: 502 },
    )
  }
}
