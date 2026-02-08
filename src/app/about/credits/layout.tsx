import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Crédits Overbound Race | Course à Obstacles Paris 2026",
  description: "Découvre l'équipe créative Overbound Race : designers, photographes, développeurs et contributeurs de la course à obstacles Paris 2026.",
  alternates: {
    canonical: 'https://overbound-race.com/about/credits'
  },
  openGraph: {
    title: "Crédits Overbound Race | Course à Obstacles Paris 2026",
    description: "L'équipe créative derrière Overbound Race et la course à obstacles Paris 2026.",
    url: 'https://overbound-race.com/about/credits',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/images/overbound-headband-on-chains-with-grass-in-background.avif',
        width: 1200,
        height: 630,
        alt: 'Crédits Overbound Race',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Crédits Overbound Race",
    description: "L'équipe créative derrière la course à obstacles Paris 2026.",
    images: ['/images/images/overbound-headband-on-chains-with-grass-in-background.avif'],
  },
};

export default function CreditsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
