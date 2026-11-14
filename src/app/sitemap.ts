import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/constants"
import { listGuides } from "@/lib/guides"
import { getAssetRegistry } from "@/lib/services/registry"
import { FEATURED_UNDERLYINGS, comparePath } from "@/lib/ticker"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticRoutes = [
    "",
    "/about",
    "/markets",
    "/markets/premiums",
    "/guides",
    "/share",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path.startsWith("/markets")
      ? ("hourly" as const)
      : ("weekly" as const),
    priority: path === "" ? 1 : path.startsWith("/markets") ? 0.7 : 0.6,
  }))

  const guideRoutes = listGuides().map((guide) => ({
    url: `${SITE_URL}/guides/${guide.slug}`,
    lastModified: new Date(guide.updated),
    changeFrequency: "monthly" as const,
    priority: 0.65,
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

  return [...staticRoutes, ...guideRoutes, ...compareRoutes]
}
