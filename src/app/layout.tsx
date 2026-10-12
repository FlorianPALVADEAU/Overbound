import type { Metadata } from "next";
import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Layout } from "@/components/layout/Layout";
import ClientProviders from '@/components/ClientProviders'
import { OrganizationStructuredDataServer } from '@/components/seo/OrganizationStructuredDataServer'
import { AnalyticsScripts } from '@/components/consent/AnalyticsScripts'
import { UtmCapture } from '@/components/attribution/UtmCapture'
import { PromotionsSeed } from '@/components/layout/PromotionsSeed'
import { loadActivePromotions } from '@/lib/promotions/loadActivePromotions'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Only used on a few pages: no preload on every route.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

// Display face for titles and figures (docs/design/design-system.md).
const displayFace = Barlow_Condensed({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: "700",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'),
  title: {
    default: "Overbound Race - Course à Obstacles Paris 2026 | Backyard à Obstacles",
    template: "%s | Overbound Race"
  },
  description: "Overbound Race : première course à obstacles format backyard en France ! Course obstacles Paris 2026, OCR personnalisable. Choisis ta distance et ta difficulté.",
  keywords: [
    "course à obstacles paris",
    "course à obstacles paris 2026",
    "course obstacles 2026",
    "overbound",
    "overbound race",
    "backyard à obstacles",
    "backyard obstacles france",
    "backyard ultra obstacles",
    "OCR paris",
    "OCR france 2026",
    "course à obstacles île-de-france",
    "spartan race paris",
    "spartan race alternative",
    "mud day alternative",
    "course obstacles débutant",
    "obstacle race france",
    "course endurance obstacles",
    "trail obstacles paris",
    "événement sportif paris 2026",
  ],
  authors: [{ name: "Overbound Race" }],
  creator: "Overbound Race",
  publisher: "Overbound Race",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com',
    siteName: "Overbound Race",
    title: "Overbound Race - Course à Obstacles Paris 2026 | Backyard à Obstacles",
    description: "Première course à obstacles format backyard en France ! OCR personnalisable à Paris 2026. Choisis ta distance et difficulté. Inscriptions ouvertes !",
    images: [
      {
        url: "/images/images/overbound-og-cover.jpg",
        width: 1200,
        height: 630,
        alt: "Overbound Race - Course à Obstacles Paris 2026 - Backyard à Obstacles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Overbound Race - Course à Obstacles Paris 2026 | Backyard à Obstacles",
    description: "Première course à obstacles format backyard en France ! OCR personnalisable à Paris 2026. Inscriptions ouvertes !",
    images: ["/images/images/overbound-og-cover.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // verification: {
  //   google: 'AJOUTE_TON_CODE_GSC_ICI', // Code de Google Search Console
  // },
};


// The promotions banner is rendered on the server: static pages are
// regenerated at most every 5 minutes so a banner starts and ends on time.
// Admin changes revalidate immediately (api/admin/promotions).
export const revalidate = 300;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // A failed read only hides the banner; the client query retries.
  const promotions = await loadActivePromotions().catch(() => null)

  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${displayFace.variable} antialiased`}
      >
        {/* Structured Data - valid in body */}
        <OrganizationStructuredDataServer />

        <AnalyticsScripts />
        <UtmCapture />

        <ClientProviders>
          {promotions ? (
            <PromotionsSeed data={promotions}>
              <Layout>{children}</Layout>
            </PromotionsSeed>
          ) : (
            <Layout>{children}</Layout>
          )}
        </ClientProviders>
      </body>
    </html>
  );
}
