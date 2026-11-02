import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import axiosClient from '../../axiosClient'
import type { OrderListItem, OrderListStatus } from '@/lib/admin/ordersList'

export interface AdminOrdersParams {
  cursor?: string | null
  limit?: number
  status?: OrderListStatus | null
  query?: string
  eventId?: string | null
}

export interface AdminOrdersPage {
  orders: OrderListItem[]
  page: { limit: number; totalCount: number; nextCursor: string | null }
}

async function fetchAdminOrders(params: AdminOrdersParams): Promise<AdminOrdersPage> {
  const search = new URLSearchParams({ limit: String(params.limit ?? 50) })
  if (params.cursor) search.set('cursor', params.cursor)
  if (params.status) search.set('status', params.status)
  if (params.query?.trim()) search.set('query', params.query.trim())
  if (params.eventId) search.set('event', params.eventId)
  const response = await axiosClient.get<AdminOrdersPage>(`/admin/orders?${search.toString()}`)
  return response.data
}

export const useAdminOrders = (params: AdminOrdersParams) =>
  useQuery<AdminOrdersPage, Error>({
    queryKey: ['admin', 'orders', params.cursor ?? null, params.limit ?? 50, params.status ?? '', params.query ?? '', params.eventId ?? ''],
    queryFn: () => fetchAdminOrders(params),
    placeholderData: keepPreviousData,
  })

export function useResendReceipt() {
  return useMutation<unknown, Error, { paymentIntentId: string }>({
    mutationFn: async ({ paymentIntentId }) => {
      try {
        return (await axiosClient.post('/admin/emails/receipt', { paymentIntentId })).data
      } catch (error) {
        const message = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error
        throw new Error(typeof message === 'string' ? message : 'Envoi impossible.')
      }
    },
  })
}
