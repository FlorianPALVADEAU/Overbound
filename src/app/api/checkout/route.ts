import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const { ticketId, quantity = 1 } = await req.json()

    if (!ticketId) {
      return NextResponse.json({ error: 'Missing ticketId' }, { status: 400 })
    }

    // 1) Authentification
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2) Récupérer le ticket avec l'événement
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        id,
        name,
        stripe_price_id,
        price,
        max_quantity,
        events (
          id,
          title,
          date,
          status
        )
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (!ticket.stripe_price_id) {
      return NextResponse.json({ error: 'Ticket not available for purchase' }, { status: 400 })
    }

    // 3) Vérifications business
    const event = ticket.events?.[0]
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Vérifier que l'événement est actif
    if (event.status !== 'active') {
      return NextResponse.json({ error: 'Event is not available for registration' }, { status: 400 })
    }

    // Vérifier que l'événement n'est pas passé
    if (new Date(event.date) < new Date()) {
      return NextResponse.json({ error: 'Event has already passed' }, { status: 400 })
    }

    // Vérifier la quantité maximale
    if (ticket.max_quantity && quantity > ticket.max_quantity) {
      return NextResponse.json({ 
        error: `Maximum quantity is ${ticket.max_quantity}` 
      }, { status: 400 })
    }

    // 4) Vérifier si l'utilisateur est déjà inscrit
    const { data: existingRegistration } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('ticket_id', ticketId)
      .single()

    if (existingRegistration) {
      return NextResponse.json({ 
        error: 'You are already registered for this event' 
      }, { status: 400 })
    }

    // 5) Récupérer le profil utilisateur pour le nom
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // 6) Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ 
        price: ticket.stripe_price_id, 
        quantity 
      }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/events/${event.id}?canceled=1`,
      customer_email: user.email || undefined,
      metadata: { 
        user_id: user.id, 
        ticket_id: ticket.id,
        event_id: event.id,
        user_name: profile?.full_name || user.email || 'Unknown'
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      custom_text: {
        submit: {
          message: `Inscription pour ${event.title} - ${ticket.name}`
        }
      },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Inscription - ${event.title}`,
          custom_fields: [
            {
              name: 'Événement',
              value: event.title
            },
            {
              name: 'Type de billet',
              value: ticket.name
            }
          ]
        }
      }
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    return NextResponse.json({ 
      url: session.url,
      session_id: session.id
    })

  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}