import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Notre histoire | Overbound Race",
  description: "Comment l'idée d'Overbound est née en août 2025 et comment elle est devenue, en septembre 2026, une course à obstacles ouverte à tous.",
  keywords: [
    "overbound histoire",
    "overbound race",
    "course obstacles paris",
    "ultra arena histoire",
    "OCR innovant france",
  ],
  alternates: {
    canonical: 'https://overbound-race.com/about/our-story'
  },
  openGraph: {
    title: "Notre histoire | Overbound Race",
    description: "L'histoire d'Overbound : de l'idée à la première édition.",
    url: 'https://overbound-race.com/about/our-story',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/images/og-headband-chains.jpg',
        width: 1200,
        height: 630,
        alt: 'Overbound Race - Créateurs du Backyard à Obstacles'
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Notre Histoire | Overbound Race",
    description: "Comment Overbound est passé d'une idée à une course à obstacles.",
    images: ['/images/images/og-headband-chains.jpg'],
  }
};

export default function OurStoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
