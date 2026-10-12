import type { Metadata } from 'next'

// Orphan detail page, not linked from the site: kept out of the index.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function RaceLayout({ children }: { children: React.ReactNode }) {
  return children
}
