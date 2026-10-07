import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { dispatchNewEventAnnouncement, getMarketingOptInRecipients } from '@/lib/email/marketing'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import {
  adminEventDirectionSchema,
  adminEventSortSchema,
  decodeAdminEventsCursor,
  encodeAdminEventsCursor,
  sanitizeAdminEventSearch,
  type AdminEventDirection,
} from '@/lib/admin/eventsList'

const paginatedEventsQuerySchema = z.object({
  paginated: z.enum(['true', 'false']).default('false'),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(25).max(100).default(50),
  query: z.string().trim().min(1).max(160).optional(),
  status: z.enum(['draft', 'announced', 'on_sale', 'sold_out', 'closed', 'cancelled', 'completed']).optional(),
  sort: adminEventSortSchema.default('created_at'),
  direction: adminEventDirectionSchema.default('desc'),
})

async function addEventStats(admin: ReturnType<typeof supabaseAdmin>, events: Array<Record<string, unknown>>) {
  return Promise.all(events.map(async (event) => {
    const [{ count: registrationsCount, error: registrationsError }, { count: volunteersCount, error: volunteersError }] =
      await Promise.all([
        admin.from('registrations').select('id', { head: true, count: 'exact' }).eq('event_id', event.id as string),
        admin.from('volunteer_applications').select('id', { head: true, count: 'exact' }).eq('event_id', event.id as string),
      ])

    if (registrationsError) console.error('[admin events] registrations count error', registrationsError)
    if (volunteersError) console.error('[admin events] volunteers count error', volunteersError)
    return { ...event, registrations_count: registrationsCount ?? 0, volunteer_applications_count: volunteersCount ?? 0 }
  }))
}

export async function GET(request: Request) {
  try {
    const parsedQuery = paginatedEventsQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    )
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Paramètres de liste invalides' }, { status: 400 })
    }

    const auth = await requireAdminOrganization(request)
    if (!auth.ok) {
      return auth.response
    }

    const admin = supabaseAdmin()

    const params = parsedQuery.data
    const isPaginated = params.paginated === 'true' || Boolean(params.cursor || params.query || params.status || request.url.includes('limit=') || request.url.includes('sort=') || request.url.includes('direction='))

    if (!isPaginated) {
      const { data: events, error } = await admin
      .from('events')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json({ events: await addEventStats(admin, (events ?? []) as Array<Record<string, unknown>>) })
    }

    let cursor: ReturnType<typeof decodeAdminEventsCursor> | null = null
    if (params.cursor) {
      try {
        cursor = decodeAdminEventsCursor(params.cursor, params.sort, params.direction)
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Cursor de pagination invalide' }, { status: 400 })
      }
    }

    let eventsQuery = admin
      .from('events')
      .select('*', { count: 'exact' })
      .eq('organization_id', auth.organizationId)

    if (params.status) eventsQuery = eventsQuery.eq('status', params.status)
    const searchTerm = params.query ? sanitizeAdminEventSearch(params.query) : ''
    if (searchTerm) eventsQuery = eventsQuery.or(`title.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)

    if (cursor) {
      const { data: cursorEvent, error: cursorError } = await admin
        .from('events')
        .select(`id, ${params.sort}`)
        .eq('organization_id', auth.organizationId)
        .eq('id', cursor.id)
        .maybeSingle()
      if (cursorError) throw cursorError
      const cursorValue = (cursorEvent as Record<string, unknown> | null)?.[params.sort]
      if (typeof cursorValue !== 'string' && typeof cursorValue !== 'number') {
        return NextResponse.json({ error: 'Cursor de pagination expiré' }, { status: 400 })
      }
      const operator = params.direction === 'asc' ? 'gt' : 'lt'
      const encodedCursorValue = encodeURIComponent(String(cursorValue))
      eventsQuery = eventsQuery.or(`${params.sort}.${operator}.${encodedCursorValue},and(${params.sort}.eq.${encodedCursorValue},id.${operator}.${cursor.id})`)
    }

    const { data: pageRows, error, count } = await eventsQuery
      .order(params.sort, { ascending: params.direction === 'asc' })
      .order('id', { ascending: params.direction === 'asc' })
      .limit(params.limit + 1)
    if (error) throw error

    const hasNextPage = (pageRows?.length ?? 0) > params.limit
    const pageEvents = ((pageRows ?? []).slice(0, params.limit) as Array<Record<string, unknown>>)
    const lastEvent = pageEvents.at(-1)
    const nextCursor = hasNextPage && lastEvent && typeof lastEvent[params.sort] === 'string'
      ? encodeAdminEventsCursor({ sort: params.sort, direction: params.direction as AdminEventDirection, id: lastEvent.id as string })
      : null

    return NextResponse.json({
      events: await addEventStats(admin, pageEvents),
      page: { limit: params.limit, totalCount: count ?? 0, nextCursor },
    })

  } catch (error) {
    console.error('Erreur GET events:', error)
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
      slug,
      title,
      subtitle,
      description,
      image_url,
      date,
      sales_start,
      location,
      capacity,
      status,
      external_provider,
      external_event_id,
      external_url
    } = body

    // Validation
    if (!slug || !title || !date || !location) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    // Utiliser supabaseAdmin pour insérer
    const admin = supabaseAdmin()
    const { data: event, error } = await admin
      .from('events')
      .insert({
        slug,
        title,
        subtitle: subtitle || null,
        description: description || null,
        image_url: image_url || null,
        date: new Date(date).toISOString(),
        sales_start: sales_start ? new Date(sales_start).toISOString() : null,
        location,
        capacity: parseInt(capacity) || 0,
        status: status || 'draft',
        external_provider: external_provider || null,
        external_event_id: external_event_id || null,
        external_url: external_url || null,
        organization_id: auth.organizationId,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Un événement avec ce slug existe déjà' },
          { status: 409 }
        )
      }
      throw error
    }

    await maybeSendNewEventAnnouncement(event)

    return NextResponse.json({ event })

  } catch (error) {
    console.error('Erreur POST event:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création événement admin',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound.com'

const maybeSendNewEventAnnouncement = async (
  event: Record<string, any>,
  previousStatus?: string | null,
) => {
  if (!event || event.status !== 'on_sale') {
    return
  }

  if (previousStatus === 'on_sale') {
    return
  }

  try {
    const recipients = await getMarketingOptInRecipients()
    if (recipients.length === 0) {
      return
    }

    await dispatchNewEventAnnouncement({
      recipients,
      eventTitle: event.title ?? 'Nouvel événement OverBound',
      eventDate: event.date
        ? new Date(event.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })
        : '',
      eventLocation: event.location ?? '',
      eventUrl: `${SITE_URL}/events/${event.slug ?? event.id ?? ''}`,
      highlight: event.subtitle ?? null,
    })
  } catch (error) {
    console.error('[marketing] new event announcement error', error)
  }
}
