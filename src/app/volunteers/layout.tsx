import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Devenir bénévole - Rejoignez la tribu Overbound | Volunteers",
  description: "Rejoignez l'équipe bénévole Overbound Race : encadrement obstacles, logistique, accueil participants. Hébergement, repas et place offerte sur un événement de votre choix.",
  alternates: {
    canonical: 'https://overbound-race.com/volunteers'
  },
  openGraph: {
    title: "Devenir bénévole Overbound Race",
    description: "Être volontaire, c’est vivre l’expérience Overbound de l’intérieur, donner du courage au moment où les coureurs doutent et repartir avec des souvenirs qui restent toute une vie. Tu ne guettes pas le podium, tu crées l’émotion.",
    url: 'https://overbound-race.com/volunteers',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/images/images/two-sporty-mens-staring-at-the-camera-with-pride.avif',
        width: 1200,
        height: 630,
        alt: 'Bénévoles Overbound Race posant avec fierté lors d\'une course d\'obstacles'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Devenir bénévole Overbound Race",
    description: "Être volontaire, c’est vivre l’expérience Overbound de l’intérieur, donner du courage au moment où les coureurs doutent et repartir avec des souvenirs qui restent toute une vie. Tu ne guettes pas le podium, tu crées l’émotion.",
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
