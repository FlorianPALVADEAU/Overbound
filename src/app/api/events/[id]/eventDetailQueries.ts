import { useQuery } from '@tanstack/react-query'
import type { Event } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'

export interface EventDetailResponse {
  event: Event & { tickets?: Ticket[] }
  availableSpots: number
  existingRegistration: {
    id: string
    checked_in: boolean
    tickets: Array<{ name: string | null }> | null
  } | null
  user: {
    id: string
    email: string
  } | null
}

const eventDetailKey = (id: string) => ['events', id, 'detail'] as const

const fetchEventDetail = async (id: string) => {
  const response = await fetch(`/api/events/${id}`, { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || "Impossible de récupérer l'événement")
  }
  return (await response.json()) as EventDetailResponse
}

export const useEventDetail = (id: string) =>
  useQuery<EventDetailResponse, Error>({
    queryKey: eventDetailKey(id),
    queryFn: () => fetchEventDetail(id),
    enabled: Boolean(id),
  })
