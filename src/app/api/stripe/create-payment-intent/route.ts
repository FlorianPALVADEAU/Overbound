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
      ticketId, 
      eventId, 
      userId, 
      userEmail, 
      upsells = [],
      amount,
      currency = 'eur'
    } = await request.json()

    if (!ticketId || !eventId || !userId || !amount) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Get ticket and event details for validation
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        event:events (
          id,
          title,
          date,
          location,
          status,
          capacity
        ),
        race:races!tickets_race_id_fkey (
          id,
          name,
          distance_km
        )
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 })
    }

    // Verify event availability
    const { count: registrationCount } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)

    const availableSpots = ticket.event.capacity - (registrationCount || 0)
    
    if (availableSpots <= 0) {
      return NextResponse.json({ error: 'Événement complet' }, { status: 409 })
    }

    if (ticket.event.status !== 'on_sale') {
      return NextResponse.json({ error: 'Inscriptions fermées' }, { status: 409 })
    }

    // Check if user is already registered
    const { data: existingRegistration } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single()

    if (existingRegistration) {
      return NextResponse.json({ error: 'Vous êtes déjà inscrit à cet événement' }, { status: 409 })
    }

    // Calculate total and validate amount
    let calculatedTotal = ticket.base_price_cents
    const upsellItems = []

    for (const upsell of upsells) {
      calculatedTotal += upsell.price_cents
      upsellItems.push({
        id: upsell.id,
        name: upsell.name,
        price: upsell.price_cents,
        options: upsell.options || {}
      })
    }

    // Verify the amount matches our calculation
    if (Math.abs(calculatedTotal - amount) > 1) { // Allow 1 cent difference for rounding
      return NextResponse.json({ error: 'Montant incorrect' }, { status: 400 })
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculatedTotal,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: userId,
        event_id: eventId,
        ticket_id: ticketId,
        participant_email: userEmail,
        event_title: ticket.event.title,
        ticket_name: ticket.name,
        race_id: ticket.race?.id || '',
        upsells: JSON.stringify(upsellItems),
      },
      description: `${ticket.event.title} - ${ticket.name}`,
      receipt_email: userEmail,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })

  } catch (error) {
    console.error('Erreur création PaymentIntent:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
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