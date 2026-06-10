import { createClient, supabaseAdmin } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import type { NotificationPreferences, UpdateNotificationPreferencesData } from '@/types/NotificationPreferences'
import {
  getResendTopicPreferences,
  mapSlugsToAudienceIds,
  syncResendContactTopics,
  subscribeResendContactToAudiences,
  unsubscribeResendContactFromAudiences,
} from '@/lib/email/resendAudiences'

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
  supabase: ReturnType<typeof supabaseAdmin>,
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
    const admin = supabaseAdmin()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let preferences = await ensureNotificationPreferences(admin, user.id)

    // Source of truth for marketing toggles is Resend topics.
    if (user.email) {
      const resendTopicPrefs = await getResendTopicPreferences(user.email)
      if (resendTopicPrefs) {
        const nextValues = {
          events_announcements: resendTopicPrefs.events_announcements ?? preferences.events_announcements,
          price_alerts: resendTopicPrefs.price_alerts ?? preferences.price_alerts,
          news_blog: resendTopicPrefs.news_blog ?? preferences.news_blog,
          volunteers_opportunities:
            resendTopicPrefs.volunteers_opportunities ?? preferences.volunteers_opportunities,
          partner_offers: resendTopicPrefs.partner_offers ?? preferences.partner_offers,
        }

        const changed =
          nextValues.events_announcements !== preferences.events_announcements ||
          nextValues.price_alerts !== preferences.price_alerts ||
          nextValues.news_blog !== preferences.news_blog ||
          nextValues.volunteers_opportunities !== preferences.volunteers_opportunities ||
          nextValues.partner_offers !== preferences.partner_offers

        if (changed) {
          const { data: synced } = await admin
            .from('notification_preferences')
            .update(nextValues)
            .eq('user_id', user.id)
            .select()
            .single()

          if (synced) {
            preferences = synced as NotificationPreferences
          } else {
            preferences = {
              ...preferences,
              ...nextValues,
            }
          }
        }
      }
    }

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
    const admin = supabaseAdmin()

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
    await ensureNotificationPreferences(admin, user.id)

    // Update the preferences
    const { data, error } = await admin
      .from('notification_preferences')
      .update(validatedData as UpdateNotificationPreferencesData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating notification preferences:', error)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    // Sync with Resend
    // Map notification preference fields to list slugs
    const preferenceToListMapping: Record<string, string> = {
      events_announcements: 'events-announcements',
      price_alerts: 'price-alerts',
      news_blog: 'news-blog',
      volunteers_opportunities: 'volunteers-opportunities',
      partner_offers: 'partner-offers',
    }
    const allMarketingSlugs = Object.values(preferenceToListMapping)

    if (user.email) {
      const anyMarketingEnabled =
        data.events_announcements ||
        data.price_alerts ||
        data.news_blog ||
        data.volunteers_opportunities ||
        data.partner_offers

      const mapping = mapSlugsToAudienceIds(allMarketingSlugs)
      if (mapping.missingSlugs.length > 0) {
        console.warn('[notification-preferences] missing Resend audience mapping', mapping.missingSlugs)
      }

      if (mapping.audienceIds.length > 0) {
        if (anyMarketingEnabled) {
          await subscribeResendContactToAudiences({
            email: user.email,
            audienceIds: mapping.audienceIds,
            properties: {
              user_id: user.id,
              source: 'notification_preferences',
            },
          })
        } else {
          await unsubscribeResendContactFromAudiences({
            email: user.email,
            audienceIds: mapping.audienceIds,
          })
        }
      }

      await syncResendContactTopics({
        email: user.email,
        preferences: {
          events_announcements: data.events_announcements,
          price_alerts: data.price_alerts,
          news_blog: data.news_blog,
          volunteers_opportunities: data.volunteers_opportunities,
          partner_offers: data.partner_offers,
        },
      })
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
