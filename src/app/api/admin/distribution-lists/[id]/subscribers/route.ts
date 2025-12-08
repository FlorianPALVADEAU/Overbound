import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/distribution-lists/[id]/subscribers
 * Get all subscribers for a distribution list (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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
    const subscribedOnly = searchParams.get('subscribedOnly') !== 'false' // Default true
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use admin client to bypass RLS and see all subscriptions (including email-only)
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const admin = supabaseAdmin()

    // Build query for subscriptions
    let query = admin
      .from('list_subscriptions')
      .select('*')
      .eq('list_id', id)
      .range(offset, offset + limit - 1)
      .order('subscribed_at', { ascending: false })

    if (subscribedOnly) {
      query = query.eq('subscribed', true)
    }

    const { data: subscriptions, error: subscriptionsError } = await query

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError)
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { data: [], total: 0, limit, offset },
        { status: 200 }
      )
    }

    // Separate subscriptions with user_id from those with email only
    const userSubscriptions = subscriptions.filter((sub) => sub.user_id)
    const emailSubscriptions = subscriptions.filter((sub) => !sub.user_id && sub.email)

    // For subscriptions with user_id, fetch emails from auth.users
    const emailMap = new Map<string, string>()
    const profilesMap = new Map<string, string | null>()

    if (userSubscriptions.length > 0) {
      const userIds = userSubscriptions.map((sub) => sub.user_id!)
      const userIdsSet = new Set(userIds)
      const perPage = 1000

      // Fetch auth users
      for (let page = 1; ; page++) {
        const { data } = await admin.auth.admin.listUsers({ page, perPage })
        const users = data.users || []

        for (const user of users) {
          if (userIdsSet.has(user.id)) {
            emailMap.set(user.id, user.email || '')
          }
        }

        if (users.length < perPage || emailMap.size >= userIds.length) {
          break
        }
      }

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      profiles?.forEach((p) => profilesMap.set(p.id, p.full_name))
    }

    // Map all subscriptions to detailed format
    const subscribersWithDetails = subscriptions.map((sub) => {
      if (sub.user_id) {
        // Authenticated user
        return {
          ...sub,
          user: {
            id: sub.user_id,
            email: emailMap.get(sub.user_id) || '',
            full_name: profilesMap.get(sub.user_id) || null,
          },
        }
      } else {
        // Email-only subscriber
        return {
          ...sub,
          user: {
            id: null,
            email: sub.email || '',
            full_name: sub.full_name || null,
          },
        }
      }
    })

    // Get total count (using admin client to see all subscriptions)
    let countQuery = admin
      .from('list_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', id)

    if (subscribedOnly) {
      countQuery = countQuery.eq('subscribed', true)
    }

    const { count } = await countQuery

    return NextResponse.json(
      {
        data: subscribersWithDetails,
        total: count || 0,
        limit,
        offset,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Subscribers GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/distribution-lists/[id]/subscribers
 * Add subscribers to a distribution list (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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

    // Parse request body
    const body = await request.json()
    const { user_ids }: { user_ids: string[] } = body

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { error: 'user_ids array is required' },
        { status: 400 }
      )
    }

    // Create subscriptions for each user
    const subscriptions = user_ids.map((userId) => ({
      user_id: userId,
      list_id: id,
      subscribed: true,
      source: 'admin' as const,
      subscribed_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('list_subscriptions')
      .upsert(subscriptions, {
        onConflict: 'user_id,list_id',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error('Error adding subscribers:', error)
      return NextResponse.json(
        { error: 'Failed to add subscribers' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        data,
        message: `${user_ids.length} utilisateur(s) abonné(s) avec succès`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Subscribers POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
