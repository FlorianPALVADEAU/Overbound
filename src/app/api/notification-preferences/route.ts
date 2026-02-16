import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import type { NotificationPreferences, UpdateNotificationPreferencesData } from '@/types/NotificationPreferences'

const updatePreferencesSchema = z.object({
  events_announcements: z.boolean().optional(),
  price_alerts: z.boolean().optional(),
  news_blog: z.boolean().optional(),
  volunteers_opportunities: z.boolean().optional(),
  partner_offers: z.boolean().optional(),
  digest_frequency: z.enum(['immediate', 'daily', 'weekly', 'never']).optional(),
})

const DEFAULT_NOTIFICATION_PREFERENCES: Omit<
  NotificationPreferences,
  'id' | 'user_id' | 'created_at' | 'updated_at'
> = {
  events_announcements: true,
  price_alerts: true,
  news_blog: false,
  volunteers_opportunities: false,
  partner_offers: false,
  digest_frequency: 'immediate',
  registration_confirmations: true,
  ticket_updates: true,
  account_security: true,
}

async function ensureNotificationPreferences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<NotificationPreferences> {
  const { data: existing, error: fetchError } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    throw fetchError
  }

  if (existing) {
    return existing as NotificationPreferences
  }

  const now = new Date().toISOString()
  const { data: created, error: createError } = await supabase
    .from('notification_preferences')
    .insert({
      id: randomUUID(),
      user_id: userId,
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (createError || !created) {
    throw createError ?? new Error('Failed to create notification preferences')
  }

  return created as NotificationPreferences
}

/**
 * GET /api/notification-preferences
 * Get the authenticated user's notification preferences
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await ensureNotificationPreferences(supabase, user.id)

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error in GET /api/notification-preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/notification-preferences
 * Update the authenticated user's notification preferences
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updatePreferencesSchema.parse(body)

    // First, ensure preferences exist for this user
    await ensureNotificationPreferences(supabase, user.id)

    // Update the preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .update(validatedData as UpdateNotificationPreferencesData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating notification preferences:', error)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    // Sync with list_subscriptions
    // Map notification preference fields to list slugs
    const preferenceToListMapping: Record<string, string> = {
      events_announcements: 'events-announcements',
      price_alerts: 'price-alerts',
      news_blog: 'news-blog',
      volunteers_opportunities: 'volunteers-opportunities',
      partner_offers: 'partner-offers',
    }

    // Update list_subscriptions for each changed preference
    for (const [prefKey, listSlug] of Object.entries(preferenceToListMapping)) {
      if (prefKey in validatedData) {
        const isSubscribed = validatedData[prefKey as keyof UpdateNotificationPreferencesData]

        // Get the list ID
        const { data: list } = await supabase
          .from('distribution_lists')
          .select('id')
          .eq('slug', listSlug)
          .single()

        if (list) {
          const payload = {
            user_id: user.id,
            list_id: list.id,
            subscribed: isSubscribed,
            subscribed_at: isSubscribed ? new Date().toISOString() : null,
            unsubscribed_at: !isSubscribed ? new Date().toISOString() : null,
            source: 'preferences',
          }

          const { data: existing } = await supabase
            .from('list_subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('list_id', list.id)

          if (existing && existing.length > 0) {
            await supabase
              .from('list_subscriptions')
              .update(payload)
              .eq('user_id', user.id)
              .eq('list_id', list.id)
          } else {
            await supabase.from('list_subscriptions').insert(payload)
          }
        }
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }

    console.error('Error in PATCH /api/notification-preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
