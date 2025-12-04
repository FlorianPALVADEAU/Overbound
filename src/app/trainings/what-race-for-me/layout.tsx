import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Quel format choisir ? - Guide des courses OCR | Overbound Race",
  description: "Trouvez le format de course d'obstacles qui vous correspond : Sprint Tribal (6km), Horizon (12km) ou Ultra Arena. Comparez les distances, difficultés et obstacles.",
  alternates: {
    canonical: 'https://overbound-race.com/trainings/what-race-for-me'
  },
  openGraph: {
    title: "Quel format de course OCR choisir ? - Overbound Race",
    description: "Guide complet pour choisir votre format de course d'obstacles.",
    url: 'https://overbound-race.com/trainings/what-race-for-me',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/images/images/old-lady-ramping-below-barbed-wires.avif',
        width: 1200,
        height: 630,
        alt: 'Coureurs escaladant un mur lors d\'une course d\'obstacles Overbound Race'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Quel format de course OCR choisir ? - Overbound Race",
    description: "Guide complet pour choisir votre format de course d'obstacles.",
    images: ['/images/images/old-lady-ramping-below-barbed-wires.avif'],
  },
};

export default function WhatRaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
