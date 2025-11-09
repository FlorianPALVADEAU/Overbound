import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { NotificationPreferences, UpdateNotificationPreferencesData } from '@/types/NotificationPreferences'

const updatePreferencesSchema = z.object({
  events_announcements: z.boolean().optional(),
  price_alerts: z.boolean().optional(),
  news_blog: z.boolean().optional(),
  volunteers_opportunities: z.boolean().optional(),
  partner_offers: z.boolean().optional(),
  digest_frequency: z.enum(['immediate', 'daily', 'weekly', 'never']).optional(),
})

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

    // Get or create preferences using the database function
    const { data, error } = await supabase.rpc('get_or_create_notification_preferences', {
      p_user_id: user.id,
    })

    if (error) {
      console.error('Error fetching notification preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    // The RPC returns an array, get the first element
    const rawPrefs = Array.isArray(data) ? data[0] : data

    // Map the renamed columns back to expected names
    const preferences = {
      id: rawPrefs.pref_id,
      user_id: rawPrefs.pref_user_id,
      events_announcements: rawPrefs.events_announcements,
      price_alerts: rawPrefs.price_alerts,
      news_blog: rawPrefs.news_blog,
      volunteers_opportunities: rawPrefs.volunteers_opportunities,
      partner_offers: rawPrefs.partner_offers,
      digest_frequency: rawPrefs.digest_frequency,
      registration_confirmations: rawPrefs.registration_confirmations,
      ticket_updates: rawPrefs.ticket_updates,
      account_security: rawPrefs.account_security,
      created_at: rawPrefs.created_at,
      updated_at: rawPrefs.updated_at,
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
    await supabase.rpc('get_or_create_notification_preferences', {
      p_user_id: user.id,
    })

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

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }

    console.error('Error in PATCH /api/notification-preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
