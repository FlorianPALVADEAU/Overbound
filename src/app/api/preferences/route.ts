import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for preferences
const preferencesSchema = z.object({
  marketing_opt_in: z.boolean().optional(),
})

/**
 * PATCH /api/preferences
 * Update user email preferences (authenticated)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = preferencesSchema.parse(body)

    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: 'No preferences provided' },
        { status: 400 }
      )
    }

    // Get user's email for logging
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', user.id)
      .single()

    // Update profile with new preferences
    const { error: updateError } = await supabase
      .from('profiles')
      .update(validatedData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating preferences:', updateError)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    // Log the preference change
    if (validatedData.marketing_opt_in !== undefined) {
      const { error: logError } = await supabase.from('email_logs').insert({
        user_id: user.id,
        email: user.email || '',
        email_type: validatedData.marketing_opt_in
          ? 'preference_optin'
          : 'preference_optout',
        context: {
          action: 'preference_update',
          marketing_opt_in: validatedData.marketing_opt_in,
          timestamp: new Date().toISOString(),
          source: 'preferences_page',
        },
        sent_at: new Date().toISOString(),
      })

      if (logError) {
        console.error('Error logging preference change:', logError)
        // Don't fail the request if logging fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Preferences updated successfully',
        preferences: validatedData,
        user: {
          id: profile?.id,
          name: profile?.full_name,
        },
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

    console.error('Preferences update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/preferences
 * Get user email preferences (authenticated)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user preferences
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, marketing_opt_in')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        preferences: {
          marketing_opt_in: profile.marketing_opt_in || false,
        },
        user: {
          id: profile.id,
          name: profile.full_name,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Fetch preferences error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
