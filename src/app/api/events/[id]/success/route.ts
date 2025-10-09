import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'Session Stripe manquante' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-07-30.basil',
    })

    let session: Stripe.Checkout.Session | null = null
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId)
    } catch (stripeError) {
      console.error('[success-data] Stripe error', stripeError)
      return NextResponse.json({ error: 'Session Stripe introuvable' }, { status: 400 })
    }

    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 })
    }

    const { data: registration, error: registrationError } = await supabase
      .from('registrations')
      .select(
        `*,
        ticket:tickets (
          id,
          name,
          description,
          base_price_cents,
          currency,
          requires_document,
          race:races!tickets_race_id_fkey (
            id,
            name,
            type,
            difficulty,
            distance_km
          )
        ),
        event:events (
          id,
          title,
          subtitle,
          date,
          location
        ),
        order:orders (
          id,
          amount_total,
          currency,
          stripe_session_id
        )
      `,
      )
      .eq('order.stripe_session_id', sessionId)
      .maybeSingle()

    if (registrationError || !registration) {
      console.error('[success-data] Registration not found for session', sessionId)
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 })
    }

    if (registration.user_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    return NextResponse.json({ registration })
  } catch (error) {
    console.error('[success-data] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
