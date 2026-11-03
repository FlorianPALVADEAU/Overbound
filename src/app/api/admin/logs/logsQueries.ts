import { keepPreviousData, useQuery } from '@tanstack/react-query'
import axiosClient from '../../axiosClient'
import type { AdminRequestLog } from '@/types/AdminRequestLog'

export interface AdminLogsParams {
  cursor?: string | null
  limit?: number
  method?: string | null
  status?: number | null
  query?: string
  startDate?: string
  endDate?: string
}

export interface AdminLogsPage {
  logs: AdminRequestLog[]
  page: { limit: number; totalCount: number; nextCursor: string | null }
}

export const ADMIN_LOGS_QUERY_KEY = ['admin', 'logs'] as const

async function fetchAdminLogs(params: AdminLogsParams): Promise<AdminLogsPage> {
  const search = new URLSearchParams({ limit: String(params.limit ?? 100) })
  if (params.cursor) search.set('cursor', params.cursor)
  if (params.method) search.set('method', params.method)
  if (params.status) search.set('status', String(params.status))
  if (params.query?.trim()) search.set('query', params.query.trim())
  if (params.startDate) search.set('startDate', params.startDate)
  if (params.endDate) search.set('endDate', params.endDate)
  const response = await axiosClient.get<AdminLogsPage>(`/admin/logs?${search.toString()}`)
  return response.data
}

export const useAdminLogs = (params: AdminLogsParams) =>
  useQuery<AdminLogsPage, Error>({
    queryKey: [...ADMIN_LOGS_QUERY_KEY, params.cursor ?? null, params.limit ?? 100, params.method ?? '', params.status ?? '', params.query ?? '', params.startDate ?? '', params.endDate ?? ''],
    queryFn: () => fetchAdminLogs(params),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })
