import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/constants"
import { FEATURED_UNDERLYINGS } from "@/lib/ticker"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const staticRoutes = ["", "/about"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }))

  const compareRoutes = FEATURED_UNDERLYINGS.map((ticker) => ({
    url: `${SITE_URL}/compare/${ticker.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...compareRoutes]
}
