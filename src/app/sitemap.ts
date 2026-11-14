import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/constants"
import { getAssetRegistry } from "@/lib/services/registry"
import { FEATURED_UNDERLYINGS, comparePath } from "@/lib/ticker"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticRoutes = ["", "/about"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }))

  let slugs = FEATURED_UNDERLYINGS.map((ticker) => ticker.toLowerCase())
  try {
    const registry = await getAssetRegistry()
    const fromRegistry = [
      ...new Set(registry.entries.map((entry) => entry.underlyingSymbol.toLowerCase())),
    ].sort()
    if (fromRegistry.length > 0) slugs = fromRegistry
  } catch {
    // Featured tickers remain when the registry cannot be loaded.
  }

  const compareRoutes = slugs.flatMap((slug) => {
    const path = comparePath(slug)
    if (!path) return []
    return [
      {
        url: `${SITE_URL}${path}`,
        lastModified: now,
        changeFrequency: "hourly" as const,
        priority: 0.8,
      },
    ]
  })

  return [...staticRoutes, ...compareRoutes]
}
