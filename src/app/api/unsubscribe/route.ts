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

    // If listId is provided, unsubscribe from that specific list
    if (payload.listId) {
      // Update list_subscriptions
      const { error: listError } = await supabase
        .from('list_subscriptions')
        .update({
          subscribed: false,
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('user_id', payload.userId)
        .eq('list_id', payload.listId)

      if (listError) {
        console.error('Error updating list subscription:', listError)
        return NextResponse.json(
          { error: 'Failed to unsubscribe from list' },
          { status: 500 }
        )
      }

      // Get list details to map to notification preference
      const { data: list } = await supabase
        .from('distribution_lists')
        .select('slug')
        .eq('id', payload.listId)
        .single()

      // Map list slug to notification preference field
      const listMapping: Record<string, string> = {
        'events-announcements': 'events_announcements',
        'price-alerts': 'price_alerts',
        'news-blog': 'news_blog',
        'volunteers-opportunities': 'volunteers_opportunities',
        'partner-offers': 'partner_offers',
      }

      if (list && listMapping[list.slug]) {
        // Update corresponding notification preference
        await supabase
          .from('notification_preferences')
          .update({ [listMapping[list.slug]]: false })
          .eq('user_id', payload.userId)
      }
    } else {
      // No specific list - unsubscribe from ALL marketing lists
      const { error: allListsError } = await supabase
        .from('list_subscriptions')
        .update({
          subscribed: false,
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('user_id', payload.userId)

      if (allListsError) {
        console.error('Error updating all list subscriptions:', allListsError)
      }

      // Update ALL notification preferences to false
      await supabase
        .from('notification_preferences')
        .update({
          events_announcements: false,
          price_alerts: false,
          news_blog: false,
          volunteers_opportunities: false,
          partner_offers: false,
        })
        .eq('user_id', payload.userId)

      // Also update marketing_opt_in to false for backward compatibility
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

    // If listId is provided, unsubscribe from that specific list
    if (payload.listId) {
      // Update list_subscriptions
      const { error: listError } = await supabase
        .from('list_subscriptions')
        .update({
          subscribed: false,
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('user_id', payload.userId)
        .eq('list_id', payload.listId)

      if (listError) {
        console.error('Error updating list subscription:', listError)
        return NextResponse.json(
          { error: 'Failed to unsubscribe from list' },
          { status: 500 }
        )
      }

      // Get list details to map to notification preference
      const { data: list } = await supabase
        .from('distribution_lists')
        .select('slug')
        .eq('id', payload.listId)
        .single()

      // Map list slug to notification preference field
      const listMapping: Record<string, string> = {
        'events-announcements': 'events_announcements',
        'price-alerts': 'price_alerts',
        'news-blog': 'news_blog',
        'volunteers-opportunities': 'volunteers_opportunities',
        'partner-offers': 'partner_offers',
      }

      if (list && listMapping[list.slug]) {
        // Update corresponding notification preference
        await supabase
          .from('notification_preferences')
          .update({ [listMapping[list.slug]]: false })
          .eq('user_id', payload.userId)
      }
    } else {
      // No specific list - unsubscribe from ALL marketing lists
      const { error: allListsError } = await supabase
        .from('list_subscriptions')
        .update({
          subscribed: false,
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('user_id', payload.userId)

      if (allListsError) {
        console.error('Error updating all list subscriptions:', allListsError)
      }

      // Update ALL notification preferences to false
      await supabase
        .from('notification_preferences')
        .update({
          events_announcements: false,
          price_alerts: false,
          news_blog: false,
          volunteers_opportunities: false,
          partner_offers: false,
        })
        .eq('user_id', payload.userId)

      // Also update marketing_opt_in to false for backward compatibility
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
