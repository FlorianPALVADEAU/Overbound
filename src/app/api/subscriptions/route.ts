import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * GET /api/subscriptions
 * Get current user's subscriptions to all lists
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active distribution lists
    const { data: lists, error: listsError } = await supabase
      .from('distribution_lists')
      .select('*')
      .eq('active', true)
      .order('type')
      .order('name')

    if (listsError) {
      console.error('Error fetching lists:', listsError)
      return NextResponse.json(
        { error: 'Failed to fetch lists' },
        { status: 500 }
      )
    }

    // Get user's subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('list_subscriptions')
      .select('*')
      .eq('user_id', user.id)

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    // Create a map of list_id => subscription status
    const subscriptionMap = new Map(
      subscriptions?.map((sub) => [sub.list_id, sub.subscribed]) || []
    )

    // Map lists with subscription status
    const listsWithStatus = lists?.map((list) => ({
      ...list,
      subscribed: subscriptionMap.get(list.id) ?? false,
    }))

    return NextResponse.json({ data: listsWithStatus }, { status: 200 })
  } catch (error) {
    console.error('Subscriptions GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/subscriptions
 * Update user's subscriptions (batch update)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()

    // Schema: { subscriptions: { [list_id]: boolean } }
    const schema = z.object({
      subscriptions: z.record(z.string().uuid(), z.boolean()),
    })

    const validatedData = schema.parse(body)

    // Get client IP for logging
    const ip = request.headers.get('x-forwarded-for') || request.ip || null

    // Process each subscription update
    const updates = Object.entries(validatedData.subscriptions).map(
      ([listId, subscribed]) => ({
        user_id: user.id,
        list_id: listId,
        subscribed,
        source: 'preferences_page' as const,
        subscription_ip: ip,
        ...(subscribed
          ? { subscribed_at: new Date().toISOString() }
          : { unsubscribed_at: new Date().toISOString() }),
      })
    )

    // Upsert subscriptions
    const { data, error } = await supabase
      .from('list_subscriptions')
      .upsert(updates, {
        onConflict: 'user_id,list_id',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error('Error updating subscriptions:', error)
      return NextResponse.json(
        { error: 'Failed to update subscriptions' },
        { status: 500 }
      )
    }

    // Also update profiles.marketing_opt_in based on marketing lists
    // If user is subscribed to ANY marketing-type list, set marketing_opt_in = true
    const { data: allSubs } = await supabase
      .from('list_subscriptions')
      .select(
        `
        subscribed,
        distribution_lists!inner(type)
      `
      )
      .eq('user_id', user.id)
      .eq('subscribed', true)

    const hasMarketingSubscription = allSubs?.some(
      (sub: any) =>
        sub.distribution_lists?.type === 'marketing' ||
        sub.distribution_lists?.type === 'events' ||
        sub.distribution_lists?.type === 'news'
    )

    await supabase
      .from('profiles')
      .update({ marketing_opt_in: !!hasMarketingSubscription })
      .eq('id', user.id)

    return NextResponse.json(
      {
        data,
        message: 'Préférences mises à jour avec succès',
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Subscriptions PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
