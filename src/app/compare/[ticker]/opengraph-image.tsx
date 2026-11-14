import { ImageResponse } from "next/og"
import { SITE_NAME } from "@/lib/constants"
import { formatPercentSigned } from "@/lib/format"
import { buildComparison } from "@/lib/services/compare"
import { normalizeTicker } from "@/lib/ticker"

export const alt = "Stock Token Compare"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

interface ImageProps {
  params: Promise<{ ticker: string }>
}

export default async function OpenGraphImage({ params }: ImageProps) {
  const { ticker } = await params
  const normalized = normalizeTicker(ticker)
  let underlying = normalized.underlyingCandidate || ticker.toUpperCase()
  let token = normalized.tokenCandidate || `${underlying}x`
  let premiumLabel = "Premium unavailable"
  let reading = "Informational comparison only"

  try {
    const data = await buildComparison(normalized.cleaned || ticker)
    if (data) {
      underlying = data.underlyingSymbol
      token = data.tokenSymbol
      premiumLabel = formatPercentSigned(data.premium.percent)
      reading = data.premium.reading
    }
  } catch {
    // Fall back to ticker-derived labels when live data is unavailable.
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f3f1eb",
          backgroundImage:
            "radial-gradient(900px 420px at 12% -10%, rgba(31,92,77,0.16), transparent 60%)",
          padding: "56px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#18212b",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#5b6570",
            }}
          >
            {SITE_NAME}
          </div>
          <div style={{ display: "flex", fontSize: 72, lineHeight: 1.05 }}>
            {underlying} vs {token}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#5b6570" }}>
            Listed share versus tokenized market price
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 22, color: "#5b6570" }}>
              Observed premium / discount
            </div>
            <div style={{ display: "flex", fontSize: 64, color: "#1f5c4d" }}>
              {premiumLabel}
            </div>
            <div style={{ display: "flex", fontSize: 24, color: "#5b6570", maxWidth: 760 }}>
              {reading}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#5b6570" }}>
            Unofficial · informational
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
