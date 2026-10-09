import type { Metadata } from 'next'
import { AccountNav } from '@/components/account/AccountNav'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    // Mobile pb leaves room for the fixed bottom bar (plus the iOS home indicator); desktop has top tabs.
    <div className="min-h-[70vh] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-16">
      <AccountNav />
      {children}
    </div>
  )
}
