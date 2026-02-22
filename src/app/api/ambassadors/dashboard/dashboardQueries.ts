'use client'

import { useQuery } from '@tanstack/react-query'
import type { AmbassadorDashboardData } from '@/types/Ambassador'

const AMBASSADOR_DASHBOARD_QUERY_KEY = ['ambassadors', 'dashboard'] as const

const fetchAmbassadorDashboard = async (): Promise<AmbassadorDashboardData> => {
  const response = await fetch('/api/ambassadors/dashboard', { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de charger le dashboard ambassadeur')
  }
  return (await response.json()) as AmbassadorDashboardData
}

export const useAmbassadorDashboard = (options?: { enabled?: boolean }) =>
  useQuery<AmbassadorDashboardData, Error>({
    queryKey: AMBASSADOR_DASHBOARD_QUERY_KEY,
    queryFn: fetchAmbassadorDashboard,
    staleTime: 60 * 1000,
    enabled: options?.enabled ?? true,
  })

export const ambassadorDashboardQueryKey = AMBASSADOR_DASHBOARD_QUERY_KEY
