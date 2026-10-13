import type { Metadata } from 'next'

const title = "Bootcamps d'entraînement course à obstacles"
const description =
  "Prépare-toi avec les bootcamps Overbound : des sessions d'entraînement encadrées avant la course de septembre 2026."

export const metadata: Metadata = {
  title,
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
