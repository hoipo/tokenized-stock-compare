import { SITE_NAME, SITE_URL } from "@/lib/constants"
import { resolveBadgeSnapshot } from "@/lib/badge"
import { isValidTickerShape } from "@/lib/ticker"

interface RouteProps {
  params: Promise<{ ticker: string }>
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { ticker } = await params
  if (!isValidTickerShape(ticker)) {
    return new Response("Invalid ticker", { status: 400 })
  }

  const snapshot = await resolveBadgeSnapshot(ticker)
  const href = `${SITE_URL}${snapshot.comparePath}`
  const premiumColor = snapshot.ok ? "#1f5c4d" : "#5b6570"
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${escapeHtml(snapshot.underlyingSymbol)} vs ${escapeHtml(snapshot.tokenSymbol)} · ${SITE_NAME}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Source Sans 3", "Segoe UI", sans-serif;
      background: #faf8f4;
      color: #18212b;
    }
    a.card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 140px;
      padding: 16px 18px;
      text-decoration: none;
      color: inherit;
      border: 1px solid #d7d2c8;
      background: linear-gradient(180deg, #faf8f4 0%, #f3f1eb 100%);
    }
    a.card:focus-visible {
      outline: 2px solid #1f5c4d;
      outline-offset: 2px;
    }
    .kicker {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #5b6570;
      margin: 0 0 6px;
    }
    .pair {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 22px;
      margin: 0 0 6px;
    }
    .reading {
      margin: 0;
      font-size: 12px;
      color: #5b6570;
      max-width: 180px;
      line-height: 1.35;
    }
    .premium-label {
      margin: 0;
      font-size: 11px;
      color: #5b6570;
      text-align: right;
    }
    .premium {
      margin: 2px 0 0;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 28px;
      color: ${premiumColor};
      text-align: right;
    }
  </style>
</head>
<body>
  <a class="card" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
    <div>
      <p class="kicker">${escapeHtml(SITE_NAME)}</p>
      <p class="pair">${escapeHtml(snapshot.underlyingSymbol)} vs ${escapeHtml(snapshot.tokenSymbol)}</p>
      <p class="reading">${escapeHtml(snapshot.reading)}</p>
    </div>
    <div>
      <p class="premium-label">Premium</p>
      <p class="premium">${escapeHtml(snapshot.premiumLabel)}</p>
    </div>
  </a>
</body>
</html>`

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=90, stale-while-revalidate=60",
      "Content-Security-Policy": "frame-ancestors *",
      "X-Robots-Tag": "noindex, nofollow",
    },
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
