'use client'

import { useQuery } from '@tanstack/react-query'
import type { AmbassadorDashboardData } from '@/types/Ambassador'

const ambassadorDashboardQueryKey = (viewAs?: string | null) =>
  viewAs ? ['ambassadors', 'dashboard', viewAs] : ['ambassadors', 'dashboard']

const fetchAmbassadorDashboard = async (viewAs?: string | null): Promise<AmbassadorDashboardData> => {
  const url = viewAs
    ? `/api/ambassadors/dashboard?view_as=${encodeURIComponent(viewAs)}`
    : '/api/ambassadors/dashboard'
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de charger le dashboard ambassadeur')
  }
  return (await response.json()) as AmbassadorDashboardData
}

export const useAmbassadorDashboard = (options?: { enabled?: boolean; viewAs?: string | null }) =>
  useQuery<AmbassadorDashboardData, Error>({
    queryKey: ambassadorDashboardQueryKey(options?.viewAs),
    queryFn: () => fetchAmbassadorDashboard(options?.viewAs),
    staleTime: 60 * 1000,
    enabled: options?.enabled ?? true,
  })

