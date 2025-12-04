import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Catalogue des obstacles OCR - Découvrez nos modules | Overbound Race",
  description: "Explorez tous les obstacles de nos courses OCR : murs, portés, suspensions, Monkey Bar, obstacles aquatiques. Chaque module est noté selon sa difficulté et sa dominante physique.",
  alternates: {
    canonical: 'https://overbound-race.com/obstacles'
  },
  openGraph: {
    title: "Obstacles Overbound Race - Catalogue complet des modules OCR",
    description: "Découvre les obstacles signature que tu franchiras lors des courses Overbound. Vidéos, photos et descriptions..",
    url: 'https://overbound-race.com/obstacles',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/images/young-man-lifting-a-tractor-tire-with-a-photograph-in-his-back.avif',
        width: 1200,
        height: 630,
        alt: 'Athlète Overbound soulevant un pneu de tracteur'
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Obstacles Overbound Race - Catalogue OCR",
    description: "Explore nos obstacles signature : escalade, force, équilibre, agilité.",
    images: ['/images/images/young-man-lifting-a-tractor-tire-with-a-photograph-in-his-back.avif'],
  }
};

export default function ObstaclesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
