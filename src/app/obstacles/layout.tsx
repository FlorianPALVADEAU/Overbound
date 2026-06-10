import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Obstacles Course OCR Paris 2026 | Catalogue Overbound Race",
  description: "Explore les obstacles des courses à obstacles Overbound Race Paris 2026 : murs, portés, suspensions, Monkey Bar, grip. Backyard à obstacles Ultra Arena. Chaque obstacle noté par difficulté.",
  keywords: [
    "obstacles course OCR",
    "obstacles overbound",
    "monkey bar OCR",
    "mur escalade course obstacles",
    "portés course obstacles",
    "obstacles backyard",
    "course obstacles paris 2026",
    "grip OCR",
    "obstacles techniques",
  ],
  alternates: {
    canonical: 'https://overbound-race.com/obstacles'
  },
  openGraph: {
    title: "Obstacles Course OCR Paris 2026 | Overbound Race",
    description: "Catalogue complet des obstacles Overbound Race : escalade, force, grip, agilité. Course à obstacles Paris 2026.",
    url: 'https://overbound-race.com/obstacles',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/images/young-man-lifting-a-tractor-tire-with-a-photograph-in-his-back.avif',
        width: 1200,
        height: 630,
        alt: 'Obstacles Course OCR - Overbound Race Paris 2026'
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Obstacles Course OCR Paris 2026 | Overbound Race",
    description: "Explore nos obstacles : escalade, force, grip, agilité. Course à obstacles Paris 2026.",
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
