import type { Metadata } from 'next'

const title = "Bootcamp course à obstacles à Paris : s'entraîner avant la course"
const description =
  "Bootcamps Overbound : des séances d'entraînement encadrées pour préparer une course à obstacles en boucles en Île-de-France. Inscription en un clic."

export const metadata: Metadata = {
  title: { absolute: `${title} | Overbound` },
  description,
  alternates: { canonical: '/bootcamps' },
  openGraph: {
    title: `${title} | Overbound Race`,
    description,
    url: '/bootcamps',
    type: 'website',
  },
}

export default function BootcampsLayout({ children }: { children: React.ReactNode }) {
  return children
}
