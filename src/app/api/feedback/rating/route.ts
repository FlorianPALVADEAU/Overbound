import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { captureException } from '@/lib/sentry'

export const runtime = 'nodejs'

interface RatingPayload {
  userId: string
  eventId: string
  rating: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()

    // Parse the request body
    const payload = await request.json().catch(() => null)

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
    }

    const { userId, eventId, rating } = payload as RatingPayload

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'userId est requis.' }, { status: 400 })
    }

    if (!eventId) {
      return NextResponse.json({ error: 'eventId est requis.' }, { status: 400 })
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 10) {
      return NextResponse.json(
        { error: 'La note doit être un nombre entre 1 et 10.' },
        { status: 400 }
      )
    }

    // Check if the rating already exists for this user and event
    const { data: existingRating, error: fetchError } = await supabase
      .from('event_ratings')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if no rating exists yet
      console.error('[feedback/rating] Error checking existing rating:', fetchError)
      throw fetchError
    }

    // If rating exists, update it; otherwise, insert a new one
    if (existingRating) {
      const { error: updateError } = await supabase
        .from('event_ratings')
        .update({
          rating,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRating.id)

      if (updateError) {
        console.error('[feedback/rating] Error updating rating:', updateError)
        throw updateError
      }
    } else {
      const { error: insertError } = await supabase
        .from('event_ratings')
        .insert({
          user_id: userId,
          event_id: eventId,
          rating,
          created_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('[feedback/rating] Error inserting rating:', insertError)
        throw insertError
      }
    }

    // TODO: Optional Trustpilot integration
    // If rating is 9 or 10, we could trigger a Trustpilot review invitation
    // await sendTrustpilotInvitation({ userId, eventId, rating })

    return NextResponse.json({
      success: true,
      message: 'Merci pour ton avis !'
    })

  } catch (error) {
    console.error('[feedback/rating] Failed to save rating:', error)

    captureException(error as Error, {
      route: '/api/feedback/rating',
      method: 'POST',
    })

    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'enregistrement de ton avis.' },
      { status: 500 }
    )
  }
}
