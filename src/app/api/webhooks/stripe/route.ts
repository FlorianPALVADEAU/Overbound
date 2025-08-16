import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { sendTicketEmail } from '@/lib/email'
import QRCode from 'qrcode'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    console.error('Missing stripe-signature header')
    return new NextResponse('Missing signature', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  console.log(`Received webhook event: ${event.type}`)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      const admin = supabaseAdmin()

      // 1) Vérifier que la session a bien les métadonnées nécessaires
      if (!session.metadata?.user_id || !session.metadata?.ticket_id) {
        console.error('Missing required metadata in session:', session.metadata)
        return new NextResponse('Missing required metadata', { status: 400 })
      }

      // 2) Récupérer les line items pour obtenir la quantité
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product']
      })

      const quantity = lineItems.data[0]?.quantity || 1

      // 3) Insérer la commande
      const { error: orderErr, data: order } = await admin
        .from('orders')
        .insert({
          user_id: session.metadata.user_id,
          stripe_session_id: session.id,
          payment_status: 'paid',
          amount_total: session.amount_total,
          currency: session.currency || 'eur',
          invoice_url: session.invoice,
          customer_email: session.customer_details?.email || session.customer_email,
        })
        .select()
        .single()

      if (orderErr) {
        console.error('Error creating order:', orderErr)
        return new NextResponse('Error creating order', { status: 500 })
      }

      console.log('Order created:', order.id)

      // 4) Créer les inscriptions (une par quantité)
      const registrationsToCreate = Array.from({ length: quantity }, () => ({
        order_id: order.id,
        ticket_id: session.metadata!.ticket_id,
        user_id: session.metadata!.user_id,
        qr_code_token: crypto.randomUUID(),
        transfer_token: crypto.randomUUID(),
      }))

      const { error: regErr, data: registrations } = await admin
        .from('registrations')
        .insert(registrationsToCreate)
        .select()

      if (regErr) {
        console.error('Error creating registrations:', regErr)
        return new NextResponse('Error creating registrations', { status: 500 })
      }

      console.log(`Created ${registrations.length} registrations`)

      // 5) Récupérer les informations pour l'email
      const { data: userProfile } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', session.metadata.user_id)
        .single()

      const { data: ticketWithEvent } = await admin
        .from('tickets')
        .select(`
          name,
          price,
          events (
            title,
            date,
            location,
            description
          )
        `)
        .eq('id', session.metadata.ticket_id)
        .single()

      if (!ticketWithEvent?.events) {
        console.error('Ticket or event not found')
        return new NextResponse('Ticket or event not found', { status: 404 })
      }

      const event_data = ticketWithEvent.events[0]

      // 6) Envoyer un email pour chaque inscription
      for (const registration of registrations) {
        try {
          // Générer le QR code
          const qrUrl = await QRCode.toDataURL(registration.qr_code_token)

          // Envoyer l'email
          await sendTicketEmail({
            to: session.customer_details?.email || session.customer_email as string,
            participantName: userProfile?.full_name || 'Participant',
            eventTitle: event_data.title,
            eventDate: new Date(event_data.date).toLocaleString('fr-FR', {
              dateStyle: 'full',
              timeStyle: 'short'
            }),
            eventLocation: event_data.location,
            ticketName: ticketWithEvent.name,
            qrUrl,
            manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account/ticket/${registration.id}`,
          })

          console.log(`Email sent for registration ${registration.id}`)
        } catch (emailError) {
          console.error(`Error sending email for registration ${registration.id}:`, emailError)
          // Continue with other registrations even if one email fails
        }
      }

      return NextResponse.json({ 
        received: true, 
        order_id: order.id,
        registrations_created: registrations.length 
      })

    } catch (error) {
      console.error('Error processing checkout.session.completed:', error)
      return new NextResponse('Internal server error', { status: 500 })
    }
  }

  // Pour les autres types d'événements, on confirme juste la réception
  console.log(`Webhook event ${event.type} received but not processed`)
  return NextResponse.json({ received: true })
}

export const dynamic = 'force-dynamic'