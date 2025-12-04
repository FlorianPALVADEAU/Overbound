import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Blog OCR - Conseils, entraînements et actualités | Overbound Race",
  description: "Découvrez nos articles sur la course d'obstacles : techniques, plans d'entraînement, nutrition sportive, interviews d'athlètes et actualités OCR en France.",
  alternates: {
    canonical: 'https://overbound-race.com/blog'
  },
  openGraph: {
    title: "Blog Overbound Race - Conseils OCR",
    description: "Articles, guides et actualités sur la course d'obstacles.",
    url: 'https://overbound-race.com/blog',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Blog Overbound Race - Conseils OCR",
    description: "Articles, guides et actualités sur la course d'obstacles.",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
