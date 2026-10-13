import type { Metadata } from 'next'

// Post-purchase confirmation: personal, never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function EventSuccessLayout({ children }: { children: React.ReactNode }) {
  return children
}
