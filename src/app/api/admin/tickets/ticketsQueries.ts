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
}

interface TicketsResponse {
  tickets: Ticket[]
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

export const deleteAdminTicket = async (id: string): Promise<void> => {
  try {
    await axiosClient.delete(`/admin/tickets/${id}`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
    throw error
  }
}

export const adminTicketsQueryKey = ADMIN_TICKETS_QUERY_KEY
