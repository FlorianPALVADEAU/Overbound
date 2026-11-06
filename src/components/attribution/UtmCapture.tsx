'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { captureReferralCode } from '@/lib/attribution/referral'
import { captureUtmParams } from '@/lib/attribution/utm'

/**
 * Mounted in the root layout, unconditional of cookie consent — this
 * only reads query params already present in the URL (UTM and the `ref` code
 * of an ambassador link) and stores them in localStorage for later
 * attribution, it sets no third-party
 * cookie and loads no tracking script.
 */
export function UtmCapture() {
  // The layout stays mounted across in-app navigation: re-read the URL on each page change.
  const pathname = usePathname()
  useEffect(() => {
    captureUtmParams()
    captureReferralCode()
  }, [pathname])

  return null
}
