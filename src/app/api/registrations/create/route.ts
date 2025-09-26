import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { sendTicketEmail } from '@/lib/email'
import * as QRCode from 'qrcode'
import { REGULATION_VERSION } from '@/constants/registration'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const {
      paymentIntentId,
      eventId,
      userId,
      ticketSelections = [],
      participants = [],
      upsells = [],
      promoCode = null,
      signatureImage = null,
      signatureMetadata = {},
      disclaimer = { read: false, accepted: false },
    } = await request.json()

    if (!paymentIntentId || !eventId || !userId || ticketSelections.length === 0 || participants.length === 0) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
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

    // Get event info
    const { data: eventRow, error: eventError } = await admin
      .from('events')
      .select('id, title, date, location')
      .eq('id', eventId)
      .single()

    if (eventError || !eventRow) {
      return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 })
    }

    const ticketIds = ticketSelections.map((item: any) => item.ticketId)

    const { data: tickets, error: ticketsError } = await admin
      .from('tickets')
      .select(
        `
        *,
        race:races!tickets_race_id_fkey (
          id,
          name,
          distance_km
        )
      `,
      )
      .in('id', ticketIds)

    if (ticketsError || !tickets || tickets.length === 0) {
      return NextResponse.json({ error: 'Billets introuvables.' }, { status: 404 })
    }

    const ticketMap = new Map<string, any>()
    tickets.forEach((ticket) => {
      ticketMap.set(ticket.id, ticket)
    })

    // Generate unique tokens
    const generateTokens = () => ({ qr: uuidv4(), transfer: uuidv4() })

    const ticketSubtotal = ticketSelections.reduce((accumulator: number, item: { ticketId: string; quantity: number }) => {
      const ticket = ticketMap.get(item.ticketId)
      if (!ticket || ticket.base_price_cents == null) return accumulator
      return accumulator + ticket.base_price_cents * (item.quantity || 0)
    }, 0)

    const { data: upsellRows } = await admin
      .from('upsells')
      .select('*')
      .eq('event_id', eventId)

    const upsellMap = new Map<string, any>()
    for (const row of upsellRows || []) {
      upsellMap.set(row.id, row)
    }

    const upsellSubtotal = upsells.reduce((accumulator: number, item: { upsellId: string; quantity: number }) => {
      const upsell = upsellMap.get(item.upsellId)
      if (!upsell) return accumulator
      return accumulator + upsell.price_cents * (item.quantity || 0)
    }, 0)

    const discountApplied = Number(paymentIntent.metadata?.discount_applied || 0) || 0

    let promotionalCodeId: string | null = null
    if (promoCode) {
      const { data: promoRecord } = await admin
        .from('promotional_codes')
        .select('id')
        .ilike('code', promoCode)
        .maybeSingle()

      promotionalCodeId = promoRecord?.id ?? null
    }

    // Create order record
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: userId,
        email: user.email,
        status: 'paid',
        amount_total: paymentIntent.amount,
        currency: paymentIntent.currency,
        provider: 'stripe',
        provider_order_id: paymentIntent.id,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Erreur création commande:', orderError)
      throw orderError
    }

    const createdRegistrations: any[] = []

    for (const participant of participants) {
      const ticket = ticketMap.get(participant.ticketId)
      if (!ticket) {
        continue
      }

      const { qr, transfer } = generateTokens()

      const { data: registration, error: registrationError } = await admin
        .from('registrations')
        .insert({
          user_id: userId,
          event_id: eventId,
          ticket_id: participant.ticketId,
          order_id: order.id,
          email: participant.email || user.email,
          provider: 'internal',
          provider_registration_id: paymentIntent.id,
          qr_code_token: qr,
          checked_in: false,
          claim_status: 'pending',
          approval_status: 'approved',
          race_id: ticket.race?.id || null,
          promotional_code_id: promotionalCodeId,
        })
        .select()
        .single()

      if (registrationError || !registration) {
        console.error('Erreur création inscription:', registrationError)
        throw registrationError
      }

      createdRegistrations.push({ registration, ticket, participant })

      if (signatureImage) {
        const signatureRecord = {
          registration_id: registration.id,
          regulation_version: typeof signatureMetadata?.regulationVersion === 'string'
            ? signatureMetadata.regulationVersion
            : REGULATION_VERSION,
          signed_at:
            typeof signatureMetadata?.signedAt === 'string'
              ? signatureMetadata.signedAt
              : new Date().toISOString(),
          signature_data: JSON.stringify({
            imageDataUrl: signatureImage,
            participant: {
              firstName: participant.firstName,
              lastName: participant.lastName,
              email: participant.email,
              birthDate: participant.birthDate,
              emergencyContactName: participant.emergencyContactName,
              emergencyContactPhone: participant.emergencyContactPhone,
              medicalInfo: participant.medicalInfo,
              licenseNumber: participant.licenseNumber,
            },
            disclaimer,
          }),
        }

        const { error: signatureError } = await admin
          .from('registration_signatures')
          .insert(signatureRecord)

        if (signatureError) {
          console.error('Erreur création signature:', signatureError)
        }
      }
    }

    if (upsells && upsells.length > 0 && createdRegistrations.length > 0) {
      const referenceRegistration = createdRegistrations[0].registration
      const upsellRecords = upsells
        .map((item: { upsellId: string; quantity: number; meta?: Record<string, any> }) => {
          const upsell = upsellMap.get(item.upsellId)
          if (!upsell) return null
          return {
            registration_id: referenceRegistration.id,
            name: upsell.name,
            price_cents: upsell.price_cents,
            currency: upsell.currency || paymentIntent.currency,
          }
        })
        .filter(Boolean)

      if (upsellRecords.length > 0) {
        const { error: upsellError } = await admin
          .from('registration_upsells')
          .insert(upsellRecords)

        if (upsellError) {
          console.error('Erreur création upsells:', upsellError)
        }
      }
    }

    for (const { registration, ticket } of createdRegistrations) {
      try {
        const qrCodeBase64 = await QRCode.toDataURL(registration.qr_code_token).then((url) => url.split(',')[1])

        await sendTicketEmail({
          to: registration.email,
          participantName: registration.participant_name,
          eventTitle: eventRow.title,
          eventDate: eventRow.date,
          eventLocation: eventRow.location,
          ticketName: ticket.name,
          qrUrl: `data:image/png;base64,${qrCodeBase64}`,
          manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account/ticket/${registration.id}`,
        })
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError)
      }
    }

    console.log('Inscriptions créées avec succès:', {
      order_id: order.id,
      registrations: createdRegistrations.map(({ registration }) => registration.id),
      user_id: userId,
      event_id: eventId,
      amount: paymentIntent.amount,
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount_total: order.amount_total,
        currency: order.currency,
        payment_status: order.payment_status,
      },
    })

  } catch (error: any) {
    console.error('Erreur création inscription:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la création de l\'inscription',
      details: error.message 
    }, { status: 500 })
  }
}
