import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  decodeParticipantsCursor,
  encodeParticipantsCursor,
  getParticipantFormat,
  type ParticipantDirection,
  participantSortSchema,
} from '@/lib/admin/eventParticipants'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const routeParamsSchema = z.object({ id: z.string().uuid() })
const querySchema = z.object({
  cursor: z.string().min(1).optional(),
  direction: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(25).max(100).default(50),
  query: z.string().trim().min(1).max(160).optional(),
  check_in: z.enum(['all', 'checked_in', 'not_checked_in']).default('all'),
  sort: participantSortSchema.default('created_at'),
})

type RegistrationRow = {
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
}

const sanitizeSearchTerm = (value: string) => value.replace(/[%,().]/g, ' ').replace(/\s+/g, ' ').trim()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedParams = routeParamsSchema.safeParse(await params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Identifiant événement invalide' }, { status: 400 })
  }

  const parsedQuery = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  )
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Paramètres de liste invalides' }, { status: 400 })
  }

  const { id: eventId } = parsedParams.data
  const { cursor, direction, limit, query: rawQuery, check_in: checkIn, sort } = parsedQuery.data

  let decodedCursor: ReturnType<typeof decodeParticipantsCursor> | null = null
  if (cursor) {
    try {
      decodedCursor = decodeParticipantsCursor(cursor, eventId, sort, direction)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Cursor de pagination invalide' },
        { status: 400 },
      )
    }
  }

  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const admin = supabaseAdmin()
    let cursorValue: string | null = null
    if (decodedCursor) {
      const { data: cursorRow, error: cursorError } = await admin
        .from('registrations')
        .select(`id, ${sort}`)
        .eq('event_id', eventId)
        .eq('id', decodedCursor.id)
        .maybeSingle()

      const cursorValueCandidate = (cursorRow as Record<string, unknown> | null)?.[sort]
      if (cursorError) throw cursorError
      if (typeof cursorValueCandidate !== 'string') {
        return NextResponse.json({ error: 'Cursor de pagination expiré' }, { status: 400 })
      }
      cursorValue = cursorValueCandidate
    }

    let registrationsQuery = admin
      .from('registrations')
      .select(
        'id, user_id, ticket_id, order_id, email, checked_in, claim_status, approval_status, created_at, start_time, wave_index',
        { count: 'exact' },
      )
      .eq('event_id', eventId)

    if (checkIn === 'checked_in') registrationsQuery = registrationsQuery.eq('checked_in', true)
    if (checkIn === 'not_checked_in') registrationsQuery = registrationsQuery.eq('checked_in', false)

    const searchTerm = rawQuery ? sanitizeSearchTerm(rawQuery) : ''
    if (searchTerm) registrationsQuery = registrationsQuery.ilike('email', `%${searchTerm}%`)

    if (decodedCursor && cursorValue) {
      const operator = direction === 'asc' ? 'gt' : 'lt'
      registrationsQuery = registrationsQuery.or(
        `${sort}.${operator}.${cursorValue},and(${sort}.eq.${cursorValue},id.${operator}.${decodedCursor.id})`,
      )
    }

    const { data: pageRows, error, count } = await registrationsQuery
      .order(sort, { ascending: direction === 'asc' })
      .order('id', { ascending: direction === 'asc' })
      .limit(limit + 1)

    if (error) throw error

    const hasNextPage = (pageRows?.length ?? 0) > limit
    const registrations = ((pageRows ?? []).slice(0, limit) as RegistrationRow[])
    const ticketIds = registrations.flatMap((row) => (row.ticket_id ? [row.ticket_id] : []))
    const profileIds = registrations.flatMap((row) => (row.user_id ? [row.user_id] : []))
    const orderIds = registrations.flatMap((row) => (row.order_id ? [row.order_id] : []))

    const [ticketsResult, profilesResult, membershipsResult, ordersResult] = await Promise.all([
      ticketIds.length
        ? admin.from('tickets').select('id, name, race:races(name)').in('id', ticketIds)
        : Promise.resolve({ data: [], error: null }),
      profileIds.length
        ? admin.from('profiles').select('id, full_name').in('id', profileIds)
        : Promise.resolve({ data: [], error: null }),
      profileIds.length
        ? admin.from('group_members').select('profile_id, group:groups(id, name)').in('profile_id', profileIds)
        : Promise.resolve({ data: [], error: null }),
      orderIds.length
        ? admin.from('orders').select('id, status, amount_total, currency').in('id', orderIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    for (const [resource, result] of Object.entries({
      tickets: ticketsResult,
      profiles: profilesResult,
      groups: membershipsResult,
      orders: ordersResult,
    })) {
      if (result.error) console.error(`[admin event participants] ${resource} lookup error`, result.error)
    }

    const tickets = new Map(
      (ticketsResult.data ?? []).map((ticket: any) => [
        ticket.id,
        {
          name: ticket.name ?? null,
          raceName: Array.isArray(ticket.race) ? ticket.race[0]?.name ?? null : ticket.race?.name ?? null,
        },
      ]),
    )
    const profiles = new Map(
      (profilesResult.data ?? []).map((profile: any) => [profile.id, profile.full_name ?? null]),
    )
    const groups = new Map(
      (membershipsResult.data ?? []).map((membership: any) => {
        const group = Array.isArray(membership.group) ? membership.group[0] : membership.group
        return [membership.profile_id, group?.name ?? null]
      }),
    )
    const orders = new Map(
      (ordersResult.data ?? []).map((order: any) => [
        order.id,
        {
          status: order.status ?? null,
          amountCents: order.amount_total ?? null,
          currency: order.currency ?? null,
        },
      ]),
    )

    const participants = registrations.map((registration) => {
      const ticket = registration.ticket_id ? tickets.get(registration.ticket_id) : null
      const order = registration.order_id ? orders.get(registration.order_id) : null
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
        },
        ticket: {
          id: registration.ticket_id,
          name: ticket?.name ?? null,
          format: getParticipantFormat(ticket?.name, ticket?.raceName),
        },
        departure: {
          startTime: registration.start_time,
          waveIndex: registration.wave_index,
        },
        group: registration.user_id ? groups.get(registration.user_id) ?? null : null,
        payment: order ?? null,
      }
    })

    const lastRegistration = registrations.at(-1)
    const nextCursor = hasNextPage && lastRegistration
      ? encodeParticipantsCursor({ eventId, sort, direction: direction as ParticipantDirection, id: lastRegistration.id })
      : null

    return NextResponse.json({
      participants,
      page: {
        limit,
        totalCount: count ?? 0,
        nextCursor,
      },
    })
  } catch (error) {
    console.error('[admin event participants] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
