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

    // Build query for subscriptions with user details
    let query = supabase
      .from('list_subscriptions')
      .select(
        `
        *,
        profiles:user_id (
          id,
          full_name
        )
      `
      )
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

    // Get user emails from auth.users (requires service role)
    const userIds = subscriptions?.map((sub) => sub.user_id) || []

    if (userIds.length === 0) {
      return NextResponse.json(
        { data: [], total: 0, limit, offset },
        { status: 200 }
      )
    }

    // For each subscription, we need to get the email from Supabase Admin
    // This requires using the admin client
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const admin = supabaseAdmin()

    // Fetch users in batches
    const users = []
    for (const userId of userIds) {
      const { data: authUser } = await admin.auth.admin.getUserById(userId)
      if (authUser.user) {
        users.push(authUser.user)
      }
    }

    // Map emails to subscriptions
    const emailMap = new Map(users.map((u) => [u.id, u.email]))

    const subscribersWithDetails = subscriptions?.map((sub) => ({
      ...sub,
      user: {
        id: sub.user_id,
        email: emailMap.get(sub.user_id) || '',
        full_name: (sub.profiles as any)?.full_name || null,
      },
    }))

    // Get total count
    const { count } = await supabase
      .from('list_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', id)
      .eq('subscribed', subscribedOnly)

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
