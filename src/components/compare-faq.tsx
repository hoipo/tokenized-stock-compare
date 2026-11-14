export function CompareFaq({
  underlyingSymbol,
  tokenSymbol,
}: {
  underlyingSymbol: string
  tokenSymbol: string
}) {
  const items = [
    {
      q: `What is a tokenized stock like ${tokenSymbol}?`,
      a: `A tokenized stock is a blockchain representation designed to track a listed share such as ${underlyingSymbol}. Legal structure, custody, and redemption rights depend on the issuer and are not guaranteed by this website.`,
    },
    {
      q: `How does ${tokenSymbol} differ from the listed ${underlyingSymbol} share?`,
      a: "The listed share trades on regulated equity venues during exchange hours. The token may trade on crypto venues with different hours, counterparties, settlement, and eligibility rules. Holding the token is not automatically the same as holding the share.",
    },
    {
      q: "Why can prices diverge?",
      a: "Premium or discount can reflect liquidity, trading hours, bridging delays, oracle updates, weekend gaps, fees, and local demand. Weekend readings often compare a last equity close with a live DEX mid.",
    },
    {
      q: "Are there regional restrictions?",
      a: "Yes. Issuance, redemption, and sometimes secondary trading can be limited by residency and regulation. Always check issuer terms; this tool does not assess your eligibility.",
    },
    {
      q: "Is this site official?",
      a: "No. Stock Token Compare is unofficial and unaffiliated with Backed, xStocks, Nasdaq, or any issuer or exchange. Logos next to tokens, if shown, are for identification only.",
    },
  ]

  return (
    <section aria-labelledby="faq-heading" className="space-y-4">
      <h2 id="faq-heading" className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
        FAQ
      </h2>
      <dl className="space-y-4">
        {items.map((item) => (
          <div key={item.q} className="border-t border-[var(--line)] pt-4">
            <dt className="font-medium text-[var(--ink)]">{item.q}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
