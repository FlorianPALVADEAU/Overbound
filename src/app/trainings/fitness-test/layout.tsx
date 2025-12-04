import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Test de condition physique OCR - Évaluez votre niveau | Overbound Race",
  description: "Testez votre condition physique pour les courses d'obstacles : circuit OCR, gainage, tractions. Obtenez votre score et des recommandations personnalisées de nos coaches.",
  alternates: {
    canonical: 'https://overbound-race.com/trainings/fitness-test'
  },
  openGraph: {
    title: "Test de condition physique OCR - Overbound Race",
    description: "Évaluez votre niveau et recevez des recommandations d'entraînement.",
    url: 'https://overbound-race.com/trainings/fitness-test',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/images/images/warm-up-of-many-participants-in-the-grass.avif',
        width: 1200,
        height: 630,
        alt: 'Coureurs lors d\'un échauffement dans l\'herbe avant une course Overbound Race'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Test de condition physique OCR - Overbound Race",
    description: "Évaluez votre niveau et recevez des recommandations d'entraînement.",
    images: ['/images/images/warm-up-of-many-participants-in-the-grass.avif'],
  },
};

export default function FitnessTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
