import type { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
  title: "Équipe Overbound Race | Course à Obstacles Paris 2026",
  description: "Rencontre l'équipe Overbound Race : organisateurs, coachs et bénévoles passionnés derrière la course à obstacles Paris 2026.",
  alternates: {
    canonical: 'https://overbound-race.com/about/team'
  },
  openGraph: {
    title: "Équipe Overbound Race | Course à Obstacles Paris 2026",
    description: "L'équipe passionnée derrière les courses d'obstacles Overbound Race.",
    url: 'https://overbound-race.com/about/team',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/images/overbound-headband-on-chains-with-grass-in-background.avif',
        width: 1200,
        height: 630,
        alt: 'Équipe Overbound Race',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Équipe Overbound Race",
    description: "Les équipes derrière la course à obstacles Paris 2026.",
    images: ['/images/images/overbound-headband-on-chains-with-grass-in-background.avif'],
  },
};

const page = () => {
  return (
    <div>About page A</div>
  )
}

export default page
