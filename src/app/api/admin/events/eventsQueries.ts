import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import axiosClient from '../../axiosClient'
import type { Event } from '@/types/Event'

export interface AdminEventSummary extends Event {
  registrations_count?: number
  volunteer_applications_count?: number
}

interface AdminEventDetailStats {
  registrations: {
    total: number
    approved: number
    pending: number
    checked_in: number
  }
  volunteers: {
    total: number
  }
  revenue: {
    total_cents: number
    currency: string | null
  }
}

export interface AdminEventDetailResponse {
  event: Event
  stats: AdminEventDetailStats
}

export interface AdminEventVolunteer {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  availability: string | null
  preferred_mission: string | null
  experience: string | null
  motivations: string | null
  event_id: string | null
  event_snapshot: {
    id: string | null
    title: string | null
    date: string | null
    location: string | null
  } | null
  submitted_at: string | null
}

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
  events: AdminEventSummary[]
}

interface EventResponse {
  event: Event
}

const ADMIN_EVENTS_QUERY_KEY = ['admin', 'events'] as const
const ADMIN_EVENT_DETAIL_QUERY_KEY = (eventId: string) => ['admin', 'events', eventId] as const
const ADMIN_EVENT_VOLUNTEERS_QUERY_KEY = (eventId: string) => ['admin', 'events', eventId, 'volunteers'] as const

const fetchAdminEvents = async (): Promise<AdminEventSummary[]> => {
  const response = await axiosClient.get<EventsResponse>('/admin/events')
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des événements')
  }
  return response.data.events?.map((event) => ({
    ...event,
    registrations_count: event.registrations_count ?? 0,
    volunteer_applications_count: event.volunteer_applications_count ?? 0,
  })) ?? []
}

export const useAdminEvents = () =>
  useQuery<AdminEventSummary[], Error>({
    queryKey: ADMIN_EVENTS_QUERY_KEY,
    queryFn: fetchAdminEvents,
  })

const fetchAdminEventDetail = async (eventId: string): Promise<AdminEventDetailResponse> => {
  const response = await axiosClient.get<AdminEventDetailResponse>(`/admin/events/${eventId}`)
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement de l’événement')
  }
  return {
    event: response.data.event,
    stats: {
      registrations: {
        total: response.data.stats?.registrations?.total ?? 0,
        approved: response.data.stats?.registrations?.approved ?? 0,
        pending: response.data.stats?.registrations?.pending ?? 0,
        checked_in: response.data.stats?.registrations?.checked_in ?? 0,
      },
      volunteers: {
        total: response.data.stats?.volunteers?.total ?? 0,
      },
      revenue: {
        total_cents: response.data.stats?.revenue?.total_cents ?? 0,
        currency: response.data.stats?.revenue?.currency ?? null,
      },
    },
  }
}

const fetchAdminEventVolunteers = async (eventId: string): Promise<AdminEventVolunteer[]> => {
  const response = await axiosClient.get<{ volunteers: AdminEventVolunteer[] }>(
    `/admin/events/${eventId}/volunteers`,
  )
  if (response.status !== 200) {
    throw new Error('Erreur lors du chargement des bénévoles')
  }
  return response.data.volunteers ?? []
}

export const useAdminEventDetail = (eventId?: string | null) =>
  useQuery<AdminEventDetailResponse, Error>({
    queryKey: eventId ? ADMIN_EVENT_DETAIL_QUERY_KEY(eventId) : ['admin', 'events', 'detail'],
    queryFn: () => fetchAdminEventDetail(eventId as string),
    enabled: Boolean(eventId),
  })

export const useAdminEventVolunteers = (eventId?: string | null) =>
  useQuery<AdminEventVolunteer[], Error>({
    queryKey: eventId ? ADMIN_EVENT_VOLUNTEERS_QUERY_KEY(eventId) : ['admin', 'events', 'volunteers'],
    queryFn: () => fetchAdminEventVolunteers(eventId as string),
    enabled: Boolean(eventId),
  })

export const createAdminEvent = async (payload: AdminEventPayload): Promise<AdminEventSummary> => {
  const response = await axiosClient.post<EventResponse>('/admin/events', payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la création de l\'événement')
  }
  return {
    ...response.data.event,
    registrations_count: 0,
    volunteer_applications_count: 0,
  }
}

export const updateAdminEvent = async (
  id: string,
  payload: AdminEventPayload
): Promise<AdminEventSummary> => {
  const response = await axiosClient.put<EventResponse>(`/admin/events/${id}`, payload)
  if (response.status !== 200) {
    throw new Error('Erreur lors de la mise à jour de l\'événement')
  }
  return {
    ...response.data.event,
    registrations_count: 0,
    volunteer_applications_count: 0,
  }
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
