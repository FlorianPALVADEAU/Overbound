import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import {
  getResendAudienceIdForSlug,
  isResendContactSubscribed,
  mapSlugsToAudienceIds,
  subscribeResendContactToAudiences,
  unsubscribeResendContactFromAudiences,
} from '@/lib/email/resendAudiences'

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

    // Create a map of list_id => subscription status (legacy fallback)
    const subscriptionMap = new Map(
      subscriptions?.map((sub) => [sub.list_id, Boolean(sub.subscribed)]) || []
    )

    // Prefer Resend status when audience mapping exists
    if (user.email && lists && lists.length > 0) {
      await Promise.all(
        lists.map(async (list) => {
          const audienceId = getResendAudienceIdForSlug(list.slug)
          if (!audienceId) return

          try {
            const subscribed = await isResendContactSubscribed({
              email: user.email!,
              audienceId,
            })
            subscriptionMap.set(list.id, subscribed)
          } catch (error) {
            console.warn('[subscriptions] failed to read Resend status', {
              listSlug: list.slug,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        }),
      )
    }

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
    const listIds = Object.keys(validatedData.subscriptions)

    // Resolve list IDs to slugs for Resend audience mapping
    const { data: listsForUpdate, error: listsForUpdateError } = await supabase
      .from('distribution_lists')
      .select('id, slug')
      .in('id', listIds)

    if (listsForUpdateError) {
      console.error('Error fetching distribution lists for Resend sync:', listsForUpdateError)
      return NextResponse.json(
        { error: 'Failed to resolve distribution lists' },
        { status: 500 }
      )
    }

    const listSlugById = new Map((listsForUpdate || []).map((list) => [list.id, list.slug]))

    // Get client IP for logging (use headers only; NextRequest has no `ip` property)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || null

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

    const data: any[] = []
    for (const update of updates) {
      const { data: existing } = await supabase
        .from('list_subscriptions')
        .select('id')
        .eq('user_id', update.user_id)
        .eq('list_id', update.list_id)

      if (existing && existing.length > 0) {
        const { data: updatedRows, error: updateError } = await supabase
          .from('list_subscriptions')
          .update(update)
          .eq('user_id', update.user_id)
          .eq('list_id', update.list_id)
          .select()
        if (updateError) {
          console.error('Error updating subscriptions:', updateError)
          return NextResponse.json(
            { error: 'Failed to update subscriptions' },
            { status: 500 }
          )
        }
        if (updatedRows) data.push(...updatedRows)
      } else {
        const { data: insertedRows, error: insertError } = await supabase
          .from('list_subscriptions')
          .insert(update)
          .select()
        if (insertError) {
          console.error('Error inserting subscriptions:', insertError)
          return NextResponse.json(
            { error: 'Failed to update subscriptions' },
            { status: 500 }
          )
        }
        if (insertedRows) data.push(...insertedRows)
      }
    }

    // Sync Resend audiences
    if (user.email) {
      const subscribedSlugs = listIds
        .filter((listId) => validatedData.subscriptions[listId] === true)
        .map((listId) => listSlugById.get(listId))
        .filter((slug): slug is string => Boolean(slug))

      const unsubscribedSlugs = listIds
        .filter((listId) => validatedData.subscriptions[listId] === false)
        .map((listId) => listSlugById.get(listId))
        .filter((slug): slug is string => Boolean(slug))

      const subscribedAudienceMapping = mapSlugsToAudienceIds(subscribedSlugs)
      const unsubscribedAudienceMapping = mapSlugsToAudienceIds(unsubscribedSlugs)

      if (subscribedAudienceMapping.missingSlugs.length > 0 || unsubscribedAudienceMapping.missingSlugs.length > 0) {
        console.warn('[subscriptions] missing Resend audience mapping', {
          subscribed: subscribedAudienceMapping.missingSlugs,
          unsubscribed: unsubscribedAudienceMapping.missingSlugs,
        })
      }

      const subscribeAudienceSet = new Set(subscribedAudienceMapping.audienceIds)
      const unsubscribeAudienceSet = new Set(unsubscribedAudienceMapping.audienceIds)

      // In single-segment mode, a contact can appear in both sets.
      // "subscribe" wins to avoid false opt-out when at least one list stays enabled.
      for (const audienceId of subscribeAudienceSet) {
        if (unsubscribeAudienceSet.has(audienceId)) {
          unsubscribeAudienceSet.delete(audienceId)
        }
      }

      if (subscribeAudienceSet.size > 0) {
        await subscribeResendContactToAudiences({
          email: user.email,
          audienceIds: Array.from(subscribeAudienceSet),
          properties: {
            user_id: user.id,
            source: 'preferences_page',
          },
        })
      }

      if (unsubscribeAudienceSet.size > 0) {
        await unsubscribeResendContactFromAudiences({
          email: user.email,
          audienceIds: Array.from(unsubscribeAudienceSet),
        })
      }
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
        { error: 'Invalid request data', details: error.issues },
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
