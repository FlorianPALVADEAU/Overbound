import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Notre Histoire - L'aventure Overbound Race | À propos",
  description: "Découvrez l'histoire d'Overbound, la première organisation 100% française qui révolutionne la course d'obstacles. De la création en 2025 aux innovations mondiales : difficulté modulaire et Ultra Arena backyard format.",
  alternates: {
    canonical: 'https://overbound-race.com/about/our-story'
  },
  openGraph: {
    title: "Notre Histoire - Overbound Race",
    description: "L'histoire d'une organisation OCR qui révolutionne la course d'obstacles en Europe.",
    url: 'https://overbound-race.com/about/our-story',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/images/overbound-headband-on-chains-with-grass-in-background.avif',
        width: 1200,
        height: 630,
        alt: 'Bandeau Overbound sur chaînes'
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Notre Histoire - Overbound Race",
    description: "Comment Overbound est devenue la référence OCR en Europe.",
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
