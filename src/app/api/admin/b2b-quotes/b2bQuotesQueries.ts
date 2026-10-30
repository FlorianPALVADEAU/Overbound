import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axiosClient from '../../axiosClient'
import type { QuoteStatus } from '@/lib/b2b/quoteRequest'

export interface AdminQuoteRequest {
  id: string
  created_at: string
  company_name: string
  full_name: string
  email: string
  phone: string | null
  team_size: string
  project_type: string
  message: string | null
  utm: Record<string, string> | null
  source: string
  status: QuoteStatus
}

export interface AdminQuoteRequestsParams {
  cursor?: string | null
  limit?: 25 | 50 | 100
  query?: string
  status?: 'all' | QuoteStatus
}

export interface AdminQuoteRequestsResponse {
  requests: AdminQuoteRequest[]
  page: { limit: number; totalCount: number; nextCursor: string | null }
}

export const ADMIN_B2B_QUOTES_QUERY_KEY = ['admin', 'b2b-quotes'] as const

export const useAdminQuoteRequests = (params: AdminQuoteRequestsParams = {}) =>
  useQuery<AdminQuoteRequestsResponse, Error>({
    queryKey: [...ADMIN_B2B_QUOTES_QUERY_KEY, params],
    queryFn: async () => {
      const search = new URLSearchParams({ limit: String(params.limit ?? 50), status: params.status ?? 'all' })
      if (params.cursor) search.set('cursor', params.cursor)
      if (params.query?.trim()) search.set('query', params.query.trim())
      const response = await axiosClient.get<AdminQuoteRequestsResponse>(`/admin/b2b-quotes?${search.toString()}`)
      return response.data
    },
  })

export const useUpdateQuoteRequestStatus = () => {
  const queryClient = useQueryClient()
  return useMutation<AdminQuoteRequest, Error, { id: string; status: QuoteStatus }>({
    mutationFn: async ({ id, status }) => {
      const response = await axiosClient.patch<{ request: AdminQuoteRequest }>(`/admin/b2b-quotes/${id}`, { status })
      return response.data.request
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_B2B_QUOTES_QUERY_KEY }),
  })
}
