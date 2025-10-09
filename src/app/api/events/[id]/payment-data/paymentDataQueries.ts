import { useQuery } from '@tanstack/react-query'
import type { Event } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'
import type { Upsell } from '@/types/Upsell'

export interface EventPaymentDataResponse {
  event: Event & { tickets?: Ticket[] }
  tickets: Ticket[]
  upsells: Upsell[]
  userEmail: string
}

const paymentDataKey = (eventId: string) => ['events', eventId, 'payment-data'] as const

const fetchEventPaymentData = async (eventId: string) => {
  const response = await fetch(`/api/events/${eventId}/payment-data`, { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer le paiement')
  }
  return (await response.json()) as EventPaymentDataResponse
}

export const useEventPaymentData = (eventId: string, options?: { enabled?: boolean }) =>
  useQuery<EventPaymentDataResponse, Error>({
    queryKey: paymentDataKey(eventId),
    queryFn: () => fetchEventPaymentData(eventId),
    enabled: options?.enabled ?? Boolean(eventId),
  })
