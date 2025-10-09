import { useQuery } from '@tanstack/react-query'
import type { SessionProfile, SessionUser } from '@/app/api/session/sessionQueries'

export interface AdminOverviewResponse {
  user: SessionUser
  profile: SessionProfile & { role: string }
  stats: Record<string, unknown> | null
}

export const ADMIN_OVERVIEW_QUERY_KEY = ['admin', 'overview'] as const

const fetchAdminOverview = async (): Promise<AdminOverviewResponse> => {
  const response = await fetch('/api/admin/overview', { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer les informations administrateur')
  }
  return (await response.json()) as AdminOverviewResponse
}

export const useAdminOverview = () =>
  useQuery<AdminOverviewResponse, Error>({
    queryKey: ADMIN_OVERVIEW_QUERY_KEY,
    queryFn: fetchAdminOverview,
    staleTime: 60 * 1000,
  })
