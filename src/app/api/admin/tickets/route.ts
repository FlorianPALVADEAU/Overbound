import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import {
  decodeTicketsCursor,
  encodeTicketsCursor,
  type TicketDirection,
  ticketSortSchema,
} from '@/lib/admin/ticketsPagination'

const ticketQuerySchema = z.object({
  paginated: z.enum(['true', '1']).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(25).max(100).default(50),
  query: z.string().trim().max(160).optional(),
  event_id: z.string().uuid().optional(),
  sort: ticketSortSchema.default('created_at'),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

const sanitizeSearchTerm = (value: string) => value.replace(/[%,()._]/g, ' ').replace(/\s+/g, ' ').trim()

export async function GET(request: NextRequest) {
  const rawParams = Object.fromEntries(new URL(request.url).searchParams.entries())
  const parsedQuery = ticketQuerySchema.safeParse(rawParams)
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Paramètres de liste invalides' }, { status: 400 })
  }

  const {
    paginated,
    cursor,
    limit,
    event_id: eventId,
    sort,
    direction,
    query: rawQuery,
  } = parsedQuery.data
  const searchTerm = rawQuery ? sanitizeSearchTerm(rawQuery) : ''
  const isPaginated = Boolean(paginated || cursor)

  try {
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) {
      return auth.response
    }

    let decodedCursor: ReturnType<typeof decodeTicketsCursor> | null = null
    if (cursor) {
      try {
        decodedCursor = decodeTicketsCursor(cursor, {
          organizationId: auth.organizationId,
          eventId: eventId ?? null,
          query: searchTerm,
          sort,
          direction,
        })
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Cursor de pagination invalide' },
          { status: 400 },
        )
      }
    }

    const supabase = supabaseAdmin()

    // Preserve the legacy unpaginated response for existing dialogs and
    // selectors. New consumers opt into the cursor contract explicitly.
    if (!isPaginated) {
      const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        event:events(id, title, date, status),
        race:races!tickets_race_id_fkey(id, name, type, difficulty, target_public, distance_km)
      `)
      .eq('organization_id', auth.organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json({ tickets })
    }

    let ticketsQuery = supabase
      .from('tickets')
      .select(`
        *,
        event:events(id, title, date, status),
        race:races!tickets_race_id_fkey(id, name, type, difficulty, target_public, distance_km)
      `, { count: 'exact' })
      .eq('organization_id', auth.organizationId)

    if (eventId) ticketsQuery = ticketsQuery.eq('event_id', eventId)
    if (searchTerm) ticketsQuery = ticketsQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)

    let cursorValue: string | number | null = null
    if (decodedCursor) {
      const { data: cursorRow, error: cursorError } = await supabase
        .from('tickets')
        .select(`id, ${sort}`)
        .eq('organization_id', auth.organizationId)
        .eq('id', decodedCursor.id)
        .maybeSingle()
      if (cursorError) throw cursorError
      if (!cursorRow) return NextResponse.json({ error: 'Cursor de pagination expiré' }, { status: 400 })
      cursorValue = (cursorRow as Record<string, unknown>)[sort] as string | number | null
      if (cursorValue === undefined) return NextResponse.json({ error: 'Cursor de pagination expiré' }, { status: 400 })
      const operator = direction === 'asc' ? 'gt' : 'lt'
      const cursorValueForFilter = String(cursorValue).replace(/[,().]/g, ' ')
      ticketsQuery = ticketsQuery.or(
        `${sort}.${operator}.${cursorValueForFilter},and(${sort}.eq.${cursorValueForFilter},id.${operator}.${decodedCursor.id})`,
      )
    }

    const { data: pageRows, error, count } = await ticketsQuery
      .order(sort, { ascending: direction === 'asc' })
      .order('id', { ascending: direction === 'asc' })
      .limit(limit + 1)
    if (error) throw error

    const hasNextPage = (pageRows?.length ?? 0) > limit
    const tickets = (pageRows ?? []).slice(0, limit)
    const lastTicket = tickets.at(-1)
    const nextCursor = hasNextPage && lastTicket
      ? encodeTicketsCursor({
        organizationId: auth.organizationId,
        eventId: eventId ?? null,
        query: searchTerm,
        sort,
        direction: direction as TicketDirection,
        id: lastTicket.id,
      })
      : null

    return NextResponse.json({
      tickets,
      page: { limit, totalCount: count ?? 0, nextCursor },
    })

  } catch (error) {
    console.error('Erreur GET tickets:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
  try {
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const {
      event_id,
      race_id,
      name,
      description,
      price,
      currency,
      max_participants,
      operations_config,
    } = body

    // Validation
    if (!name || !event_id || price === undefined) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    // Utiliser supabaseAdmin pour insérer
    const admin = supabaseAdmin()
    const { data: event } = await admin
      .from('events')
      .select('id')
      .eq('id', event_id)
      .eq('organization_id', auth.organizationId)
      .maybeSingle()
    if (!event) return NextResponse.json({ error: 'Événement inaccessible' }, { status: 404 })

    const { data: ticket, error } = await admin
      .from('tickets')
      .insert({
        event_id,
        race_id: race_id || null,
        name,
        description: description || null,
        final_price_cents: parseInt(price),
        max_participants: parseInt(max_participants) || 0,
        requires_document: false,
        document_types: [],
        currency: currency || 'eur',
        organization_id: auth.organizationId,
        operations_config: operations_config || null,
      })
      .select(`
        *,
        event:events(id, title, date, status),
        race:races!tickets_race_id_fkey(id, name, type, difficulty, target_public, distance_km)
      `)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ ticket })

  } catch (error) {
    console.error('Erreur POST ticket:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création ticket admin',
})
