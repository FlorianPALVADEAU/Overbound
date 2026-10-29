import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { EVENT_OPENING_FIRST_LIST_ID } from '@/lib/subscriptions/constants'
import { listSubscribers } from '@/lib/email/audience'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { z } from 'zod'

const subscribersQuerySchema = z.object({
  subscribedOnly: z
    .string()
    .optional()
    .default('true')
    .transform((value) => value !== 'false'),
  search: z.string().trim().max(120).optional().default(''),
  limit: z.coerce.number().int().min(1).max(100).optional().default(100),
  offset: z.coerce.number().int().min(0).max(100_000).optional().default(0),
})

const addSubscribersSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1).max(500),
})

/**
 * GET /api/admin/distribution-lists/[id]/subscribers
 * Get all subscribers for a distribution list (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params

    const parsedQuery = subscribersQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    )
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid subscriber query parameters', details: parsedQuery.error.flatten() },
        { status: 400 },
      )
    }

    const { subscribedOnly, search, limit, offset } = parsedQuery.data

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

      const notificationSearch = search
        ? search.replace(/[(),\\*]/g, '\\$&')
        : ''
      let notificationsQuery = admin
        .from('event_opening_notifications')
        .select('id, email, full_name, user_id, source, created_at')
        .eq('event_id', firstEvent.id)
      if (notificationSearch) {
        notificationsQuery = notificationsQuery.or(
          `email.ilike.*${notificationSearch}*,full_name.ilike.*${notificationSearch}*`,
        )
      }
      const { data: notifications, error: notificationsError } = await notificationsQuery
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

      let notificationCountQuery = admin
        .from('event_opening_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', firstEvent.id)
      if (notificationSearch) {
        notificationCountQuery = notificationCountQuery.or(
          `email.ilike.*${notificationSearch}*,full_name.ilike.*${notificationSearch}*`,
        )
      }
      const { count } = await notificationCountQuery

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

    const { data: list, error: listError } = await admin
      .from('distribution_lists')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (listError || !list) {
      return NextResponse.json({ error: 'Distribution list not found' }, { status: 404 })
    }

    const subscribers = await listSubscribers([list.id], { subscribedOnly })
    const normalizedSearch = search.toLocaleLowerCase('fr-FR')
    const filteredSubscribers = subscribers
      .filter((subscriber) => {
        if (!normalizedSearch) return true
        return [subscriber.email, subscriber.fullName ?? ''].some((value) =>
          value.toLocaleLowerCase('fr-FR').includes(normalizedSearch),
        )
      })
      .sort((a, b) => a.email.localeCompare(b.email))

    const subscribersWithDetails = filteredSubscribers.slice(offset, offset + limit).map((subscriber) => ({
      id: subscriber.id,
      user_id: subscriber.userId,
      list_id: id,
      subscribed: subscriber.subscribed,
      source: subscriber.source ?? 'unknown',
      subscribed_at: subscriber.subscribedAt,
      user: {
        id: subscriber.userId,
        email: subscriber.email,
        full_name: subscriber.fullName,
      },
    }))

    return NextResponse.json(
      {
        data: subscribersWithDetails,
        total: filteredSubscribers.length,
        limit,
        offset,
        search,
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
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const { id: listId } = await params

    // Parse request body to get subscription_id
    const body = await request.json()
    const { subscription_id }: { subscription_id: string } = body

    if (!subscription_id) {
      return NextResponse.json(
        { error: 'subscription_id is required' },
        { status: 400 }
      )
    }

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

    const { data: removed, error: removeError } = await admin
      .from('list_subscriptions')
      .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
      .eq('id', subscription_id)
      .eq('list_id', listId)
      .select('id')

    if (removeError) {
      console.error('Error unsubscribing subscriber:', removeError)
      return NextResponse.json({ error: 'Failed to remove subscriber' }, { status: 500 })
    }
    if (!removed || removed.length === 0) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
    }

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
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params

    const parsedBody = addSubscribersSchema.safeParse(await request.json())
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'user_ids array is required', details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }
    const userIds = Array.from(new Set(parsedBody.data.user_ids))

    const admin = supabaseAdmin()
    const { data: list, error: listError } = await admin
      .from('distribution_lists')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (listError || !list) {
      return NextResponse.json({ error: 'Distribution list not found' }, { status: 404 })
    }

    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id')
      .in('id', userIds)
    if (profilesError) {
      console.error('Error reading profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to add subscribers' }, { status: 500 })
    }
    const knownUserIds = (profiles ?? []).map((profile: { id: string }) => profile.id)

    const { data: existing, error: existingError } = await admin
      .from('list_subscriptions')
      .select('id, user_id')
      .eq('list_id', id)
      .in('user_id', knownUserIds)
    if (existingError) {
      console.error('Error reading subscriptions:', existingError)
      return NextResponse.json({ error: 'Failed to add subscribers' }, { status: 500 })
    }

    const existingByUser = new Map(
      (existing ?? []).map((row: { id: string; user_id: string }) => [row.user_id, row.id]),
    )
    const now = new Date().toISOString()

    for (const [, subscriptionId] of existingByUser) {
      const { error: updateError } = await admin
        .from('list_subscriptions')
        .update({ subscribed: true, subscribed_at: now, unsubscribed_at: null, source: 'admin' })
        .eq('id', subscriptionId)
      if (updateError) {
        console.error('Error re-subscribing user:', updateError)
        return NextResponse.json({ error: 'Failed to add subscribers' }, { status: 500 })
      }
    }

    const missing = knownUserIds.filter((userId) => !existingByUser.has(userId))
    if (missing.length > 0) {
      const { error: insertError } = await admin.from('list_subscriptions').insert(
        missing.map((userId) => ({
          user_id: userId,
          list_id: id,
          subscribed: true,
          subscribed_at: now,
          source: 'admin',
        })),
      )
      if (insertError) {
        console.error('Error subscribing users:', insertError)
        return NextResponse.json({ error: 'Failed to add subscribers' }, { status: 500 })
      }
    }

    return NextResponse.json(
      {
        data: { subscribed_user_ids: knownUserIds },
        message: `${knownUserIds.length} utilisateur(s) abonné(s) avec succès`,
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
