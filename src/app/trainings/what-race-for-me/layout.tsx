import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Quelle Course à Obstacles Choisir ? | Guide Overbound Race Paris 2026",
  description: "Trouve le format de course à obstacles qui te correspond : Origin (6km), Horizon (12km) ou Ultra Arena (backyard à obstacles). Questionnaire personnalisé. Course obstacles Paris 2026.",
  keywords: [
    "quelle course obstacles choisir",
    "course obstacles débutant",
    "course obstacles paris 2026",
    "format OCR débutant",
    "overbound race format",
    "ultra arena backyard",
    "questionnaire course obstacles",
    "préparation course obstacles",
  ],
  alternates: {
    canonical: 'https://overbound-race.com/trainings/what-race-for-me'
  },
  openGraph: {
    title: "Quelle Course à Obstacles Choisir ? | Overbound Race Paris 2026",
    description: "Trouve ton format : Origin, Horizon ou Ultra Arena. Questionnaire personnalisé. Course à obstacles Paris 2026.",
    url: 'https://overbound-race.com/trainings/what-race-for-me',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/images/images/old-lady-ramping-below-barbed-wires.avif',
        width: 1200,
        height: 630,
        alt: 'Quelle course à obstacles choisir - Overbound Race Paris 2026'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Quelle Course à Obstacles Choisir ? | Overbound Race",
    description: "Trouve ton format idéal avec notre questionnaire. Course obstacles Paris 2026.",
    images: ['/images/images/old-lady-ramping-below-barbed-wires.avif'],
  },
};

export default function WhatRaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
