import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Crédits - L'équipe créative derrière Overbound | À propos",
  description: "Découvrez l'équipe créative Overbound Race : designers, photographes, développeurs et contributeurs qui ont donné vie au projet.",
  alternates: {
    canonical: 'https://overbound-race.com/about/credits'
  },
  openGraph: {
    title: "Crédits - Overbound Race",
    description: "L'équipe créative derrière Overbound.",
    url: 'https://overbound-race.com/about/credits',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function CreditsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
