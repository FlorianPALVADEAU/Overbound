import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Layout } from "@/components/layout/Layout";
import ClientProviders from '@/components/ClientProviders'
import { OrganizationStructuredDataServer } from '@/components/seo/OrganizationStructuredDataServer'
import { AnalyticsScripts } from '@/components/consent/AnalyticsScripts'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'),
  title: {
    default: "Overbound Race - Course à Obstacles Paris 2026 | Backyard à Obstacles",
    template: "%s | Overbound Race - Course à Obstacles Paris 2026"
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
        url: "/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif",
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
    images: ["/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif"],
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
  verification: {
    // À ajouter après inscription à Google Search Console
    // google: 'votre-code-verification',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Structured Data - valid in body */}
        <OrganizationStructuredDataServer />

        <AnalyticsScripts />

        <ClientProviders>
          <Layout>{children}</Layout>
        </ClientProviders>
      </body>
    </html>
  );
}
