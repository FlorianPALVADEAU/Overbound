import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('session_id')
    const paymentIntentId = url.searchParams.get('payment_intent')
    const registrationId = url.searchParams.get('registration_id')
    if (!sessionId && !paymentIntentId && !registrationId) {
      return NextResponse.json({ error: 'Référence de paiement manquante' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    const admin = supabaseAdmin()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    })

    if (sessionId) {
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
    }

    if (paymentIntentId) {
      let paymentIntent: Stripe.PaymentIntent | null = null
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      } catch (stripeError) {
        console.error('[success-data] Stripe error', stripeError)
        return NextResponse.json({ error: 'Paiement Stripe introuvable' }, { status: 400 })
      }

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 })
      }
    }

    // Only the columns the confirmation page renders: asking for more makes
    // the whole read fail on databases that lack a legacy column.
    const registrationSelect = `*,
        ticket:tickets (
          id,
          name,
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
          slug,
          title,
          subtitle,
          date,
          location
        ),
        order:orders (
          id,
          amount_total,
          currency
        )`

    // Resolve which registration the reference points to, then read it in a
    // single query (relations embedded) instead of one query per table.
    let resolvedRegistrationId: string | null = registrationId
    let registrationError: { message?: string } | null = null

    if (!resolvedRegistrationId && paymentIntentId) {
      const byPaymentIntentId = await admin
        .from('registrations')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      registrationError = byPaymentIntentId.error
      resolvedRegistrationId = byPaymentIntentId.data?.id ?? null

      if (!resolvedRegistrationId && !registrationError) {
        const { data: order, error: orderError } = await admin
          .from('orders')
          .select('id')
          .eq('provider', 'stripe')
          .eq('provider_order_id', paymentIntentId)
          .maybeSingle()
        registrationError = orderError
        if (order?.id) {
          const byOrder = await admin
            .from('registrations')
            .select('id')
            .eq('order_id', order.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle()
          registrationError = byOrder.error
          resolvedRegistrationId = byOrder.data?.id ?? null
        }
      }
    } else if (!resolvedRegistrationId && sessionId) {
      const { data: order, error: orderError } = await admin
        .from('orders')
        .select('id')
        .eq('provider', 'stripe')
        .eq('stripe_session_id', sessionId)
        .maybeSingle()
      registrationError = orderError
      if (order?.id) {
        const byOrder = await admin
          .from('registrations')
          .select('id')
          .eq('order_id', order.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()
        registrationError = byOrder.error
        resolvedRegistrationId = byOrder.data?.id ?? null
      }
    }

    let registration = null as any
    if (resolvedRegistrationId && !registrationError) {
      const found = await admin
        .from('registrations')
        .select(registrationSelect)
        .eq('id', resolvedRegistrationId)
        .maybeSingle()
      registration = found.data
      registrationError = found.error
    }

    if (registrationError || !registration) {
      console.error('[success-data] Registration not found', {
        sessionId,
        paymentIntentId,
        registrationId,
        reason: registrationError?.message ?? null,
      })
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 })
    }

    if (registration.user_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Every registration of the same order (a group purchase can hold many).
    const { data: orderRegistrations } = await admin
      .from('registrations')
      .select('id, email, race_format, start_time, ticket:tickets (id, name)')
      .eq('order_id', registration.order_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      registrations: orderRegistrations ?? [],
      registration: {
        ...registration,
        ticket: registration.ticket
          ? {
              ...registration.ticket,
              requires_document: false,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('[success-data] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
