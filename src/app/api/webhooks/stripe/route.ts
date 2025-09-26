import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { sendTicketEmail } from '@/lib/email'
import * as QRCode from 'qrcode'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') as string
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(`Webhook Error: ${err}`, { status: 400 })
  }

  const admin = supabaseAdmin()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const metadata = paymentIntent.metadata || {}

      const {
        user_id,
        event_id,
        ticket_id,
        participant_email,
        event_title,
        ticket_name,
        race_id,
        upsells: upsellsJson
      } = metadata

      if ((!ticket_id || ticket_id.trim() === '') && metadata.ticket_selections) {
        console.log('Webhook skip: handled by multi-inscription flow for PaymentIntent', paymentIntent.id)
        return new Response('ok', { status: 200 })
      }

      if (!user_id || !event_id || !ticket_id) {
        console.error('Métadonnées manquantes dans le PaymentIntent:', metadata)
        return new Response('Métadonnées manquantes', { status: 400 })
      }

      try {
        // Check if registration already exists
        const { data: existingReg } = await admin
          .from('registrations')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (existingReg) {
          console.log('Registration already exists for PaymentIntent:', paymentIntent.id)
          return new Response('ok', { status: 200 })
        }

        // Parse upsells
        let upsells = []
        try {
          upsells = upsellsJson ? JSON.parse(upsellsJson) : []
        } catch (e) {
          console.warn('Could not parse upsells JSON:', upsellsJson)
        }

        // Generate unique tokens
        const qrToken = uuidv4()
        const transferToken = uuidv4()

        // Get full event details
        const { data: event, error: eventError } = await admin
          .from('events')
          .select('*')
          .eq('id', event_id)
          .single()

        if (eventError || !event) {
          console.error('Event not found:', event_id, eventError)
          return new Response('Event not found', { status: 404 })
        }

        // Get ticket details
        const { data: ticket, error: ticketError } = await admin
          .from('tickets')
          .select('*')
          .eq('id', ticket_id)
          .single()

        if (ticketError || !ticket) {
          console.error('Ticket not found:', ticket_id, ticketError)
          return new Response('Ticket not found', { status: 404 })
        }

        // Create order
        const { data: order, error: orderError } = await admin
          .from('orders')
          .insert({
            user_id,
            email: participant_email,
            status: 'paid',
            amount_total: paymentIntent.amount,
            currency: paymentIntent.currency,
            provider: 'stripe',
            provider_order_id: paymentIntent.id,
          })
          .select()
          .single()

        if (orderError) {
          console.error('Error creating order:', orderError)
          throw orderError
        }

        // Create registration
        const { data: registration, error: registrationError } = await admin
          .from('registrations')
          .insert({
            user_id,
            event_id,
            ticket_id,
            order_id: order.id,
            email: participant_email,
            participant_name: metadata.participant_name || participant_email,
            qr_code_token: qrToken,
            transfer_token: transferToken,
            stripe_payment_intent_id: paymentIntent.id,
            approval_status: 'approved',
            race_id: race_id || null,
          })
          .select()
          .single()

        if (registrationError) {
          console.error('Error creating registration:', registrationError)
          throw registrationError
        }

        // Create upsell records
        if (upsells && upsells.length > 0) {
          const upsellRecords = upsells.map((upsell: any) => ({
            registration_id: registration.id,
            name: upsell.name,
            price_cents: upsell.price,
            currency: paymentIntent.currency,
          }))

          const { error: upsellError } = await admin
            .from('registration_upsells')
            .insert(upsellRecords)

          if (upsellError) {
            console.error('Error creating upsells:', upsellError)
          }
        }

        console.log('Registration created successfully via webhook:', {
          registration_id: registration.id,
          order_id: order.id,
          user_id,
          event_id,
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount
        })

        // Send confirmation email
        try {
          const qrCodeBase64 = await QRCode.toDataURL(qrToken).then(url => url.split(',')[1])

          await sendTicketEmail({
            to: registration.email,
            participantName: registration.participant_name,
            eventTitle: event_title || event.title,
            eventDate: event.date,
            eventLocation: event.location,
            ticketName: ticket_name || ticket.name,
            qrUrl: `data:image/png;base64,${qrCodeBase64}`,
            manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account/ticket/${registration.id}`
          })

          console.log('Confirmation email sent to:', registration.email)
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError)
        }

      } catch (error) {
        console.error('Error processing payment_intent.succeeded:', error)
        return new Response('Error processing registration', { status: 500 })
      }
      break
    }
    
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message)
      
      // Optionally, you could store failed payment attempts for analytics
      // or send notification emails to users about payment failures
      break
    }

    case 'payment_intent.canceled': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment canceled:', paymentIntent.id)
      break
    }

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`)
      break
  }

  return new Response('ok', { status: 200 })
}
