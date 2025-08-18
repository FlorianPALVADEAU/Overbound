// /app/api/stripe/checkout/route.ts
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(request: NextRequest) {
  try {
    const { 
      ticketId, 
      eventId, 
      userId, 
      userEmail, 
      participantName 
    } = await request.json();

    if (!ticketId || !eventId || !userId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const supabase = await createSupabaseServer();

    // Récupérer les informations du ticket et de l'événement
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
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 });
    }

    // Vérifier la disponibilité
    const { count: registrationCount } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    const availableSpots = ticket.event.capacity - (registrationCount || 0);
    
    if (availableSpots <= 0) {
      return NextResponse.json({ error: 'Événement complet' }, { status: 409 });
    }

    if (ticket.event.status !== 'on_sale') {
      return NextResponse.json({ error: 'Inscriptions fermées' }, { status: 409 });
    }

    // Vérifier si l'utilisateur n'est pas déjà inscrit
    const { data: existingRegistration } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (existingRegistration) {
      return NextResponse.json({ error: 'Vous êtes déjà inscrit à cet événement' }, { status: 409 });
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: ticket.currency,
            product_data: {
              name: `${ticket.event.title} - ${ticket.name}`,
              description: ticket.race 
                ? `Course: ${ticket.race.name} (${ticket.race.distance_km}km)`
                : ticket.description || 'Participation à l\'événement',
              metadata: {
                event_id: eventId,
                ticket_id: ticketId,
                race_id: ticket.race?.id || '',
              }
            },
            unit_amount: ticket.base_price_cents,
          },
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      success_url: `${base}/events/${eventId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/events/${eventId}?canceled=1`,
      metadata: {
        user_id: userId,
        event_id: eventId,
        ticket_id: ticketId,
        participant_name: participantName || userEmail,
        race_id: ticket.race?.id || '',
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Erreur création session Stripe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}