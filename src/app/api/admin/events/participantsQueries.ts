import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axiosClient from '../../axiosClient'

export type EventParticipantSort = 'created_at' | 'email'
export type EventParticipantCheckInFilter = 'all' | 'checked_in' | 'not_checked_in'
export type EventParticipantStatusFilter = 'all' | 'active' | 'cancelled'

export interface EventParticipantRow {
  id: string
  participant: {
    name: string | null
    email: string
    accountStatus: 'claimed' | 'guest'
  }
  registration: {
    claimStatus: string | null
    approvalStatus: string | null
    checkedIn: boolean
    /** Set when the bib was cancelled and refunded (flexible option); the bib no longer runs. */
    cancelledAt?: string | null
    cancellationReason?: string | null
    bibNumber?: number | null
    paidTicketCents?: number | null
    createdAt: string
  }
  ticket: {
    id: string | null
    name: string | null
    operations: {
      status: 'configured' | 'unconfigured'
      departureMode: 'none' | 'wave' | 'fixed' | null
    }
  }
  departure: {
    startTime: string | null
    waveIndex: number | null
  }
  group: string | null
  payment: {
    orderId?: string | null
    status: string | null
    amountCents: number | null
    currency: string | null
  } | null
}

export interface EventParticipantsParams {
  eventId: string
  cursor?: string | null
  direction?: 'asc' | 'desc'
  limit?: number
  query?: string
  checkIn?: EventParticipantCheckInFilter
  status?: EventParticipantStatusFilter
  ticketId?: string | null
  /** A SAS number as text, or `none`. */
  wave?: string | null
  sort?: EventParticipantSort
}

export interface EventParticipantsResponse {
  participants: EventParticipantRow[]
  page: {
    limit: number
    totalCount: number
    nextCursor: string | null
  }
}

const queryKey = (params: EventParticipantsParams) => [
  'admin',
  'events',
  params.eventId,
  'participants',
  params.cursor ?? null,
  params.direction ?? 'desc',
  params.limit ?? 50,
  params.query ?? '',
  params.checkIn ?? 'all',
  params.status ?? 'all',
  params.ticketId ?? '',
  params.wave ?? '',
  params.sort ?? 'created_at',
] as const

/** Query string shared by the list and the CSV export, so both always describe the same rows. */
export function participantFilterSearch(params: EventParticipantsParams): URLSearchParams {
  const search = new URLSearchParams({ check_in: params.checkIn ?? 'all', status: params.status ?? 'all' })
  if (params.ticketId) search.set('ticket_id', params.ticketId)
  if (params.wave) search.set('wave', params.wave)
  if (params.query?.trim()) search.set('query', params.query.trim())
  return search
}

export const participantsExportUrl = (params: EventParticipantsParams) =>
  `/api/admin/events/${params.eventId}/participants/export?${participantFilterSearch(params).toString()}`

async function fetchEventParticipants(
  params: EventParticipantsParams,
): Promise<EventParticipantsResponse> {
  const search = participantFilterSearch(params)
  search.set('direction', params.direction ?? 'desc')
  search.set('limit', String(params.limit ?? 50))
  search.set('sort', params.sort ?? 'created_at')
  if (params.cursor) search.set('cursor', params.cursor)

  const response = await axiosClient.get<EventParticipantsResponse>(
    `/admin/events/${params.eventId}/participants?${search.toString()}`,
  )

  if (response.status !== 200) {
    throw new Error('Impossible de charger les participants')
  }

  return response.data
}

export function useEventParticipants(params: EventParticipantsParams) {
  return useQuery<EventParticipantsResponse, Error>({
    queryKey: queryKey(params),
    queryFn: () => fetchEventParticipants(params),
    placeholderData: keepPreviousData,
  })
}

export interface EventParticipantOptions {
  tickets: Array<{ id: string; name: string }>
  waves: Array<{ waveIndex: number; startTime: string | null }>
}

export function useEventParticipantOptions(eventId: string) {
  return useQuery<EventParticipantOptions, Error>({
    queryKey: ['admin', 'events', eventId, 'participant-options'],
    queryFn: async () => (await axiosClient.get<EventParticipantOptions>(`/admin/events/${eventId}/participants/options`)).data,
    staleTime: 5 * 60 * 1000,
  })
}

export type AdminRefundChoice =
  | { mode: 'none' }
  | { mode: 'ticket' }
  | { mode: 'custom'; amountCents: number }

const apiMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error
  return new Error(typeof message === 'string' ? message : fallback)
}

/** Refreshes every participants page and the figures that depend on them. */
const useInvalidateParticipants = () => {
  const queryClient = useQueryClient()
  return () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'events'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] }),
  ])
}

export function useCancelRegistration() {
  const invalidate = useInvalidateParticipants()
  return useMutation<{ refundedCents: number; currency: string }, Error, { registrationId: string; reason: string; refund: AdminRefundChoice }>({
    mutationFn: async ({ registrationId, reason, refund }) => {
      try {
        return (await axiosClient.post(`/admin/registrations/${registrationId}/cancel`, { reason, refund })).data
      } catch (error) {
        throw apiMessage(error, 'Annulation impossible.')
      }
    },
    onSuccess: invalidate,
  })
}

export function useResendTicket() {
  return useMutation<{ to: string }, Error, { registrationId: string }>({
    mutationFn: async ({ registrationId }) => {
      try {
        return (await axiosClient.post(`/admin/registrations/${registrationId}/resend-ticket`)).data
      } catch (error) {
        throw apiMessage(error, 'Envoi impossible.')
      }
    },
  })
}
