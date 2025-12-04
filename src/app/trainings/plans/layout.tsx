import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Plans d'entraînement OCR - Programmes gratuits | Overbound Race",
  description: "Téléchargez gratuitement nos plans d'entraînement OCR : Sprint (6km), Horizon (12km), Ultra Arena. Programmes de 4 à 12 semaines adaptés à tous les niveaux par nos coaches.",
  alternates: {
    canonical: 'https://overbound-race.com/trainings/plans'
  },
  openGraph: {
    title: "Plans d'entraînement OCR gratuits - Overbound Race",
    description: "Programmes d'entraînement professionnels pour courses d'obstacles.",
    url: 'https://overbound-race.com/trainings/plans',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/images/images/sport-coach-warming-up-participant.avif',
        width: 1200,
        height: 630,
        alt: "Coureurs lors d'un échauffement avant une course Overbound Race"
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Plans d'entraînement OCR gratuits - Overbound Race",
    description: "Programmes d'entraînement professionnels pour courses d'obstacles.",
    images: ['/images/images/sport-coach-warming-up-participant.avif'],
  }
};

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
