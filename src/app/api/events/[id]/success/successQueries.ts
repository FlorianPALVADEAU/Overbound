import { useQuery } from '@tanstack/react-query'
import type { Registration } from '@/types/Registration'

export interface EventSuccessResponse {
  registration: Registration & {
    ticket: any
    event: any
    order: any
  }
}

const successDataKey = (eventId: string, sessionId: string) => ['events', eventId, 'success', sessionId] as const

const fetchSuccessData = async (eventId: string, sessionId: string) => {
  const params = new URLSearchParams({ session_id: sessionId })
  const response = await fetch(`/api/events/${eventId}/success?${params.toString()}`, { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer la confirmation')
  }
  return (await response.json()) as EventSuccessResponse
}

export const useEventSuccess = (eventId: string, sessionId: string, options?: { enabled?: boolean }) =>
  useQuery<EventSuccessResponse, Error>({
    queryKey: successDataKey(eventId, sessionId),
    queryFn: () => fetchSuccessData(eventId, sessionId),
    enabled: options?.enabled ?? Boolean(eventId && sessionId),
  })
