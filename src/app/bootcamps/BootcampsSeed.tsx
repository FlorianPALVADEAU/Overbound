'use client'

import type { ReactNode } from 'react'
import { useSeedQueryData } from '@/hooks/useSeedQueryData'
import { BOOTCAMPS_QUERY_KEY } from '@/app/api/bootcamps/bootcampsQueries'
import type { Bootcamp } from '@/types/Bootcamp'

/**
 * Seeds the server-read bootcamps. The entry is stale at once (default
 * staleTime), so the browser refetches it to add the visitor's registrations.
 */
export function BootcampsSeed({ data, children }: { data: Bootcamp[]; children: ReactNode }) {
  useSeedQueryData(BOOTCAMPS_QUERY_KEY, data)
  return children
}
