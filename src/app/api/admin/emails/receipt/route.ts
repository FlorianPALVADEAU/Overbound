import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { sendReceiptEmail } from '@/lib/email'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const payload = await request.json().catch(() => ({}))
    const paymentIntentId = typeof payload?.paymentIntentId === 'string' ? payload.paymentIntentId : ''

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'paymentIntentId manquant.' }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    })
    const metadata = paymentIntent.metadata || {}

    let session: Stripe.Checkout.Session | null = null
    let lineItems: Stripe.ApiList<Stripe.LineItem> | null = null

    try {
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: paymentIntentId,
        limit: 1,
      })
      session = sessions.data[0] ?? null
      if (session) {
        lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 })
      }
    } catch (sessionError) {
      console.warn('[resend receipt] unable to fetch checkout session', sessionError)
    }

    const admin = supabaseAdmin()
    const { data: order } = await admin
      .from('orders')
      .select('id, invoice_url, created_at')
      .eq('provider_order_id', paymentIntentId)
      .maybeSingle()

    const latestCharge =
      typeof paymentIntent.latest_charge === 'object' ? paymentIntent.latest_charge : null

    const resolvedEmail =
      metadata.participant_email ||
      session?.customer_email ||
      session?.customer_details?.email ||
      paymentIntent.receipt_email ||
      latestCharge?.billing_details?.email ||
      user.email

    if (!resolvedEmail) {
      return NextResponse.json({ error: 'Email destinataire introuvable.' }, { status: 400 })
    }

    const eventName =
      metadata.event_title ||
      session?.metadata?.event_title ||
      lineItems?.data?.[0]?.description ||
      'Achat Overbound'

    const currency =
      (paymentIntent.currency || session?.currency || 'eur').toUpperCase()

    const items = (lineItems?.data || []).map((item) => {
      const quantity = item.quantity ?? 1
      const unitAmount =
        item.price?.unit_amount ??
        (item.amount_total && quantity ? Math.round(item.amount_total / quantity) : 0)
      const total = item.amount_total ?? unitAmount * quantity
      return {
        description: item.description || item.price?.product?.toString() || 'Article',
        quantity,
        unitPrice: toMajor(unitAmount),
        total: toMajor(total),
      }
    })

    const subtotalCents =
      (session?.amount_subtotal ?? null) ??
      items.reduce((sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity, 0)
    const totalCents =
      (session?.amount_total ?? null) ??
      paymentIntent.amount ??
      subtotalCents
    const discountCents =
      (session?.total_details?.amount_discount ?? null) ??
      Math.max(subtotalCents - totalCents, 0)

    await sendReceiptEmail({
      to: resolvedEmail,
      fullName: profile.full_name ?? user.user_metadata?.full_name ?? null,
      invoiceNumber: order?.id ?? paymentIntentId,
      invoiceDate: new Date(order?.created_at ?? Date.now()).toLocaleDateString('fr-FR', { dateStyle: 'full' }),
      eventName,
      items: items.length > 0 ? items : [
        {
          description: eventName,
          quantity: 1,
          unitPrice: toMajor(totalCents),
          total: toMajor(totalCents),
        },
      ],
      subtotal: toMajor(subtotalCents),
      discount: discountCents > 0 ? toMajor(discountCents) : undefined,
      total: toMajor(totalCents),
      currency,
      paymentMethod: formatPaymentMethod(paymentIntent.payment_method_types?.[0]),
      invoiceUrl: order?.invoice_url ?? undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[resend receipt] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const toMajor = (amountCents: number) => amountCents / 100

const formatPaymentMethod = (method?: string | null) => {
  switch (method) {
    case 'card':
      return 'Carte bancaire'
    case 'paypal':
      return 'PayPal'
    case 'link':
      return 'Link'
    default:
      return method ? method.toUpperCase() : 'Paiement'
  }
}
