import { z } from 'zod'
import { parisDayKey } from './overview'
import { sanitizeSearchTerm } from './participantsQuery'

export const LOG_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE', 'GET'] as const
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const logsQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(25).max(200).default(100),
  method: z.enum(LOG_METHODS).optional(),
  status: z.coerce.number().int().min(100).max(599).optional(),
  query: z.string().trim().min(1).max(160).optional(),
  startDate: day.optional(),
  endDate: day.optional(),
})
export type LogsQuery = z.infer<typeof logsQuerySchema>

/** First instant of a Paris calendar day (`YYYY-MM-DD`), daylight saving included. */
export function parisDayStart(dayKey: string): Date {
  const candidates = ['+01:00', '+02:00'].map((offset) => new Date(`${dayKey}T00:00:00${offset}`))
  const start = candidates.find(
    (candidate) => !Number.isNaN(candidate.getTime()) && parisDayKey(candidate) === dayKey && parisDayKey(new Date(candidate.getTime() - 1)) !== dayKey,
  )
  if (!start) throw new Error('Date invalide')
  return start
}

/** Last millisecond of a Paris calendar day. */
export function parisDayEnd(dayKey: string): Date {
  const next = new Date(`${dayKey}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return new Date(parisDayStart(next.toISOString().slice(0, 10)).getTime() - 1)
}

interface FilterChain {
  eq(column: string, value: string | number): FilterChain
  gte(column: string, value: string): FilterChain
  lte(column: string, value: string): FilterChain
  or(filters: string): FilterChain
}

const SEARCHED_COLUMNS = ['path', 'summary', 'user_email', 'action_type', 'error_message'] as const

/** Adds the journal filters to an `admin_request_logs` query; shared by the page query and the count query. */
export function applyLogFilters<Query>(
  query: Query,
  filters: Pick<LogsQuery, 'method' | 'status' | 'query' | 'startDate' | 'endDate'>,
): Query {
  // The PostgREST builder types are too deep to constrain here; the cast is local to this function.
  let next = query as unknown as FilterChain
  if (filters.method) next = next.eq('method', filters.method)
  if (filters.status) next = next.eq('status_code', filters.status)
  if (filters.startDate) next = next.gte('created_at', parisDayStart(filters.startDate).toISOString())
  if (filters.endDate) next = next.lte('created_at', parisDayEnd(filters.endDate).toISOString())
  const term = filters.query ? sanitizeSearchTerm(filters.query) : ''
  if (term) next = next.or(SEARCHED_COLUMNS.map((column) => `${column}.ilike.%${term}%`).join(','))
  return next as unknown as Query
}
