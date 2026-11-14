import type { Metadata } from "next"
import { Fraunces, Source_Sans_3 } from "next/font/google"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants"
import "./globals.css"

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
})

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  openGraph: {
    title: SITE_NAME,
    description: SITE_TAGLINE,
    type: "website",
  },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
