import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bootcamps — Overbound',
  description:
    "Prépare-toi avec les bootcamps Overbound : des sessions d'entraînement encadrées avant la course de septembre 2026.",
}

export default function BootcampsLayout({ children }: { children: React.ReactNode }) {
  return children
}
