// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!; // <-- aligne le nom

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = (session.metadata || {}) as { userId?: string; priceId?: string };

      // TODO: write DB with session info…
      // session.amount_total, session.currency, session.customer_details, etc.
      console.log({
        userId: metadata.userId,
        priceId: metadata.priceId,
        created: session.created,
        currency: session.currency,
        customerDetails: session.customer_details,
        amount: session.amount_total,
      });
      break;
    }
    default:
      // Accuse réception proprement, même si on n’exploite pas l’event
      break;
  }

  return new Response('ok', { status: 200 });
}
