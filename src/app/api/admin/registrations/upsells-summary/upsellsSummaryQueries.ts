import { useQuery } from '@tanstack/react-query'
import type { UpsellSummaryRow } from './route'

interface UpsellsSummaryResponse {
  summary: UpsellSummaryRow[]
}

export const upsellsSummaryQueryKey = (eventId?: string) =>
  ['admin-upsells-summary', eventId ?? 'all'] as const

const fetchUpsellsSummary = async (
  eventId?: string
): Promise<UpsellsSummaryResponse> => {
  const url = eventId
    ? `/api/admin/registrations/upsells-summary?event_id=${eventId}`
    : '/api/admin/registrations/upsells-summary'
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erreur chargement upsells')
  return res.json()
}

export const useUpsellsSummary = (eventId?: string) =>
  useQuery<UpsellsSummaryResponse>({
    queryKey: upsellsSummaryQueryKey(eventId),
    queryFn: () => fetchUpsellsSummary(eventId),
    staleTime: 60_000,
  })
