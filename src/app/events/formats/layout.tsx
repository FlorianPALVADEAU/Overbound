import { ogImageUrl } from '@/lib/seo/ogImage'
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Formats OPEN vs RANKED | Course à Obstacles Overbound Paris 2026" },
  description: "Compare les deux formats Overbound : OPEN (vagues échelonnées, sans classement) et RANKED (départ unique, classement officiel). Trouve celui qui te correspond.",
  keywords: [
    "format course obstacles",
    "OPEN vs RANKED",
    "course obstacles sans classement",
    "course obstacles classée",
    "OCR paris 2026",
    "overbound formats",
  ],
  alternates: {
    canonical: 'https://overbound-race.com/events/formats'
  },
  openGraph: {
    title: "Formats OPEN vs RANKED | Overbound Race",
    description: "OPEN : vagues échelonnées, sans classement. RANKED : départ unique, classement officiel. Compare et choisis.",
    url: 'https://overbound-race.com/events/formats',
    siteName: 'Overbound Race',
    images: [
      {
        url: ogImageUrl({ title: 'OPEN ou RANKED', kicker: 'Deux formats, une boucle', photo: 'women' }),
        width: 1200,
        height: 630,
        alt: 'Formats OPEN vs RANKED - Overbound Race Paris 2026'
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Formats OPEN vs RANKED | Overbound Race Paris 2026",
    description: "Compare les deux formats et choisis celui qui te correspond.",
    images: [ogImageUrl({ title: 'OPEN ou RANKED', kicker: 'Deux formats, une boucle', photo: 'women' })],
  },
};

export default function FormatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
