// src/app/api/registrations/create/route.ts
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { sendTicketEmail } from '@/lib/email'
import * as QRCode from 'qrcode'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { 
      paymentIntentId,
      ticketId, 
      eventId, 
      userId, 
      upsells = [],
      documentFile = null
    } = await request.json()

    if (!paymentIntentId || !ticketId || !eventId || !userId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Verify PaymentIntent is successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 })
    }

    // Check if registration already exists for this PaymentIntent
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single()

    if (existingReg) {
      return NextResponse.json({ error: 'Inscription déjà créée pour ce paiement' }, { status: 409 })
    }

    const admin = supabaseAdmin()

    // Get full event and ticket details
    const { data: ticket, error: ticketError } = await admin
      .from('tickets')
      .select(`
        *,
        event:events (
          id,
          title,
          subtitle,
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
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 })
    }

    // Generate unique tokens
    const qrToken = uuidv4()
    const transferToken = uuidv4()

    // Create order record
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: userId,
        event_id: eventId,
        ticket_id: ticketId,
        stripe_payment_intent_id: paymentIntentId,
        amount_total: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_status: 'paid',
        customer_email: user.email,
        customer_name: user.user_metadata?.full_name || user.email,
        metadata: {
          upsells: upsells,
          paymentIntent: {
            id: paymentIntent.id,
            created: paymentIntent.created,
            payment_method: paymentIntent.payment_method
          }
        }
      })
      .select()
      .single()

    if (orderError) {
      console.error('Erreur création commande:', orderError)
      throw orderError
    }

    // Create registration
    const { data: registration, error: registrationError } = await admin
      .from('registrations')
      .insert({
        user_id: userId,
        event_id: eventId,
        ticket_id: ticketId,
        order_id: order.id,
        email: user.email,
        participant_name: user.user_metadata?.full_name || user.email,
        qr_code_token: qrToken,
        transfer_token: transferToken,
        stripe_payment_intent_id: paymentIntentId,
        approval_status: 'approved', // Auto-approved for paid registrations
        race_id: ticket.race?.id || null,
        metadata: {
          upsells: upsells,
          document_uploaded: !!documentFile
        }
      })
      .select()
      .single()

    if (registrationError) {
      console.error('Erreur création inscription:', registrationError)
      throw registrationError
    }

    // Create upsell records if any
    if (upsells && upsells.length > 0) {
      const upsellRecords = upsells.map((upsell: any) => ({
        registration_id: registration.id,
        name: upsell.name,
        price_cents: upsell.price_cents,
        currency: upsell.currency || 'eur',
        options: upsell.options || {},
        metadata: {
          original_upsell_id: upsell.id,
          type: upsell.digital ? 'digital' : 'physical'
        }
      }))

      const { error: upsellError } = await admin
        .from('registration_upsells')
        .insert(upsellRecords)

      if (upsellError) {
        console.error('Erreur création upsells:', upsellError)
        // Don't fail the registration for upsell errors, just log
      }
    }

    console.log('Registration créée avec succès:', {
      registration_id: registration.id,
      order_id: order.id,
      user_id: userId,
      event_id: eventId,
      amount: paymentIntent.amount
    })

    // Send confirmation email
    try {
      // Generate QR code
      const qrCodeBase64 = await QRCode.toDataURL(qrToken).then(url => url.split(',')[1])
      
      await sendTicketEmail({
        to: registration.email,
        participantName: registration.participant_name,
        eventTitle: ticket.event.title,
        eventDate: ticket.event.date,
        eventLocation: ticket.event.location,
        ticketName: ticket.name,
        qrUrl: `data:image/png;base64,${qrCodeBase64}`,
        manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account/ticket/${registration.id}`
      })
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError)
      // Don't fail registration for email errors
    }

    return NextResponse.json({
      success: true,
      registration: {
        id: registration.id,
        qr_code_token: registration.qr_code_token,
        event_title: ticket.event.title,
        ticket_name: ticket.name,
        participant_email: registration.email
      },
      order: {
        id: order.id,
        amount_total: order.amount_total,
        currency: order.currency,
        payment_status: order.payment_status
      }
    })

  } catch (error: any) {
    console.error('Erreur création inscription:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la création de l\'inscription',
      details: error.message 
    }, { status: 500 })
  }
}