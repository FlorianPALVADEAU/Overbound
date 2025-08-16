import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const { ticketId, quantity = 1 } = await req.json()

  // 1) Auth (récup user)
  const supabase = createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // 2) Récup ticket (prix/quota)
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, stripe_price_id')
    .eq('id', ticketId)
    .single()
  if (!ticket?.stripe_price_id)
    return NextResponse.json({ error: 'Ticket invalide' }, { status: 400 })

  // 3) Créer la session Checkout
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: ticket.stripe_price_id, quantity }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/events`,
    customer_email: user.email || undefined,
    metadata: { user_id: user.id, ticket_id: ticket.id },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}