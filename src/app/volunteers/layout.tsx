import { ogImageUrl } from '@/lib/seo/ogImage'
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Devenir bénévole sur une course à obstacles à Paris | Overbound" },
  description: "Deviens bénévole sur Overbound, course à obstacles en boucles en Île-de-France : encadrement des obstacles, logistique, accueil. Choisis ton poste et ton créneau, réponse sous 48 h.",
  alternates: {
    canonical: 'https://overbound-race.com/volunteers'
  },
  openGraph: {
    title: "Devenir bénévole sur une course à obstacles à Paris | Overbound",
    description: "Rejoins la tribu bénévole Overbound Race ! Vis l'expérience de l'intérieur. Place offerte sur l'événement de ton choix.",
    url: 'https://overbound-race.com/volunteers',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: ogImageUrl({ title: 'Deviens bénévole', kicker: 'Overbound', photo: 'pride' }),
        width: 1200,
        height: 630,
        alt: 'Bénévoles Overbound, course à obstacles en Île-de-France'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Devenir bénévole sur une course à obstacles à Paris | Overbound",
    description: "Rejoins la tribu bénévole ! Place offerte sur l'événement de ton choix.",
    images: [ogImageUrl({ title: 'Deviens bénévole', kicker: 'Overbound', photo: 'pride' })],
  }
};

export default function VolunteersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
