import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Politique de cookies - Gestion des traceurs | Overbound Race",
  description: "Gestion des cookies Overbound Race : cookies nécessaires, analytics, publicité. Paramétrez vos préférences et consultez notre politique de confidentialité.",
  alternates: {
    canonical: 'https://overbound-race.com/cookies'
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
