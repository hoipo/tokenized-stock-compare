import { ImageResponse } from "next/og"
import { SITE_NAME } from "@/lib/constants"
import { resolveBadgeSnapshot } from "@/lib/badge"
import { isValidTickerShape } from "@/lib/ticker"

const WIDTH = 480
const HEIGHT = 120

interface RouteProps {
  params: Promise<{ ticker: string }>
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { ticker } = await params
  if (!isValidTickerShape(ticker)) {
    return new Response("Invalid ticker", { status: 400 })
  }

  const snapshot = await resolveBadgeSnapshot(ticker)
  const accent = snapshot.ok ? "#1f5c4d" : "#5b6570"

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#faf8f4",
          border: "2px solid #d7d2c8",
          padding: "18px 22px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#18212b",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              display: "flex",
              fontSize: 14,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#5b6570",
            }}
          >
            {SITE_NAME}
          </div>
          <div style={{ display: "flex", fontSize: 28, lineHeight: 1.1 }}>
            {snapshot.underlyingSymbol} vs {snapshot.tokenSymbol}
          </div>
          <div style={{ display: "flex", fontSize: 14, color: "#5b6570", maxWidth: 280 }}>
            {snapshot.reading}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <div style={{ display: "flex", fontSize: 12, color: "#5b6570" }}>Premium</div>
          <div style={{ display: "flex", fontSize: 36, color: accent }}>
            {snapshot.premiumLabel}
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "Cache-Control": "public, s-maxage=90, stale-while-revalidate=60",
      },
    },
  )
}
