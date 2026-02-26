import { useQuery } from '@tanstack/react-query'
import type { Registration } from '@/types/Registration'

export interface EventSuccessResponse {
  registration: Registration & {
    ticket: any
    event: any
    order: any
  }
}

const successDataKey = (eventId: string, reference: string) =>
  ['events', eventId, 'success', reference] as const

const fetchSuccessData = async (
  eventId: string,
  reference: { sessionId?: string; paymentIntentId?: string; registrationId?: string },
) => {
  const params = new URLSearchParams()
  if (reference.sessionId) {
    params.set('session_id', reference.sessionId)
  }
  if (reference.paymentIntentId) {
    params.set('payment_intent', reference.paymentIntentId)
  }
  if (reference.registrationId) {
    params.set('registration_id', reference.registrationId)
  }
  const response = await fetch(`/api/events/${eventId}/success?${params.toString()}`, { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer la confirmation')
  }
  return (await response.json()) as EventSuccessResponse
}

export const useEventSuccess = (
  eventId: string,
  reference: { sessionId?: string; paymentIntentId?: string; registrationId?: string },
  options?: { enabled?: boolean },
) =>
  useQuery<EventSuccessResponse, Error>({
    queryKey: successDataKey(
      eventId,
      reference.registrationId ?? reference.sessionId ?? reference.paymentIntentId ?? '',
    ),
    queryFn: () => fetchSuccessData(eventId, reference),
    enabled: options?.enabled ?? Boolean(
      eventId && (reference.registrationId || reference.sessionId || reference.paymentIntentId),
    ),
  })
