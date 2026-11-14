import { NextResponse } from "next/server"
import { REGISTRY_CACHE_REVALIDATE_SECONDS } from "@/lib/constants"
import { sourceFailureMessage } from "@/lib/http"
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
        meta: { total: registry.entries.length, complete: registry.complete },
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${REGISTRY_CACHE_REVALIDATE_SECONDS}, stale-while-revalidate=${REGISTRY_CACHE_REVALIDATE_SECONDS * 2}`,
        },
      },
    )
  } catch (error) {
    const message = sourceFailureMessage(error, "Registry failed")
    return NextResponse.json(
      { success: false, data: null, error: message, meta: null },
      { status: 502 },
    )
  }
}
