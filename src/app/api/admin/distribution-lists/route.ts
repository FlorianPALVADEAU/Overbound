import { NextRequest, NextResponse } from 'next/server'
import { createClient, supabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'
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

/**
 * GET /api/admin/distribution-lists
 * Get all distribution lists (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = supabaseAdmin()

    // Check if user is authenticated and admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const includeStats = searchParams.get('includeStats') === 'true'
    const type = searchParams.get('type') as DistributionListType | null
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // Build query
    if (includeStats) {
      // Use the stats view
      let query = supabase.from('distribution_lists_stats').select('*')

      if (type) {
        query = query.eq('type', type)
      }

      if (activeOnly) {
        query = query.eq('active', true)
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

      return NextResponse.json({ data: enhancedData }, { status: 200 })
    } else {
      // Regular query
      let query = supabase.from('distribution_lists').select('*')

      if (type) {
        query = query.eq('type', type)
      }

      if (activeOnly) {
        query = query.eq('active', true)
      }

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
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
