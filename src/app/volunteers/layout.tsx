import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Devenir Bénévole Course à Obstacles Paris 2026 | Overbound Race",
  description: "Rejoins l'équipe bénévole Overbound Race Paris 2026 ! Encadrement obstacles, logistique, accueil. Place offerte sur l'événement de ton choix. Backyard à obstacles Ultra Arena.",
  keywords: [
    "bénévole course obstacles",
    "bénévole OCR paris",
    "volontaire course obstacles 2026",
    "overbound bénévole",
    "bénévole événement sportif paris",
    "volontaire ultra arena",
    "bénévole backyard obstacles",
  ],
  alternates: {
    canonical: 'https://overbound-race.com/volunteers'
  },
  openGraph: {
    title: "Devenir Bénévole Course à Obstacles Paris 2026 | Overbound Race",
    description: "Rejoins la tribu bénévole Overbound Race ! Vis l'expérience de l'intérieur. Place offerte sur l'événement de ton choix.",
    url: 'https://overbound-race.com/volunteers',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/images/images/two-sporty-mens-staring-at-the-camera-with-pride.avif',
        width: 1200,
        height: 630,
        alt: 'Bénévoles Overbound Race - Course à obstacles Paris 2026'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Devenir Bénévole | Overbound Race Paris 2026",
    description: "Rejoins la tribu bénévole ! Place offerte sur l'événement de ton choix.",
    images: ['/images/images/two-sporty-mens-staring-at-the-camera-with-pride.avif'],
  }
};

export default function VolunteersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
