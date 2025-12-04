import type { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
  title: "Notre Équipe - Les membres de la tribu Overbound | À propos",
  description: "Rencontrez l'équipe Overbound Race : organisateurs, coaches et bénévoles passionnés qui créent les meilleures courses d'obstacles OCR en France.",
  alternates: {
    canonical: 'https://overbound-race.com/about/team'
  },
  openGraph: {
    title: "Notre Équipe - Overbound Race",
    description: "L'équipe passionnée derrière les courses d'obstacles Overbound.",
    url: 'https://overbound-race.com/about/team',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
  },
};

const page = () => {
  return (
    <div>About page A</div>
  )
}

export default page