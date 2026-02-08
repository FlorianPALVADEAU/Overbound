import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Blog Course à Obstacles Paris 2026 | Conseils OCR | Overbound Race",
  description: "Blog Overbound Race : conseils course à obstacles Paris 2026, plans d'entraînement OCR, nutrition sportive, préparation backyard à obstacles.",
  keywords: [
    "blog course obstacles",
    "conseils OCR",
    "entraînement course obstacles",
    "préparation OCR",
    "nutrition course obstacles",
    "backyard obstacles entraînement",
    "blog overbound",
    "actualités OCR france",
  ],
  alternates: {
    canonical: 'https://overbound-race.com/blog'
  },
  openGraph: {
    title: "Blog Course à Obstacles Paris 2026 | Overbound Race",
    description: "Conseils, entraînement et actualités course à obstacles Paris 2026. Préparation backyard OCR.",
    url: 'https://overbound-race.com/blog',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/hero_header_poster.jpg',
        width: 1200,
        height: 630,
        alt: 'Blog Overbound Race - Course à obstacles Paris 2026',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Blog Course à Obstacles Paris 2026 | Overbound Race",
    description: "Conseils, entraînement et actualités OCR pour la course à obstacles Paris 2026.",
    images: ['/images/hero_header_poster.jpg'],
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
