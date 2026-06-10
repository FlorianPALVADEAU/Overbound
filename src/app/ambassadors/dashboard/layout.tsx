import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Espace ambassadeur — Overbound',
  description: 'Tableau de bord ambassadeur Overbound.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function AmbassadorDashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
