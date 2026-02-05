import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Blog Course à Obstacles | Conseils, Entraînement OCR | Overbound Race",
  description: "Blog Overbound Race : conseils course à obstacles, plans d'entraînement OCR, nutrition sportive, préparation backyard à obstacles. Course obstacles Paris 2026.",
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
    title: "Blog Course à Obstacles | Conseils OCR | Overbound Race",
    description: "Conseils, entraînement et actualités course à obstacles. Préparation backyard OCR.",
    url: 'https://overbound-race.com/blog',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Blog Course à Obstacles | Overbound Race",
    description: "Conseils, entraînement et actualités OCR.",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
