const EXPLORERS: Record<string, (address: string) => string> = {
  Solana: (a) => `https://solscan.io/token/${a}`,
  Ethereum: (a) => `https://etherscan.io/token/${a}`,
  Arbitrum: (a) => `https://arbiscan.io/token/${a}`,
  Optimism: (a) => `https://optimistic.etherscan.io/token/${a}`,
  Base: (a) => `https://basescan.org/token/${a}`,
  Polygon: (a) => `https://polygonscan.com/token/${a}`,
  BNB: (a) => `https://bscscan.com/token/${a}`,
  Avalanche: (a) => `https://snowtrace.io/token/${a}`,
  XLayer: (a) => `https://www.okx.com/web3/explorer/xlayer/token/${a}`,
  Ink: (a) => `https://explorer.inkonchain.com/token/${a}`,
  HyperEVM: (a) => `https://hyperevmscan.io/token/${a}`,
  Monad: (a) => `https://monadvision.com/token/${a}`,
  Ton: (a) => `https://tonviewer.com/${a}`,
}

export function getExplorerUrl(network: string, address: string): string | null {
  const builder = EXPLORERS[network]
  if (!builder) return null
  return builder(encodeURIComponent(address))
}

export function sanitizeDexscreenerUrl(params: {
  url: string | null | undefined
  chainId: string
  pairAddress: string
}): string {
  const fallback = `https://dexscreener.com/${encodeURIComponent(params.chainId)}/${encodeURIComponent(params.pairAddress)}`
  if (!params.url) return fallback
  try {
    const parsed = new URL(params.url)
    if (parsed.protocol !== "https:") return fallback
    if (parsed.hostname !== "dexscreener.com" && !parsed.hostname.endsWith(".dexscreener.com"))
      return fallback
    return parsed.toString()
  } catch {
    return fallback
  }
}
