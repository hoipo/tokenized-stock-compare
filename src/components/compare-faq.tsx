import { buildCompareFaqItems, buildFaqPageJsonLd } from "@/lib/faq"

export function CompareFaq({
  underlyingSymbol,
  tokenSymbol,
}: {
  underlyingSymbol: string
  tokenSymbol: string
}) {
  const items = buildCompareFaqItems({ underlyingSymbol, tokenSymbol })
  const jsonLd = buildFaqPageJsonLd(items)

  return (
    <section aria-labelledby="faq-heading" className="space-y-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
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
