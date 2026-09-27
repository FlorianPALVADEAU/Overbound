import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import axiosClient from '../../axiosClient'
import type { Ticket } from '@/types/Ticket'

export interface AdminTicketPayload {
  event_id: string
  race_id?: string | null
  name: string
  description?: string | null
  price: number
  currency: Ticket['currency']
  max_participants: number
  requires_document: boolean
  document_types: string[]
  operations_config?: Ticket['operations_config'] | null
}

interface TicketsResponse {
  tickets: Ticket[]
}

export type AdminTicketsPageParams = {
  cursor?: string | null
  limit?: 25 | 50 | 100
  query?: string
  eventId?: string
  sort?: 'created_at' | 'name' | 'final_price_cents'
  direction?: 'asc' | 'desc'
}

export interface AdminTicketsPageResponse {
  tickets: Ticket[]
  page: {
    limit: number
    totalCount: number
    nextCursor: string | null
  }
}

interface TicketResponse {
  ticket: Ticket
}

const ADMIN_TICKETS_QUERY_KEY = ['admin', 'tickets'] as const

const fetchAdminTickets = async (): Promise<Ticket[]> => {
  const response = await axiosClient.get<TicketsResponse>('/admin/tickets')
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des tickets')
  }
  return response.data.tickets ?? []
}

export const useAdminTickets = () =>
  useQuery<Ticket[], Error>({
    queryKey: ADMIN_TICKETS_QUERY_KEY,
    queryFn: fetchAdminTickets,
  })

const fetchAdminTicketsPage = async (
  params: AdminTicketsPageParams,
): Promise<AdminTicketsPageResponse> => {
  const search = new URLSearchParams({
    paginated: 'true',
    limit: String(params.limit ?? 50),
    sort: params.sort ?? 'created_at',
    direction: params.direction ?? 'desc',
  })
  if (params.cursor) search.set('cursor', params.cursor)
  if (params.query?.trim()) search.set('query', params.query.trim())
  if (params.eventId) search.set('event_id', params.eventId)

  const response = await axiosClient.get<AdminTicketsPageResponse>(`/admin/tickets?${search.toString()}`)
  if (response.status !== 200) throw new Error('Erreur lors du chargement des tickets')
  return response.data
}

export const useAdminTicketsPage = (params: AdminTicketsPageParams = {}) =>
  useQuery<AdminTicketsPageResponse, Error>({
    queryKey: [...ADMIN_TICKETS_QUERY_KEY, 'page', params],
    queryFn: () => fetchAdminTicketsPage(params),
  })

export const createAdminTicket = async (
  payload: AdminTicketPayload
): Promise<Ticket> => {
  const response = await axiosClient.post<TicketResponse>('/admin/tickets', payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la création du ticket')
  }
  return response.data.ticket
}

export const updateAdminTicket = async (
  id: string,
  payload: AdminTicketPayload
): Promise<Ticket> => {
  const response = await axiosClient.put<TicketResponse>(`/admin/tickets/${id}`, payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la mise à jour du ticket')
  }
  return response.data.ticket
}

export interface DeleteTicketError {
  error: string
  registrationCount?: number
  requiresConfirmation?: boolean
}

export const deleteAdminTicket = async (id: string, force = false): Promise<void> => {
  try {
    const url = force ? `/admin/tickets/${id}?force=true` : `/admin/tickets/${id}`
    await axiosClient.delete(url)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as DeleteTicketError | undefined
      if (data?.requiresConfirmation) {
        const customError = new Error(data.error) as Error & { registrationCount?: number; requiresConfirmation?: boolean }
        customError.registrationCount = data.registrationCount
        customError.requiresConfirmation = data.requiresConfirmation
        throw customError
      }
      throw new Error(data?.error || 'Erreur lors de la suppression')
    }
    throw error
  }
}

export const adminTicketsQueryKey = ADMIN_TICKETS_QUERY_KEY
