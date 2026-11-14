import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Disclaimer } from "@/components/disclaimer"
import { SITE_NAME, SITE_URL } from "@/lib/constants"
import { getGuide, getGuideSlugs } from "@/lib/guides"

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getGuideSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return { title: "Guide" }

  return {
    title: guide.title,
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
      url: `${SITE_URL}/guides/${guide.slug}`,
    },
    alternates: { canonical: `/guides/${guide.slug}` },
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.updated,
    dateModified: guide.updated,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
  }

  return (
    <article className="max-w-3xl space-y-8 text-[var(--muted)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.14em]">Guide</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          {guide.title}
        </h1>
        <p className="text-lg">{guide.description}</p>
        <p className="text-xs">Updated {guide.updated}</p>
      </header>

      {guide.sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {section.heading}
          </h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
          {section.bullets ? (
            <ul className="list-disc space-y-2 pl-5">
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <section aria-labelledby="related-guides-heading" className="space-y-3">
        <h2
          id="related-guides-heading"
          className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]"
        >
          Related
        </h2>
        <ul className="space-y-2">
          {guide.related.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/guides"
              className="text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              All guides
            </Link>
          </li>
        </ul>
      </section>

      <Disclaimer />
    </article>
  )
}
