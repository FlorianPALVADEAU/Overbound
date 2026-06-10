import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Notre Histoire - Overbound Race | Créateurs du Backyard à Obstacles",
  description: "Découvre l'histoire d'Overbound Race, créateur du premier backyard OCR au monde. De la vision à la Ultra Arena : comment nous révolutionnons la course à obstacles en France. Paris 2026.",
  keywords: [
    "overbound histoire",
    "overbound race",
    "création backyard OCR",
    "backyard à obstacles origine",
    "course obstacles paris",
    "ultra arena histoire",
    "OCR innovant france",
  ],
  alternates: {
    canonical: 'https://overbound-race.com/about/our-story'
  },
  openGraph: {
    title: "Notre Histoire | Overbound Race - Créateurs du Backyard à Obstacles",
    description: "L'histoire d'Overbound : de la vision au premier backyard OCR au monde. Course à obstacles Paris 2026.",
    url: 'https://overbound-race.com/about/our-story',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/images/overbound-headband-on-chains-with-grass-in-background.avif',
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
    description: "Découvre comment Overbound a créé le premier backyard OCR au monde.",
    images: ['/images/images/overbound-headband-on-chains-with-grass-in-background.avif'],
  }
};

export default function OurStoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
