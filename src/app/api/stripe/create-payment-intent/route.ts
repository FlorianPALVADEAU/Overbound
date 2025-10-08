import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const {
      eventId,
      userId,
      userEmail,
      ticketSelections = [],
      participants = [],
      upsells = [],
      promoCode = null,
    } = await request.json()

    if (!eventId || !userId || !userEmail || ticketSelections.length === 0) {
      return NextResponse.json({ error: 'Paramètres insuffisants.' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const ticketIds = ticketSelections.map((item: any) => item.ticketId)

    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select(
        `
        *,
        event:events (
          id,
          title,
          date,
          location,
          status,
          capacity
        )
      `,
      )
      .in('id', ticketIds)

    if (ticketsError || !tickets || tickets.length === 0) {
      return NextResponse.json({ error: 'Impossible de récupérer les billets.' }, { status: 404 })
    }

    const eventRef = tickets[0]?.event
    if (!eventRef || eventRef.id !== eventId) {
      return NextResponse.json({ error: "Les billets ne correspondent pas à l'événement demandé." }, { status: 400 })
    }

    if (eventRef.status !== 'on_sale') {
      return NextResponse.json({ error: 'Inscriptions fermées pour cet événement.' }, { status: 409 })
    }

    const totalRequestedParticipants = ticketSelections.reduce(
      (accumulator: number, item: { quantity: number }) => accumulator + (item.quantity || 0),
      0,
    )

    const { count: existingRegistrationsCount } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)

    const availableSpots = (eventRef.capacity || 0) - (existingRegistrationsCount || 0)

    if (availableSpots <= 0 || totalRequestedParticipants > availableSpots) {
      return NextResponse.json({ error: "Plus assez de places disponibles pour l'ensemble des participants." }, { status: 409 })
    }

    const { data: existingRegistration } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle()

    if (existingRegistration) {
      return NextResponse.json({ error: 'Vous êtes déjà inscrit à cet événement.' }, { status: 409 })
    }

    const ticketPriceMap = new Map<string, number>()
    const ticketCurrencyMap = new Map<string, string>()

    for (const ticket of tickets) {
      if (ticket.base_price_cents == null) {
        return NextResponse.json({ error: `Le billet "${ticket.name}" n'a pas de tarif défini.` }, { status: 422 })
      }
      ticketPriceMap.set(ticket.id, ticket.base_price_cents)
      ticketCurrencyMap.set(ticket.id, (ticket.currency || 'eur').toLowerCase())
    }

    const ticketSubtotal = ticketSelections.reduce((accumulator: number, item: { ticketId: string; quantity: number }) => {
      const unitPrice = ticketPriceMap.get(item.ticketId) || 0
      return accumulator + unitPrice * (item.quantity || 0)
    }, 0)

    const { data: upsellRows } = await supabase
      .from('upsells')
      .select('*')
      .eq('is_active', true)
      .or(`event_id.eq.${eventId},event_id.is.null`)

    const upsellMap = new Map<string, any>()
    for (const row of upsellRows || []) {
      upsellMap.set(row.id, row)
    }

    const upsellSubtotal = upsells.reduce((accumulator: number, item: { upsellId: string; quantity: number }) => {
      const upsell = upsellMap.get(item.upsellId)
      if (!upsell) {
        return accumulator
      }
      return accumulator + upsell.price_cents * (item.quantity || 0)
    }, 0)

    let discountAmount = 0
    let appliedPromo = null

    if (promoCode) {
      const { data: promo, error: promoError } = await supabase
        .from('promotional_codes')
        .select(
          `
          id,
          code,
          discount_percent,
          discount_amount,
          currency,
          is_active,
          valid_from,
          valid_until,
          usage_limit,
          used_count,
          events:promotional_code_events(event_id)
        `,
        )
        .ilike('code', String(promoCode).trim().toUpperCase())
        .maybeSingle()

      if (!promoError && promo) {
        const now = new Date()
        const validFrom = promo.valid_from ? new Date(promo.valid_from) : null
        const validUntil = promo.valid_until ? new Date(promo.valid_until) : null

        const allowedEvents = (promo.events || []).map((event: { event_id: string }) => event.event_id)
        const matchesEvent = allowedEvents.length === 0 || allowedEvents.includes(eventId)

        const withinDates = (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)
        const usageAvailable =
          promo.usage_limit == null || promo.used_count < promo.usage_limit

        if (promo.is_active && matchesEvent && withinDates && usageAvailable) {
          if (promo.discount_percent && promo.discount_percent > 0) {
            discountAmount = Math.round(ticketSubtotal * (promo.discount_percent / 100))
          } else if (promo.discount_amount && promo.discount_amount > 0) {
            discountAmount = promo.discount_amount
          }
          discountAmount = Math.min(discountAmount, ticketSubtotal)
          appliedPromo = {
            id: promo.id,
            code: promo.code,
            discount_percent: promo.discount_percent,
            discount_amount: promo.discount_amount,
            currency: promo.currency,
          }
        }
      }
    }

    const totalAmount = Math.max(ticketSubtotal + upsellSubtotal - discountAmount, 0)

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Montant total invalide.' }, { status: 422 })
    }

    const currency = ticketCurrencyMap.values().next().value || 'eur'

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: userId,
        event_id: eventId,
        ticket_selections: JSON.stringify(ticketSelections),
        participants: JSON.stringify(participants),
        upsells: JSON.stringify(upsells),
        promo_code: appliedPromo?.code || '',
        discount_applied: discountAmount.toString(),
        event_title: eventRef.title,
      },
      receipt_email: userEmail,
      description: `${eventRef.title} - Billets et options`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      pricing: {
        ticketTotal: ticketSubtotal,
        upsellTotal: upsellSubtotal,
        discountAmount,
        totalDue: totalAmount,
        currency,
      },
    })
  } catch (error) {
    console.error('Erreur création PaymentIntent:', error)
    return NextResponse.json({ error: 'Erreur lors de la préparation du paiement.' }, { status: 500 })
  }
}

// Handle PaymentIntent status updates (optional - for webhook alternative)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('payment_intent_id')

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'PaymentIntent ID requis' }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    return NextResponse.json({
      status: paymentIntent.status,
      payment_intent: paymentIntent
    })

  } catch (error) {
    console.error('Erreur récupération PaymentIntent:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
