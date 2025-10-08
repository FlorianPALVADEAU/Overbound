import { useQuery } from '@tanstack/react-query'
import type { AdminRequestLog } from '@/types/AdminRequestLog'

export interface AdminLogsFilters {
  method?: string
  status?: string
  userEmail?: string
  actionType?: string
  search?: string
  startDate?: string
  endDate?: string
  limit?: number
}

interface LogsResponse {
  logs: AdminRequestLog[]
  count: number
}

const ADMIN_LOGS_QUERY_KEY = ['admin', 'logs'] as const

const buildQueryString = (filters: AdminLogsFilters) => {
  const params = new URLSearchParams()
  if (filters.method) params.set('method', filters.method)
  if (filters.status) params.set('status', filters.status)
  if (filters.userEmail) params.set('userEmail', filters.userEmail)
  if (filters.actionType) params.set('actionType', filters.actionType)
  if (filters.search) params.set('search', filters.search)
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  if (filters.limit) params.set('limit', String(filters.limit))
  return params.toString()
}

const fetchAdminLogs = async (filters: AdminLogsFilters): Promise<LogsResponse> => {
  const query = buildQueryString(filters)
  const response = await fetch(`/api/admin/logs${query ? `?${query}` : ''}`)
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer les logs')
  }
  const data = (await response.json()) as LogsResponse
  return data
}

export const useAdminLogs = (filters: AdminLogsFilters) =>
  useQuery<LogsResponse, Error>({
    queryKey: [...ADMIN_LOGS_QUERY_KEY, filters],
    queryFn: () => fetchAdminLogs(filters),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

export { ADMIN_LOGS_QUERY_KEY }
