import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  decodeParticipantsCursor,
  encodeParticipantsCursor,
  type ParticipantDirection,
  participantSortSchema,
} from '@/lib/admin/eventParticipants'
import {
  PARTICIPANT_COLUMNS,
  applyParticipantFilters,
  enrichParticipants,
  findUserIdsByName,
  participantFiltersSchema,
  type ParticipantRegistrationRow,
} from '@/lib/admin/participantsQuery'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const routeParamsSchema = z.object({ id: z.string().uuid() })
const querySchema = participantFiltersSchema.extend({
  cursor: z.string().min(1).optional(),
  direction: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(25).max(100).default(50),
  sort: participantSortSchema.default('created_at'),
})

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
  const { cursor, direction, limit, sort, ...filters } = parsedQuery.data

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

    const nameMatches = await findUserIdsByName(admin, filters.query)
    let registrationsQuery = applyParticipantFilters(
      admin.from('registrations').select(PARTICIPANT_COLUMNS, { count: 'exact' }).eq('event_id', eventId),
      filters,
      nameMatches,
    )

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
    const registrations = ((pageRows ?? []).slice(0, limit) as unknown as ParticipantRegistrationRow[])
    const participants = await enrichParticipants(admin, registrations)

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
