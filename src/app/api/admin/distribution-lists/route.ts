import { NextRequest, NextResponse } from 'next/server'
import { createClient, supabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import type {
  CreateDistributionListData,
  DistributionListType,
} from '@/types/DistributionList'
import {
  EVENT_OPENING_FIRST_LIST_ID,
  EVENT_OPENING_FIRST_LIST_SLUG,
} from '@/lib/subscriptions/constants'

// Validation schema
const distributionListSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().nullable().optional(),
  slug: z
    .string()
    .min(1, 'Le slug est requis')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Le slug doit être en minuscules avec des tirets uniquement'
    ),
  type: z.enum([
    'marketing',
    'transactional',
    'events',
    'volunteers',
    'partners',
    'news',
    'blog',
  ]),
  default_subscribed: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
})

const pageQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(120).optional(),
  type: z.string().optional(),
})

const decodeCursor = (value: string | undefined) => {
  if (!value) return 0
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as { offset?: number }
    return Number.isInteger(parsed.offset) && (parsed.offset ?? 0) >= 0 ? parsed.offset ?? 0 : null
  } catch {
    return null
  }
}

const encodeCursor = (offset: number) => Buffer.from(JSON.stringify({ offset }), 'utf8').toString('base64url')

/**
 * GET /api/admin/distribution-lists
 * Get all distribution lists (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const includeStats = searchParams.get('includeStats') === 'true'
    const type = searchParams.get('type') as DistributionListType | null
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const hasPaging = ['cursor', 'limit', 'search'].some((key) => searchParams.has(key))
    const parsedPage = pageQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
    if (!parsedPage.success) return NextResponse.json({ error: parsedPage.error.flatten() }, { status: 422 })
    const decodedOffset = decodeCursor(parsedPage.data.cursor)
    if (decodedOffset === null) return NextResponse.json({ error: 'Curseur invalide' }, { status: 422 })
    const offset = decodedOffset
    const limit = parsedPage.data.limit
    const search = parsedPage.data.search
    const supabase = await createClient()
    const admin = supabaseAdmin()

    // Build query
    if (includeStats) {
      // Use the stats view
      let query = admin.from('distribution_lists_stats').select('*', { count: 'exact' })

      if (type) {
        query = query.eq('type', type)
      }

      if (activeOnly) {
        query = query.eq('active', true)
      }

      if (search) query = query.or(`name.ilike.%${search.replace(/[(),]/g, ' ')}%,slug.ilike.%${search.replace(/[(),]/g, ' ')}%`)

      if (hasPaging) {
        const { data: pagedData, error: pagedError, count } = await query.order('subscriber_count', { ascending: false }).range(offset, offset + limit - 1)
        if (pagedError) return NextResponse.json({ error: 'Failed to fetch distribution lists' }, { status: 500 })
        const enhancedData = await addEventOpeningVirtualList({ lists: pagedData ?? [], admin })
        return NextResponse.json({ items: enhancedData, nextCursor: offset + enhancedData.length < (count ?? 0) ? encodeCursor(offset + enhancedData.length) : null, total: (count ?? 0) + (offset === 0 && enhancedData.some((list) => list.id === EVENT_OPENING_FIRST_LIST_ID) ? 1 : 0) })
      }

      const { data, error } = await query.order('subscriber_count', {
        ascending: false,
      })

      if (error) {
        console.error('Error fetching distribution lists stats:', error)
        return NextResponse.json(
          { error: 'Failed to fetch distribution lists' },
          { status: 500 }
        )
      }

      const enhancedData = await addEventOpeningVirtualList({
        lists: data ?? [],
        admin,
      })

      // Keep the database stats as the displayed source of truth. Resend is a
      // delivery projection and must not silently replace a valid count with
      // zero when an audience mapping is missing or stale.
      return NextResponse.json({ data: enhancedData }, { status: 200 })
    } else {
      // Regular query
      let query = admin.from('distribution_lists').select('*')

      if (type) {
        query = query.eq('type', type)
      }

      if (activeOnly) {
        query = query.eq('active', true)
      }

      if (search) query = query.or(`name.ilike.%${search.replace(/[(),]/g, ' ')}%,slug.ilike.%${search.replace(/[(),]/g, ' ')}%`)

      const { data, error } = await query.order('created_at', {
        ascending: false,
      })

      if (error) {
        console.error('Error fetching distribution lists:', error)
        return NextResponse.json(
          { error: 'Failed to fetch distribution lists' },
          { status: 500 }
        )
      }

      return NextResponse.json({ data }, { status: 200 })
    }
  } catch (error) {
    console.error('Distribution lists GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function addEventOpeningVirtualList({
  lists,
  admin,
}: {
  lists: any[]
  admin: ReturnType<typeof supabaseAdmin>
}) {
  const { data: firstEvent, error: firstEventError } = await admin
    .from('events')
    .select('id, title, date, created_at')
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (firstEventError) {
    console.error('Error fetching first event:', firstEventError)
    return lists
  }

  if (!firstEvent) {
    return lists
  }

  const { count: notificationsCount, error: notificationsError } = await admin
    .from('event_opening_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', firstEvent.id)

  if (notificationsError) {
    console.error('Error fetching event opening notifications:', notificationsError)
  }

  const virtualList = {
    id: EVENT_OPENING_FIRST_LIST_ID,
    name: `Ouverture inscriptions — ${firstEvent.title ?? 'Premier événement'}`,
    description:
      firstEvent.title
        ? `Demandes pour être prévenu de l'ouverture de ${firstEvent.title}.`
        : `Demandes pour être prévenu de l'ouverture du premier événement.`,
    slug: EVENT_OPENING_FIRST_LIST_SLUG,
    type: 'events',
    default_subscribed: false,
    active: true,
    created_at: firstEvent.created_at ?? new Date().toISOString(),
    updated_at: firstEvent.created_at ?? new Date().toISOString(),
    subscriber_count: notificationsCount ?? 0,
    unsubscriber_count: 0,
    total_interactions: 0,
  }

  const merged = [...lists, virtualList]
  merged.sort((a, b) => (b.subscriber_count || 0) - (a.subscriber_count || 0))

  return merged
}

/**
 * POST /api/admin/distribution-lists
 * Create a new distribution list (admin only)
 */
async function handlePost(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const supabase = await createClient()

    // Parse and validate request body
    const body = await request.json()
    const validatedData = distributionListSchema.parse(body)

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('distribution_lists')
      .select('id')
      .eq('slug', validatedData.slug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Une liste avec ce slug existe déjà' },
        { status: 400 }
      )
    }

    // Create the distribution list
    const { data, error } = await supabase
      .from('distribution_lists')
      .insert(validatedData as CreateDistributionListData)
      .select()
      .single()

    if (error) {
      console.error('Error creating distribution list:', error)
      return NextResponse.json(
        { error: 'Failed to create distribution list' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data, message: 'Liste de distribution créée avec succès' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Distribution lists POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création liste de distribution admin',
})
