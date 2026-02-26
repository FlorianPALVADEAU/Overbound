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

    const baseSelect = `*,
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
          stripe_session_id,
          provider,
          provider_order_id
        )`

    const registrationQuery = admin
      .from('registrations')
      .select(baseSelect)

    let registration = null as any
    let registrationError: any = null

    if (registrationId) {
      const baseRegistration = await admin
        .from('registrations')
        .select('*')
        .eq('id', registrationId)
        .maybeSingle()

      if (baseRegistration.error) {
        registrationError = baseRegistration.error
      } else if (baseRegistration.data) {
        const [ticketRes, eventRes, orderRes] = await Promise.all([
          admin
            .from('tickets')
            .select(
              `
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
            `,
            )
            .eq('id', baseRegistration.data.ticket_id)
            .maybeSingle(),
          admin
            .from('events')
            .select('id, title, subtitle, date, location')
            .eq('id', baseRegistration.data.event_id)
            .maybeSingle(),
          admin
            .from('orders')
            .select('id, amount_total, currency, stripe_session_id, provider, provider_order_id')
            .eq('id', baseRegistration.data.order_id)
            .maybeSingle(),
        ])

        registration = {
          ...baseRegistration.data,
          ticket: ticketRes.data ?? null,
          event: eventRes.data ?? null,
          order: orderRes.data ?? null,
        }

        registrationError = ticketRes.error || eventRes.error || orderRes.error
      }
    } else if (paymentIntentId) {
      let registrationId: string | null = null

      const byPaymentIntentId = await admin
        .from('registrations')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (byPaymentIntentId.error) {
        registrationError = byPaymentIntentId.error
      } else if (byPaymentIntentId.data?.id) {
        registrationId = byPaymentIntentId.data.id
      } else {
        const { data: order, error: orderError } = await admin
          .from('orders')
          .select('id')
          .eq('provider', 'stripe')
          .eq('provider_order_id', paymentIntentId)
          .maybeSingle()
        if (orderError) {
          registrationError = orderError
        } else if (order?.id) {
          const byOrder = await admin
            .from('registrations')
            .select('id')
            .eq('order_id', order.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle()
          if (byOrder.error) {
            registrationError = byOrder.error
          } else {
            registrationId = byOrder.data?.id ?? null
          }
        }
      }

      if (registrationId && !registrationError) {
        const byRegistrationId = await registrationQuery
          .eq('id', registrationId)
          .maybeSingle()
        registration = byRegistrationId.data
        registrationError = byRegistrationId.error
      }
    } else {
      const bySession = await registrationQuery
        .eq('orders.stripe_session_id', sessionId)
        .eq('orders.provider', 'stripe')
        .maybeSingle()
      registration = bySession.data
      registrationError = bySession.error
    }

    if (registrationError || !registration) {
      console.error('[success-data] Registration not found', { sessionId, paymentIntentId, registrationId })
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
