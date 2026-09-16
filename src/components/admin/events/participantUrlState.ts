export type ParticipantSort = 'created_at' | 'email'
export type ParticipantCheckIn = 'all' | 'checked_in' | 'not_checked_in'
export type ParticipantDirection = 'asc' | 'desc'

export interface ParticipantUrlState {
  eventId?: string
  sort: ParticipantSort
  direction: ParticipantDirection
  checkIn: ParticipantCheckIn
  cursor: string | null
  limit: number
}

interface SearchParamsLike {
  get(name: string): string | null
  toString(): string
}

export const DEFAULT_PARTICIPANT_URL_STATE: Omit<ParticipantUrlState, 'eventId'> = {
  sort: 'created_at',
  direction: 'desc',
  checkIn: 'all',
  cursor: null,
  limit: 50,
}

const LIMITS = new Set([25, 50, 100])

/**
 * Only operational, non-PII list state is serialized. In particular, the
 * free-text participant search is deliberately absent from this contract.
 */
export function parseParticipantUrlState(
  searchParams: SearchParamsLike,
  eventId?: string,
): ParticipantUrlState {
  const sort = searchParams.get('sort')
  const direction = searchParams.get('direction')
  const checkIn = searchParams.get('check_in')
  const limit = Number(searchParams.get('limit'))

  return {
    eventId,
    sort: sort === 'email' ? 'email' : DEFAULT_PARTICIPANT_URL_STATE.sort,
    direction: direction === 'asc' ? 'asc' : DEFAULT_PARTICIPANT_URL_STATE.direction,
    checkIn: checkIn === 'checked_in' || checkIn === 'not_checked_in'
      ? checkIn
      : DEFAULT_PARTICIPANT_URL_STATE.checkIn,
    cursor: searchParams.get('cursor') || null,
    limit: LIMITS.has(limit) ? limit : DEFAULT_PARTICIPANT_URL_STATE.limit,
  }
}

export function writeParticipantUrlState(
  searchParams: SearchParamsLike,
  state: Pick<ParticipantUrlState, 'sort' | 'direction' | 'checkIn' | 'cursor' | 'limit'>,
): string {
  const next = new URLSearchParams(searchParams.toString())

  if (state.sort === DEFAULT_PARTICIPANT_URL_STATE.sort) next.delete('sort')
  else next.set('sort', state.sort)

  if (state.direction === DEFAULT_PARTICIPANT_URL_STATE.direction) next.delete('direction')
  else next.set('direction', state.direction)

  if (state.checkIn === DEFAULT_PARTICIPANT_URL_STATE.checkIn) next.delete('check_in')
  else next.set('check_in', state.checkIn)

  if (state.cursor) next.set('cursor', state.cursor)
  else next.delete('cursor')

  if (state.limit === DEFAULT_PARTICIPANT_URL_STATE.limit) next.delete('limit')
  else next.set('limit', String(state.limit))

  // Never carry a free-text search through a shareable URL, even if an older
  // caller used the previous `query` or `search` parameter names.
  next.delete('query')
  next.delete('search')
  next.delete('search_term')

  return next.toString()
}
