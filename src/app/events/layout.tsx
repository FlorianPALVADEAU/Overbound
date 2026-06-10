import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Événements Course à Obstacles Paris 2026 | Inscriptions Overbound Race",
  description: "Inscris-toi aux courses à obstacles Overbound Race Paris 2026 ! Ultra Arena (backyard OCR), formats Origin et Horizon. Calendrier des événements OCR en Île-de-France. Inscriptions ouvertes !",
  keywords: [
    "course à obstacles paris 2026",
    "inscription course obstacles",
    "événements OCR paris",
    "calendrier course obstacles 2026",
    "overbound race inscription",
    "ultra arena inscription",
    "backyard à obstacles inscription",
    "course obstacles île-de-france",
    "OCR france 2026",
  ],
  alternates: {
    canonical: 'https://overbound-race.com/events'
  },
  openGraph: {
    title: "Événements Course à Obstacles Paris 2026 | Overbound Race",
    description: "Calendrier et inscriptions courses à obstacles Overbound Race Paris 2026. Ultra Arena, Origin, Horizon. Backyard OCR. Inscriptions ouvertes !",
    url: 'https://overbound-race.com/events',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif',
        width: 1200,
        height: 630,
        alt: 'Course à obstacles Paris 2026 - Overbound Race'
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Événements Course à Obstacles Paris 2026",
    description: "Inscris-toi aux courses à obstacles Overbound Race. Calendrier 2026 et inscriptions ouvertes !",
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
