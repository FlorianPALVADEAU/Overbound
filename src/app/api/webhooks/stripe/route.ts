import Stripe from 'stripe'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { sendAdminPushNotification } from '@/lib/push'
import {
  TICKET_TRANSFER_METADATA_TYPE,
  unlockTransferFromCheckout,
  type CompletedCheckoutSession,
} from '@/lib/tickets/ticketTransfers'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'

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
    case 'checkout.session.completed': {
      // Paid ticket transfer (unlocks the hand-over link); other Checkout flows are not handled here.
      const session = event.data.object as Stripe.Checkout.Session
      if (session.metadata?.type !== TICKET_TRANSFER_METADATA_TYPE) break
      try {
        const outcome = await unlockTransferFromCheckout(admin, session as unknown as CompletedCheckoutSession)
        console.log('Ticket transfer checkout processed:', session.id, outcome)
      } catch (transferError) {
        console.error('Error processing ticket transfer checkout:', transferError)
        return new Response('Error processing ticket transfer', { status: 500 })
      }
      break
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      // A transfer fee payment carries no registration data; its Checkout Session event does the work.
      if (paymentIntent.metadata?.type === TICKET_TRANSFER_METADATA_TYPE) break

      // Registrations are created by POST /api/registrations/create, which checks age, minor contacts and the
      // signed waiver. The old single-ticket flow that registered from this webhook did none of that and
      // nothing creates its payments any more: any paid PaymentIntent reaching this point needs a manual check.
      const { registration_flow, user_id, event_id } = paymentIntent.metadata ?? {}
      const flow = registration_flow === 'multi' ? 'multi' : 'unsupported'
      console.error(`Webhook skip (${flow} flow): paid PaymentIntent requires manual registration check`, {
        payment_intent_id: paymentIntent.id,
        user_id,
        event_id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      })
      try {
        await sendAdminPushNotification({
          title: flow === 'multi' ? 'Paiement OK sans inscription (multi)' : 'Paiement OK sans inscription (flux inconnu)',
          body: `${paymentIntent.id} • ${paymentIntent.amount / 100} ${(paymentIntent.currency || 'eur').toUpperCase()}`,
          url: `${siteUrl}/dashboard?tab=members${event_id ? `&event=${event_id}` : ''}`,
        })
      } catch (pushError) {
        console.error(`[push] ${flow}-flow warning notification error`, pushError)
      }
      return new Response('ok', { status: 200 })
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
