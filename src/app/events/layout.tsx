import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Événements et courses à obstacles - Inscriptions ouvertes | Overbound Race",
  description: "Découvrez tous nos événements de course d'obstacles (OCR) disponibles. Consultez le calendrier, les lieux, les formats disponibles et inscrivez-vous dès maintenant.",
  alternates: {
    canonical: 'https://overbound-race.com/events'
  },
  openGraph: {
    title: "Événements Overbound Race - Inscriptions aux courses signature",
    description: "Visualisez nos événements sur la carte, trouvez les courses proches de chez vous et inscrivez-vous aux formats qui vous correspondent.",
    url: 'https://overbound-race.com/events',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif',
        width: 1200,
        height: 630,
        alt: 'Coureurs portant des troncs d\'arbres lors d\'une course Overbound Race'
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Événements Overbound Race - Courses OCR en Normandie",
    description: "Consultez le calendrier des courses d'obstacles et inscrivez-vous.",
    images: ['/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif'],
  }
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
