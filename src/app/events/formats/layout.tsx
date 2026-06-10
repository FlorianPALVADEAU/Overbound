import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Formats Course à Obstacles | Origin, Horizon, Ultra Arena | Paris 2026",
  description: "Choisis ton format de course à obstacles Overbound : Origin (6km), Horizon (12km), Ultra Arena (backyard à obstacles). Distances et difficultés personnalisables. Course obstacles Paris 2026.",
  keywords: [
    "formats course obstacles",
    "origin course obstacles",
    "horizon OCR",
    "ultra arena backyard",
    "backyard à obstacles",
    "course obstacles débutant",
    "course obstacles paris 2026",
    "OCR personnalisable",
    "niveaux difficulté OCR",
  ],
  alternates: {
    canonical: 'https://overbound-race.com/events/formats'
  },
  openGraph: {
    title: "Formats Course à Obstacles | Origin, Horizon, Ultra Arena",
    description: "Choisis ton format : Origin (6km), Horizon (12km), Ultra Arena (backyard à obstacles). Course obstacles Paris 2026.",
    url: 'https://overbound-race.com/events/formats',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif',
        width: 1200,
        height: 630,
        alt: 'Formats Course à Obstacles - Overbound Race Paris 2026'
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Formats Course à Obstacles | Overbound Race Paris 2026",
    description: "Origin, Horizon, Ultra Arena : choisis ton format et ta difficulté.",
    images: ['/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif'],
  },
};

export default function FormatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
