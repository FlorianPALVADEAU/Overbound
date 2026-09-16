import { keepPreviousData, useQuery } from '@tanstack/react-query'
import axiosClient from '../../axiosClient'

export type EventParticipantSort = 'created_at' | 'email'
export type EventParticipantCheckInFilter = 'all' | 'checked_in' | 'not_checked_in'

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
    createdAt: string
  }
  ticket: {
    id: string | null
    name: string | null
    format: 'OPEN' | 'RANKED' | '—'
  }
  departure: {
    startTime: string | null
    waveIndex: number | null
  }
  group: string | null
  payment: {
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
  params.sort ?? 'created_at',
] as const

async function fetchEventParticipants(
  params: EventParticipantsParams,
): Promise<EventParticipantsResponse> {
  const search = new URLSearchParams({
    direction: params.direction ?? 'desc',
    limit: String(params.limit ?? 50),
    check_in: params.checkIn ?? 'all',
    sort: params.sort ?? 'created_at',
  })

  if (params.cursor) search.set('cursor', params.cursor)
  if (params.query?.trim()) search.set('query', params.query.trim())

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
