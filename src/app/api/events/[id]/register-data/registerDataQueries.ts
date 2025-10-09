import { useQuery } from '@tanstack/react-query'
import type { Event } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'
import type { Upsell } from '@/types/Upsell'

export interface EventRegisterDataResponse {
  event: Event & { tickets?: Ticket[] }
  tickets: Ticket[]
  upsells: Upsell[]
  availableSpots: number
  user: {
    id: string
    email: string
    fullName: string | null
  }
}

export const eventRegisterDataKey = (eventId: string, ticketId?: string | null) =>
  ['events', eventId, 'register-data', ticketId] as const

const fetchEventRegisterData = async (eventId: string, initialTicketId?: string | null) => {
  const params = new URLSearchParams()
  if (initialTicketId) {
    params.set('ticket', initialTicketId)
  }
  const response = await fetch(
    `/api/events/${eventId}/register-data${params.toString() ? `?${params.toString()}` : ''}`,
    { cache: 'no-store' },
  )
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer les informations de l\'événement')
  }
  return (await response.json()) as EventRegisterDataResponse
}

export const useEventRegisterData = (
  eventId: string,
  initialTicketId?: string | null,
  options?: { enabled?: boolean },
) =>
  useQuery<EventRegisterDataResponse, Error>({
    queryKey: eventRegisterDataKey(eventId, initialTicketId),
    queryFn: () => fetchEventRegisterData(eventId, initialTicketId),
    enabled: options?.enabled ?? Boolean(eventId),
  })
