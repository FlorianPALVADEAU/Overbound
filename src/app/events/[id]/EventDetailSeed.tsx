'use client'

import type { ReactNode } from 'react'
import { useSeedQueryData } from '@/hooks/useSeedQueryData'
import { eventDetailKey, type EventDetailResponse } from '@/app/api/events/[id]/eventDetailQueries'
import type { PublicEventDetail } from '@/lib/events/loadEventDetail'

/**
 * Seeds the server-read public event before the page renders. The visitor
 * part is empty here; the seeded entry is stale at once (default staleTime),
 * so the browser refetches it after hydration and adds the visitor's own
 * registration without blocking the first render.
 */
export function EventDetailSeed({
  eventId,
  data,
  children,
}: {
  eventId: string
  data: PublicEventDetail
  children: ReactNode
}) {
  const seed: EventDetailResponse = { ...data, existingRegistration: null, user: null }
  useSeedQueryData(eventDetailKey(eventId), seed)
  return children
}
