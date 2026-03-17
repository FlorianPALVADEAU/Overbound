import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EVENT_OPENING_FIRST_LIST_ID } from '@/lib/subscriptions/constants'
import {
  getResendAudienceIdForSlug,
  listResendAudienceContacts,
  subscribeResendContactToAudiences,
  unsubscribeResendContactFromAudiences,
} from '@/lib/email/resendAudiences'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

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

    if (id === EVENT_OPENING_FIRST_LIST_ID) {
      const { data: firstEvent, error: firstEventError } = await admin
        .from('events')
        .select('id')
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (firstEventError) {
        console.error('Error fetching first event:', firstEventError)
        return NextResponse.json(
          { error: 'Failed to fetch first event' },
          { status: 500 }
        )
      }

      if (!firstEvent) {
        return NextResponse.json(
          { data: [], total: 0, limit, offset },
          { status: 200 }
        )
      }

      const { data: notifications, error: notificationsError } = await admin
        .from('event_opening_notifications')
        .select('id, email, full_name, user_id, source, created_at')
        .eq('event_id', firstEvent.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (notificationsError) {
        console.error('Error fetching event opening notifications:', notificationsError)
        return NextResponse.json(
          { error: 'Failed to fetch subscribers' },
          { status: 500 }
        )
      }

      const subscribersWithDetails = (notifications || []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        list_id: EVENT_OPENING_FIRST_LIST_ID,
        subscribed: true,
        source: row.source ?? 'event-page',
        subscribed_at: row.created_at ?? null,
        user: {
          id: row.user_id ?? null,
          email: row.email || '',
          full_name: row.full_name ?? null,
        },
      }))

      const { count } = await admin
        .from('event_opening_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', firstEvent.id)

      return NextResponse.json(
        {
          data: subscribersWithDetails,
          total: count || 0,
          limit,
          offset,
        },
        { status: 200 }
      )
    }

    const { data: list, error: listError } = await supabase
      .from('distribution_lists')
      .select('id, slug')
      .eq('id', id)
      .maybeSingle()

    if (listError || !list) {
      return NextResponse.json({ error: 'Distribution list not found' }, { status: 404 })
    }

    const audienceId = getResendAudienceIdForSlug(list.slug)
    if (!audienceId) {
      return NextResponse.json(
        { error: `No Resend audience configured for list slug "${list.slug}"` },
        { status: 400 }
      )
    }

    const contacts = await listResendAudienceContacts(audienceId)
    const filteredContacts = subscribedOnly
      ? contacts.filter((contact) => !contact.unsubscribed)
      : contacts

    const paginated = filteredContacts.slice(offset, offset + limit)
    const subscribersWithDetails = paginated.map((contact) => ({
      id: contact.email,
      user_id: null,
      list_id: id,
      subscribed: !contact.unsubscribed,
      source: 'resend',
      subscribed_at: contact.created_at,
      user: {
        id: null,
        email: contact.email,
        full_name: [contact.first_name, contact.last_name].filter(Boolean).join(' ') || null,
      },
    }))

    return NextResponse.json(
      {
        data: subscribersWithDetails,
        total: filteredContacts.length,
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
 * DELETE /api/admin/distribution-lists/[id]/subscribers
 * Remove a subscriber from a distribution list (admin only)
 */
async function handleDelete(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: listId } = await params

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

    // Parse request body to get subscription_id
    const body = await request.json()
    const { subscription_id }: { subscription_id: string } = body

    if (!subscription_id) {
      return NextResponse.json(
        { error: 'subscription_id is required' },
        { status: 400 }
      )
    }

    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const admin = supabaseAdmin()

    if (listId === EVENT_OPENING_FIRST_LIST_ID) {
      const { error: deleteError } = await admin
        .from('event_opening_notifications')
        .delete()
        .eq('id', subscription_id)

      if (deleteError) {
        console.error('Error deleting event opening notification:', deleteError)
        return NextResponse.json(
          { error: 'Failed to remove subscriber' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { message: 'Subscriber removed successfully' },
        { status: 200 }
      )
    }

    const { data: list, error: listError } = await supabase
      .from('distribution_lists')
      .select('slug')
      .eq('id', listId)
      .maybeSingle()

    if (listError || !list) {
      return NextResponse.json({ error: 'Distribution list not found' }, { status: 404 })
    }

    const audienceId = getResendAudienceIdForSlug(list.slug)
    if (!audienceId) {
      return NextResponse.json(
        { error: `No Resend audience configured for list slug "${list.slug}"` },
        { status: 400 }
      )
    }

    await unsubscribeResendContactFromAudiences({
      email: subscription_id,
      audienceIds: [audienceId],
    })

    return NextResponse.json(
      { message: 'Subscriber removed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Subscribers DELETE error:', error)
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
async function handlePost(
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

    const { data: list, error: listError } = await supabase
      .from('distribution_lists')
      .select('slug')
      .eq('id', id)
      .maybeSingle()

    if (listError || !list) {
      return NextResponse.json({ error: 'Distribution list not found' }, { status: 404 })
    }

    const audienceId = getResendAudienceIdForSlug(list.slug)
    if (!audienceId) {
      return NextResponse.json(
        { error: `No Resend audience configured for list slug "${list.slug}"` },
        { status: 400 }
      )
    }

    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const admin = supabaseAdmin()
    const userIdsSet = new Set(user_ids)
    const userEmails = new Map<string, string>()
    const perPage = 1000

    for (let page = 1; ; page++) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage })
      const users = data.users || []

      for (const authUser of users) {
        if (userIdsSet.has(authUser.id) && authUser.email) {
          userEmails.set(authUser.id, authUser.email)
        }
      }

      if (users.length < perPage || userEmails.size >= user_ids.length) {
        break
      }
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', user_ids)

    const profileNameMap = new Map((profiles || []).map((profile) => [profile.id, profile.full_name]))

    const subscribed: string[] = []
    for (const userId of user_ids) {
      const email = userEmails.get(userId)
      if (!email) {
        continue
      }

      await subscribeResendContactToAudiences({
        email,
        fullName: profileNameMap.get(userId) ?? null,
        audienceIds: [audienceId],
        properties: {
          user_id: userId,
          source: 'admin',
        },
      })

      subscribed.push(userId)
    }

    return NextResponse.json(
      {
        data: { subscribed_user_ids: subscribed },
        message: `${subscribed.length} utilisateur(s) abonné(s) avec succès`,
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

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Désabonnement liste de distribution admin',
})

export const POST = withRequestLogging(handlePost, {
  actionType: 'Abonnement liste de distribution admin',
})
