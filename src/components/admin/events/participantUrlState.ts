export type ParticipantSort = 'created_at' | 'email'
export type ParticipantCheckIn = 'all' | 'checked_in' | 'not_checked_in'
export type ParticipantDirection = 'asc' | 'desc'
export type ParticipantStatus = 'all' | 'active' | 'cancelled'
export type ParticipantSexFilter = 'all' | 'homme' | 'femme' | 'none'

export interface ParticipantUrlState {
  eventId?: string
  sort: ParticipantSort
  direction: ParticipantDirection
  checkIn: ParticipantCheckIn
  status: ParticipantStatus
  ticketId: string | null
  /** A SAS number as text, or `none`. */
  wave: string | null
  sex: ParticipantSexFilter
  cursor: string | null
  limit: number
  selectedId: string | null
}

interface SearchParamsLike {
  get(name: string): string | null
  toString(): string
}

export const DEFAULT_PARTICIPANT_URL_STATE: Omit<ParticipantUrlState, 'eventId'> = {
  sort: 'created_at',
  direction: 'desc',
  checkIn: 'all',
  status: 'all',
  ticketId: null,
  wave: null,
  sex: 'all',
  cursor: null,
  limit: 50,
  selectedId: null,
}

const LIMITS = new Set([25, 50, 100])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const WAVE = /^(none|[1-9][0-9]?)$/

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
  const status = searchParams.get('status')
  const ticketId = searchParams.get('ticket')
  const wave = searchParams.get('wave')
  const sex = searchParams.get('sex')

  return {
    eventId,
    sort: sort === 'email' ? 'email' : DEFAULT_PARTICIPANT_URL_STATE.sort,
    direction: direction === 'asc' ? 'asc' : DEFAULT_PARTICIPANT_URL_STATE.direction,
    checkIn: checkIn === 'checked_in' || checkIn === 'not_checked_in'
      ? checkIn
      : DEFAULT_PARTICIPANT_URL_STATE.checkIn,
    status: status === 'active' || status === 'cancelled' ? status : DEFAULT_PARTICIPANT_URL_STATE.status,
    ticketId: ticketId && UUID.test(ticketId) ? ticketId : null,
    wave: wave && WAVE.test(wave) ? wave : null,
    sex: sex === 'homme' || sex === 'femme' || sex === 'none' ? sex : DEFAULT_PARTICIPANT_URL_STATE.sex,
    cursor: searchParams.get('cursor') || null,
    limit: LIMITS.has(limit) ? limit : DEFAULT_PARTICIPANT_URL_STATE.limit,
    selectedId: searchParams.get('selected') || null,
  }
}

export function writeParticipantUrlState(
  searchParams: SearchParamsLike,
  state: Pick<ParticipantUrlState, 'sort' | 'direction' | 'checkIn' | 'status' | 'ticketId' | 'wave' | 'sex' | 'cursor' | 'limit' | 'selectedId'>,
): string {
  const next = new URLSearchParams(searchParams.toString())

  if (state.sort === DEFAULT_PARTICIPANT_URL_STATE.sort) next.delete('sort')
  else next.set('sort', state.sort)

  if (state.direction === DEFAULT_PARTICIPANT_URL_STATE.direction) next.delete('direction')
  else next.set('direction', state.direction)

  if (state.checkIn === DEFAULT_PARTICIPANT_URL_STATE.checkIn) next.delete('check_in')
  else next.set('check_in', state.checkIn)

  if (state.status === DEFAULT_PARTICIPANT_URL_STATE.status) next.delete('status')
  else next.set('status', state.status)

  if (state.ticketId) next.set('ticket', state.ticketId)
  else next.delete('ticket')

  if (state.wave) next.set('wave', state.wave)
  else next.delete('wave')

  if (state.sex === DEFAULT_PARTICIPANT_URL_STATE.sex) next.delete('sex')
  else next.set('sex', state.sex)

  if (state.cursor) next.set('cursor', state.cursor)
  else next.delete('cursor')

  if (state.limit === DEFAULT_PARTICIPANT_URL_STATE.limit) next.delete('limit')
  else next.set('limit', String(state.limit))

  if (state.selectedId) next.set('selected', state.selectedId)
  else next.delete('selected')

  // Never carry a free-text search through a shareable URL, even if an older
  // caller used the previous `query` or `search` parameter names.
  next.delete('query')
  next.delete('search')
  next.delete('search_term')

  return next.toString()
}
