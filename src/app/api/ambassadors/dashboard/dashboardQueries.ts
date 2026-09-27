'use client'

import { useQuery } from '@tanstack/react-query'
import type { AmbassadorDashboardData } from '@/types/Ambassador'

const ambassadorDashboardQueryKey = (viewAs?: string | null, year?: number | null) =>
  ['ambassadors', 'dashboard', viewAs ?? 'self', year ?? 'current']

const fetchAmbassadorDashboard = async (viewAs?: string | null, year?: number | null): Promise<AmbassadorDashboardData> => {
  const params = new URLSearchParams()
  if (viewAs) params.set('view_as', viewAs)
  if (year) params.set('year', String(year))
  const url = `/api/ambassadors/dashboard${params.size ? `?${params}` : ''}`
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de charger le dashboard ambassadeur')
  }
  return (await response.json()) as AmbassadorDashboardData
}

export const useAmbassadorDashboard = (options?: { enabled?: boolean; viewAs?: string | null; year?: number | null }) =>
  useQuery<AmbassadorDashboardData, Error>({
    queryKey: ambassadorDashboardQueryKey(options?.viewAs, options?.year),
    queryFn: () => fetchAmbassadorDashboard(options?.viewAs, options?.year),
    staleTime: 60 * 1000,
    enabled: options?.enabled ?? true,
  })
