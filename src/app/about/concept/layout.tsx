import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Le Concept Overbound - Innovations mondiales en OCR | Overbound Race",
  description: "Découvrez les innovations Overbound : le premier système de difficulté modulaire au monde et la Ultra Arena, premier backyard OCR. Révolutionnez votre expérience OCR.",
  alternates: {
    canonical: 'https://overbound-race.com/about/concept'
  },
  openGraph: {
    title: "Le Concept Overbound - Révolutions mondiales en OCR",
    description: "Deux innovations mondiales : difficulté modulaire personnalisable et Ultra Arena backyard format.",
    url: 'https://overbound-race.com/about/concept',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif',
        width: 1200,
        height: 630,
        alt: 'Athlète Overbound portant des troncs d\'arbres'
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Le Concept Overbound - Révolutions mondiales en OCR",
    description: "Deux innovations mondiales : difficulté modulaire personnalisable et Ultra Arena backyard format.",
    images: ['/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif'],
  }
};

export default function ConceptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
