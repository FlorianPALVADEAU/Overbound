import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Formats de course - Choisissez votre défi OCR | Overbound Race",
  description: "Découvrez nos formats de course d'obstacles : Origin (6km), Horizon (12km), Ultra Arena (∞). Distances et difficultés personnalisables.",
  alternates: {
    canonical: 'https://overbound-race.com/events/formats'
  },
  openGraph: {
    title: "Formats de course OCR - Overbound Race",
    description: "Choisissez votre format et votre niveau de difficulté.",
    url: 'https://overbound-race.com/events/formats',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif',
        width: 1200,
        height: 630,
        alt: 'Coureurs portant des troncs d\'arbres lors d\'une course Overbound Race'
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Formats de course OCR - Overbound Race",
    description: "Choisissez votre format et votre niveau de difficulté.",
    images: [
      {
        url: '/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif',
        width: 1200,
        height: 630,
        alt: 'Coureurs portant des troncs d\'arbres lors d\'une course Overbound Race'
      }
    ],
  },
};

export default function FormatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
