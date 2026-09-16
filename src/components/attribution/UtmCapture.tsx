'use client'

import { useEffect } from 'react'
import { captureUtmParams } from '@/lib/attribution/utm'

/**
 * Mounted once in the root layout, unconditional of cookie consent — this
 * only reads query params already present in the URL and stores them in
 * localStorage for later campaign attribution, it sets no third-party
 * cookie and loads no tracking script.
 */
export function UtmCapture() {
  useEffect(() => {
    captureUtmParams()
  }, [])

  return null
}
