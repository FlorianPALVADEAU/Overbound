import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { AdminOverviewData } from '@/lib/admin/overview'

export const ADMIN_OVERVIEW_QUERY_KEY = ['admin', 'overview'] as const

const fetchAdminOverview = async (eventId: string | null): Promise<AdminOverviewData> => {
  const response = await fetch(`/api/admin/overview${eventId ? `?event=${encodeURIComponent(eventId)}` : ''}`, { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de charger le tableau de bord')
  }
  return ((await response.json()) as { overview: AdminOverviewData }).overview
}

export const useAdminOverview = (eventId: string | null) =>
  useQuery<AdminOverviewData, Error>({
    queryKey: [...ADMIN_OVERVIEW_QUERY_KEY, eventId],
    queryFn: () => fetchAdminOverview(eventId),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
