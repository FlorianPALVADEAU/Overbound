import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import axiosClient from '../../axiosClient'
import type { Event } from '@/types/Event'

export interface AdminEventPayload {
  slug: string
  title: string
  subtitle?: string | null
  description?: string | null
  date: string
  location: string
  latitude?: number | null
  longitude?: number | null
  capacity: number
  status: Event['status']
  external_provider?: string | null
  external_event_id?: string | null
  external_url?: string | null
}

interface EventsResponse {
  events: Event[]
}

interface EventResponse {
  event: Event
}

const ADMIN_EVENTS_QUERY_KEY = ['admin', 'events'] as const

const fetchAdminEvents = async (): Promise<Event[]> => {
  const response = await axiosClient.get<EventsResponse>('/admin/events')
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des événements')
  }
  return response.data.events ?? []
}

export const useAdminEvents = () =>
  useQuery<Event[], Error>({
    queryKey: ADMIN_EVENTS_QUERY_KEY,
    queryFn: fetchAdminEvents,
  })

export const createAdminEvent = async (payload: AdminEventPayload): Promise<Event> => {
  const response = await axiosClient.post<EventResponse>('/admin/events', payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la création de l\'événement')
  }
  return response.data.event
}

export const updateAdminEvent = async (
  id: string,
  payload: AdminEventPayload
): Promise<Event> => {
  const response = await axiosClient.put<EventResponse>(`/admin/events/${id}`, payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la mise à jour de l\'événement')
  }
  return response.data.event
}

export const deleteAdminEvent = async (id: string): Promise<void> => {
  try {
    await axiosClient.delete(`/admin/events/${id}`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
    throw error
  }
}

export const adminEventsQueryKey = ADMIN_EVENTS_QUERY_KEY
