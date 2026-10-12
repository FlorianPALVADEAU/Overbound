'use client'

import type { ReactNode } from 'react'
import { useSeedQueryData } from '@/hooks/useSeedQueryData'
import {
  FEATURED_EVENT_QUERY_KEY,
  type FeaturedEventResponse,
} from '@/app/api/events/featured/featuredEventQueries'

/** Seeds the server-read featured event before the homepage sections render. */
export function FeaturedEventSeed({ data, children }: { data: FeaturedEventResponse; children: ReactNode }) {
  useSeedQueryData(FEATURED_EVENT_QUERY_KEY, data)
  return children
}
