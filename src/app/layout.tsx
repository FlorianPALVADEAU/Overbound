import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Layout } from "@/components/layout/Layout";
import ClientProviders from '@/components/ClientProviders'
import { OrganizationStructuredData } from '@/components/seo/StructuredData'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GTM_CONTAINER_ID = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'),
  title: {
    default: "Overbound Race - Course d'obstacles OCR uniques et personnalisables",
    template: "%s | Overbound Race"
  },
  description: "Première course d'obstacles (OCR) à parcours personnalisables en France. Choisissez votre distance (6-12km ou Ultra Arena) et votre difficulté (Primal, Fury, Ultra Hardcore). Événements en Normandie.",
  keywords: [
    "course obstacles",
    "OCR France",
    "obstacle course race",
    "course à obstacles normandie",
    "spartan race alternative",
    "trail running obstacles",
    "événement sportif normandie",
    "ultra arena",
    "course endurance",
    "overbound"
  ],
  authors: [{ name: "Overbound Race" }],
  creator: "Overbound Race",
  publisher: "Overbound Race",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com',
    siteName: "Overbound Race",
    title: "Overbound Race - Course d'obstacles OCR personnalisables",
    description: "Première course d'obstacles (OCR) à parcours personnalisables en France. Distances de 6km à ultra marathon avec obstacles techniques.",
    images: [
      {
        url: "/images/hero_header_poster.jpg",
        width: 1200,
        height: 630,
        alt: "Overbound Race - Course d'obstacles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Overbound Race - Course d'obstacles OCR personnalisables",
    description: "Première course d'obstacles à parcours personnalisables en France. Événements OCR en Normandie.",
    images: ["/images/hero_header_poster.jpg"],
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
      <head>
        <OrganizationStructuredData />
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        {GTM_CONTAINER_ID && (
          <Script id="gtm-base" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');
            `}
          </Script>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {GTM_CONTAINER_ID && (
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
            }}
          />
        )}
        <ClientProviders>
          <Layout>{children}</Layout>
        </ClientProviders>
      </body>
    </html>
  );
}
