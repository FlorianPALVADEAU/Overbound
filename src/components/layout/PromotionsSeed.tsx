'use client'

import type { ReactNode } from 'react'
import { useSeedQueryData } from '@/hooks/useSeedQueryData'
import { promotionsQueryKey } from '@/app/api/promotions/promotionsQueries'
import type { Promotion } from '@/types/Promotion'

/**
 * Seeds the server-read promotions before the layout renders, so the banner
 * is in the HTML (no layout shift) and the popup needs no client fetch.
 */
export function PromotionsSeed({ data, children }: { data: Promotion[]; children: ReactNode }) {
  useSeedQueryData(promotionsQueryKey, data)
  return children
}
