// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  const admin = supabaseAdmin();

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};

      const {
        user_id,
        event_id,
        ticket_id,
        participant_name,
        race_id
      } = metadata;

      if (!user_id || !event_id || !ticket_id) {
        console.error('Métadonnées manquantes dans la session Stripe:', metadata);
        return new Response('Métadonnées manquantes', { status: 400 });
      }

      try {
        // Générer un token QR unique
        const qrToken = uuidv4();
        const transferToken = uuidv4();

        // Créer la commande
        const { data: order, error: orderError } = await admin
          .from('orders')
          .insert({
            user_id,
            event_id,
            ticket_id,
            stripe_session_id: session.id,
            amount_total: session.amount_total || 0,
            currency: session.currency || 'eur',
            payment_status: 'paid',
            customer_email: session.customer_details?.email || session.customer_email,
            customer_name: participant_name || session.customer_details?.name,
          })
          .select()
          .single();

        if (orderError) {
          console.error('Erreur création commande:', orderError);
          throw orderError;
        }

        // Créer l'inscription
        const { data: registration, error: registrationError } = await admin
          .from('registrations')
          .insert({
            user_id,
            event_id,
            ticket_id,
            order_id: order.id,
            email: session.customer_details?.email || session.customer_email,
            participant_name: participant_name || session.customer_details?.name,
            qr_code_token: qrToken,
            transfer_token: transferToken,
            approval_status: 'approved', // Auto-approuvé pour les paiements réussis
            race_id: race_id || null,
          })
          .select()
          .single();

        if (registrationError) {
          console.error('Erreur création inscription:', registrationError);
          throw registrationError;
        }

        console.log('Inscription créée avec succès:', {
          registration_id: registration.id,
          user_id,
          event_id,
          ticket_id,
          amount: session.amount_total
        });

        // TODO: Envoyer l'email de confirmation avec le QR code
        // await sendTicketEmail({
        //   to: registration.email,
        //   participantName: registration.participant_name,
        //   eventTitle: event.title,
        //   eventDate: event.date,
        //   eventLocation: event.location,
        //   ticketName: ticket.name,
        //   qrUrl: `data:image/png;base64,${qrCodeBase64}`,
        //   manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account/ticket/${registration.id}`
        // });

      } catch (error) {
        console.error('Erreur lors de la création de l\'inscription:', error);
        return new Response('Erreur interne', { status: 500 });
      }
      break;
    }
    
    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Session Stripe expirée:', session.id);
      break;
    }

    default:
      console.log(`Événement Stripe non géré: ${event.type}`);
      break;
  }

  return new Response('ok', { status: 200 });
}