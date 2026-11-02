import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveTicketOperationsProfile } from '@/lib/tickets/operationsProfile'

type Admin = Pick<SupabaseClient, 'from'>

export const participantFiltersSchema = z.object({
  query: z.string().trim().min(1).max(160).optional(),
  check_in: z.enum(['all', 'checked_in', 'not_checked_in']).default('all'),
  /** Cancelled bibs (refund, admin cancellation) stay listed unless the admin filters them out. */
  status: z.enum(['all', 'active', 'cancelled']).default('all'),
  ticket_id: z.string().uuid().optional(),
  /** A SAS number, or `none` for bibs without one. */
  wave: z.union([z.literal('none'), z.coerce.number().int().min(1).max(99)]).optional(),
})

export type ParticipantFilters = z.infer<typeof participantFiltersSchema>

export const PARTICIPANT_COLUMNS =
  'id, user_id, ticket_id, order_id, email, checked_in, claim_status, approval_status, created_at, start_time, wave_index, cancelled_at, cancellation_reason, bib_number'

export interface ParticipantRegistrationRow {
  id: string
  user_id: string | null
  ticket_id: string | null
  order_id: string | null
  email: string
  checked_in: boolean
  claim_status: string | null
  approval_status: string | null
  created_at: string
  start_time: string | null
  wave_index: number | null
  cancelled_at: string | null
  cancellation_reason: string | null
  bib_number: number | null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Characters that would change the meaning of a PostgREST `or(...)` filter. */
export const sanitizeSearchTerm = (value: string) => value.replace(/[%,().]/g, ' ').replace(/\s+/g, ' ').trim()

// Minimal structural view of a PostgREST filter builder: each call returns the builder.
interface FilterChain {
  eq(column: string, value: string | number | boolean): FilterChain
  is(column: string, value: null): FilterChain
  not(column: string, operator: string, value: null): FilterChain
  or(filters: string): FilterChain
}

/**
 * Adds the admin's filters to a registrations query. `userIdsMatchingName` comes from `findUserIdsByName`:
 * a registration has no name column, the name lives on the account profile.
 */
export function applyParticipantFilters<Query>(
  query: Query,
  filters: ParticipantFilters,
  userIdsMatchingName: readonly string[] = [],
): Query {
  // The PostgREST builder types are too deep to constrain here; the cast is local to this function.
  let next = query as unknown as FilterChain
  if (filters.check_in === 'checked_in') next = next.eq('checked_in', true)
  if (filters.check_in === 'not_checked_in') next = next.eq('checked_in', false)
  if (filters.status === 'active') next = next.is('cancelled_at', null)
  if (filters.status === 'cancelled') next = next.not('cancelled_at', 'is', null)
  if (filters.ticket_id) next = next.eq('ticket_id', filters.ticket_id)
  if (filters.wave === 'none') next = next.is('wave_index', null)
  else if (typeof filters.wave === 'number') next = next.eq('wave_index', filters.wave)

  const term = filters.query ? sanitizeSearchTerm(filters.query) : ''
  if (term) {
    const clauses = [`email.ilike.%${term}%`]
    if (UUID.test(term)) clauses.push(`id.eq.${term}`)
    if (userIdsMatchingName.length > 0) clauses.push(`user_id.in.(${userIdsMatchingName.join(',')})`)
    next = next.or(clauses.join(','))
  }
  return next as unknown as Query
}

/** Accounts whose name matches the search; capped, the email and id clauses still apply on top. */
export async function findUserIdsByName(admin: Admin, query: string | undefined): Promise<string[]> {
  const term = query ? sanitizeSearchTerm(query) : ''
  if (term.length < 2) return []
  const { data, error } = await admin.from('profiles').select('id').ilike('full_name', `%${term}%`).limit(200)
  if (error) {
    console.error('[admin participants] name search failed', error)
    return []
  }
  return (data ?? []).map((profile: { id: string }) => profile.id)
}

export interface ParticipantRecord {
  id: string
  participant: { name: string | null; email: string; accountStatus: 'claimed' | 'guest' }
  registration: {
    claimStatus: string | null
    approvalStatus: string | null
    checkedIn: boolean
    createdAt: string
    cancelledAt: string | null
    cancellationReason: string | null
    bibNumber: number | null
  }
  ticket: {
    id: string | null
    name: string | null
    operations: { status: 'configured' | 'unconfigured'; departureMode: 'none' | 'wave' | 'fixed' | null }
  }
  departure: { startTime: string | null; waveIndex: number | null }
  group: string | null
  payment: { orderId: string | null; status: string | null; amountCents: number | null; currency: string | null } | null
}

interface TicketLookup {
  id: string
  name: string | null
  operations_config: Record<string, unknown> | null
}
interface ProfileLookup {
  id: string
  full_name: string | null
}
interface MembershipLookup {
  profile_id: string
  group: { name: string | null } | Array<{ name: string | null }> | null
}
interface OrderLookup {
  id: string
  status: string | null
  amount_total: number | null
  currency: string | null
}

const unique = (values: Array<string | null>) => [...new Set(values.filter((value): value is string => Boolean(value)))]

/** Joins tickets, account names, groups and orders onto a page of registrations. */
export async function enrichParticipants(admin: Admin, registrations: ParticipantRegistrationRow[]): Promise<ParticipantRecord[]> {
  const ticketIds = unique(registrations.map((row) => row.ticket_id))
  const profileIds = unique(registrations.map((row) => row.user_id))
  const orderIds = unique(registrations.map((row) => row.order_id))

  const [ticketsResult, profilesResult, membershipsResult, ordersResult] = await Promise.all([
    ticketIds.length
      ? admin.from('tickets').select('id, name, operations_config').in('id', ticketIds)
      : Promise.resolve({ data: [] as TicketLookup[], error: null }),
    profileIds.length
      ? admin.from('profiles').select('id, full_name').in('id', profileIds)
      : Promise.resolve({ data: [] as ProfileLookup[], error: null }),
    profileIds.length
      ? admin.from('group_members').select('profile_id, group:groups(name)').in('profile_id', profileIds)
      : Promise.resolve({ data: [] as MembershipLookup[], error: null }),
    orderIds.length
      ? admin.from('orders').select('id, status, amount_total, currency').in('id', orderIds)
      : Promise.resolve({ data: [] as OrderLookup[], error: null }),
  ])

  for (const [resource, result] of Object.entries({
    tickets: ticketsResult,
    profiles: profilesResult,
    groups: membershipsResult,
    orders: ordersResult,
  })) {
    if (result.error) console.error(`[admin participants] ${resource} lookup error`, result.error)
  }

  const tickets = new Map((ticketsResult.data as TicketLookup[] | null ?? []).map((ticket) => [ticket.id, ticket]))
  const profiles = new Map((profilesResult.data as ProfileLookup[] | null ?? []).map((profile) => [profile.id, profile.full_name]))
  const groups = new Map(
    (membershipsResult.data as MembershipLookup[] | null ?? []).map((membership) => {
      const group = Array.isArray(membership.group) ? membership.group[0] : membership.group
      return [membership.profile_id, group?.name ?? null] as const
    }),
  )
  const orders = new Map((ordersResult.data as OrderLookup[] | null ?? []).map((order) => [order.id, order]))

  return registrations.map((registration) => {
    const ticket = registration.ticket_id ? tickets.get(registration.ticket_id) : undefined
    const order = registration.order_id ? orders.get(registration.order_id) : undefined
    const operations = resolveTicketOperationsProfile(ticket?.operations_config)
    return {
      id: registration.id,
      participant: {
        name: registration.user_id ? profiles.get(registration.user_id) ?? null : null,
        email: registration.email,
        accountStatus: registration.user_id ? 'claimed' : 'guest',
      },
      registration: {
        claimStatus: registration.claim_status,
        approvalStatus: registration.approval_status,
        checkedIn: registration.checked_in,
        createdAt: registration.created_at,
        cancelledAt: registration.cancelled_at,
        cancellationReason: registration.cancellation_reason,
        bibNumber: registration.bib_number,
      },
      ticket: {
        id: registration.ticket_id,
        name: ticket?.name ?? null,
        operations: { status: operations.status, departureMode: operations.departureMode },
      },
      departure: { startTime: registration.start_time, waveIndex: registration.wave_index },
      group: registration.user_id ? groups.get(registration.user_id) ?? null : null,
      payment: order
        ? { orderId: order.id, status: order.status ?? null, amountCents: order.amount_total ?? null, currency: order.currency ?? null }
        : null,
    }
  })
}
