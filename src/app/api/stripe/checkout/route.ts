// /app/api/stripe/checkout/route.ts (ou /api/stripe/checkout)
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId } = await request.json();

    // ... récupère baseUrl comme tu veux, mais qu'il inclue https:// ou http://
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/billing?canceled=1`,
      metadata: { userId, priceId },
    });

    // ⬇️ renvoie directement la propriété attendue par le client
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
