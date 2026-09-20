export interface SearchParamsLike {
  get(name: string): string | null
  toString(): string
}

export interface OperationsListUrlState {
  cursor: string | null
  sort: string | null
  direction: 'asc' | 'desc' | null
  limit: number
  selectedId: string | null
  filters: Record<string, string>
}

export interface OperationsListUrlOptions {
  filterIds?: readonly string[]
  defaultLimit?: number
  allowedLimits?: ReadonlySet<number>
}

const DEFAULT_LIMIT = 50
const DEFAULT_LIMITS = new Set([25, 50, 100])

/**
 * Parses only operational state. Search text is intentionally excluded: callers
 * may keep it local when it could contain personally identifiable information.
 */
export function parseOperationsListUrlState(
  searchParams: SearchParamsLike,
  options: OperationsListUrlOptions = {},
): OperationsListUrlState {
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT
  const allowedLimits = options.allowedLimits ?? DEFAULT_LIMITS
  const candidateLimit = Number(searchParams.get('limit'))
  const filters: Record<string, string> = {}

  for (const filterId of options.filterIds ?? []) {
    const value = searchParams.get(`filter_${filterId}`)
    if (value) filters[filterId] = value
  }

  const direction = searchParams.get('direction')
  return {
    cursor: searchParams.get('cursor') || null,
    sort: searchParams.get('sort') || null,
    direction: direction === 'asc' || direction === 'desc' ? direction : null,
    limit: allowedLimits.has(candidateLimit) ? candidateLimit : defaultLimit,
    selectedId: searchParams.get('selected') || null,
    filters,
  }
}

export function writeOperationsListUrlState(
  searchParams: SearchParamsLike,
  state: OperationsListUrlState,
  options: OperationsListUrlOptions = {},
): string {
  const next = new URLSearchParams(searchParams.toString())
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT

  setOrDelete(next, 'cursor', state.cursor)
  setOrDelete(next, 'sort', state.sort)
  setOrDelete(next, 'direction', state.direction)
  setOrDelete(next, 'selected', state.selectedId)

  if (state.limit === defaultLimit) next.delete('limit')
  else next.set('limit', String(state.limit))

  for (const filterId of options.filterIds ?? []) {
    setOrDelete(next, `filter_${filterId}`, state.filters[filterId] || null)
  }

  return next.toString()
}

function setOrDelete(params: URLSearchParams, key: string, value: string | null) {
  if (value) params.set(key, value)
  else params.delete(key)
}
