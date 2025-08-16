import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { sendTicketEmail } from '@/lib/email'
import QRCode from 'qrcode'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  let admin;
  let session: Stripe.Checkout.Session | undefined;
  let ticketId: string | undefined;
  let registration: any;

  if (event.type === 'checkout.session.completed') {
    session = event.data.object as Stripe.Checkout.Session;

    admin = supabaseAdmin();

    // 1) Insérer la commande
    const { error: orderErr, data: order } = await admin
      .from('orders')
      .insert({
        user_id: session.metadata?.user_id,
        stripe_session_id: session.id,
        payment_status: 'paid',
        amount_total: session.amount_total ?? null,
        currency: session.currency ?? 'eur',
        invoice_url: session.invoice || null,
      })
      .select()
      .single();
    if (orderErr) console.error(orderErr);

    // 2) Créer l’inscription (1:1 avec line_item simple)
    // Si plusieurs tickets, récupère line_items via Stripe API et boucle.
    ticketId = session.metadata?.ticket_id;
    if (order && ticketId) {
      const { error: regErr, data: regData } = await admin.from('registrations').insert({
        order_id: order.id,
        ticket_id: ticketId,
        user_id: session.metadata?.user_id,
        qr_code_token: crypto.randomUUID(),
        transfer_token: crypto.randomUUID(),
      }).select().single();
      if (regErr) console.error(regErr);
      registration = regData;
    }
  }

  // Ensure admin and session are initialized before using them
  if (admin && session && ticketId && registration) {
    const { data: userProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', session.metadata?.user_id)
      .single();

    const { data: ticketJoin } = await admin
    .from('tickets')
    .select('name, events(title, date, location)')
    .eq('id', ticketId)
    .single()

    // Générer un QR data URL pour l’email (simple)
    const qrUrl = await QRCode.toDataURL(registration.qr_code_token)

    await sendTicketEmail({
    to: session.customer_details?.email || (session.customer_email as string),
    participantName: userProfile?.full_name || 'Athlète',
    eventTitle: ticketJoin?.events?.[0]?.title,
    eventDate: ticketJoin?.events?.[0]?.date ? new Date(ticketJoin.events[0].date).toLocaleString('fr-FR') : '',
    eventLocation: ticketJoin?.events?.[0]?.location,
    ticketName: ticketJoin?.name,
    qrUrl,
    manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account/ticket/${registration.id}`,
    })
  return NextResponse.json({ received: true })
}
}

export const dynamic = 'force-dynamic'