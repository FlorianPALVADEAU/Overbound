import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateUnsubscribeToken } from '@/lib/email/unsubscribe'

/**
 * POST /api/unsubscribe
 * Handles unsubscribe requests via token validation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Validate and decode token
    let payload
    try {
      payload = validateUnsubscribeToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid token' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Verify user exists and email matches
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', payload.userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update marketing_opt_in to false
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        marketing_opt_in: false,
      })
      .eq('id', payload.userId)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      )
    }

    // Log the unsubscribe event
    const { error: logError } = await supabase.from('email_logs').insert({
      user_id: payload.userId,
      email: payload.email,
      email_type: 'unsubscribe',
      context: {
        action: 'unsubscribe',
        listId: payload.listId,
        timestamp: new Date().toISOString(),
      },
      sent_at: new Date().toISOString(),
    })

    if (logError) {
      console.error('Error logging unsubscribe:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully unsubscribed from marketing emails',
        user: {
          id: profile.id,
          name: profile.full_name,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/unsubscribe?token=xxx
 * Alternative GET endpoint for one-click unsubscribe (RFC 8058)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Validate and decode token
    let payload
    try {
      payload = validateUnsubscribeToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid token' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Update marketing_opt_in to false
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        marketing_opt_in: false,
      })
      .eq('id', payload.userId)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      )
    }

    // Log the unsubscribe event
    await supabase.from('email_logs').insert({
      user_id: payload.userId,
      email: payload.email,
      email_type: 'unsubscribe',
      context: {
        action: 'unsubscribe_one_click',
        listId: payload.listId,
        timestamp: new Date().toISOString(),
      },
      sent_at: new Date().toISOString(),
    })

    // Redirect to success page
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/unsubscribe/success`)
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
