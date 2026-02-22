import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Ultra Arena - Premier Backyard à Obstacles au Monde | Course Paris 2026",
  description: "Découvre la Ultra Arena, le premier backyard OCR au monde créé par Overbound Race. Format inédit : élimination progressive, 2km par tour, 10+ obstacles. Course à obstacles Paris 2026 - Inscriptions ouvertes !",
  keywords: [
    "ultra arena",
    "backyard à obstacles",
    "backyard OCR france",
    "course obstacles paris 2026",
    "overbound race",
    "premier backyard OCR monde",
    "course endurance obstacles",
    "élimination progressive OCR",
    "OCR innovant paris",
  ],
  alternates: {
    canonical: 'https://overbound-race.com/about/concept'
  },
  openGraph: {
    title: "Ultra Arena - Premier Backyard à Obstacles au Monde | Overbound Race",
    description: "Le premier backyard OCR au monde ! Format inédit d'élimination progressive. Course à obstacles Paris 2026. Inscriptions ouvertes !",
    url: 'https://overbound-race.com/about/concept',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif',
        width: 1200,
        height: 630,
        alt: 'Ultra Arena - Premier Backyard à Obstacles - Course Paris 2026'
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ultra Arena - Premier Backyard à Obstacles au Monde",
    description: "Découvre le format révolutionnaire d'Overbound : le backyard à obstacles. Course Paris 2026.",
    images: ['/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif'],
  }
};

export default function ConceptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
