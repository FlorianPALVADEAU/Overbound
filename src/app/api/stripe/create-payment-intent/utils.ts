import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { NextResponse } from 'next/server'
import { NextResponse as NextResponseConstructor } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

type SupabaseSessionClient = Awaited<ReturnType<typeof createSupabaseServer>>

type PromoRecord = {
  id: string
  code: string
  discount_percent: number | null
  discount_amount: number | null
  currency: string | null
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
  usage_limit: number | null
  used_count: number
  events: Array<{ event_id: string }>
}

type TicketRow = {
  id: string
  name: string
  base_price_cents: number | null
  currency: string | null
  event: {
    id: string
    title: string
    date: string
    location: string
    status: string
    capacity: number | null
  }
}

type UpsellRow = {
  id: string
  price_cents: number
}

export const supabaseAdminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-07-30.basil',
})

export const fetchTicketsForSelections = async (supabase: SupabaseSessionClient, ticketIds: string[]) =>
  supabase
    .from('tickets')
    .select(
      `*,
      event:events (
        id,
        title,
        date,
        location,
        status,
        capacity
      )
    `,
    )
    .in('id', ticketIds)

export const fetchUpsellsForEvent = async (supabase: SupabaseSessionClient, eventId: string) =>
  supabase
    .from('upsells')
    .select('*')
    .eq('is_active', true)
    .or(`event_id.eq.${eventId},event_id.is.null`)

export const fetchPromo = async (supabase: SupabaseSessionClient, promoCode: string) =>
  supabase
    .from('promotional_codes')
    .select(
      `
        id,
        code,
        discount_percent,
        discount_amount,
        currency,
        is_active,
        valid_from,
        valid_until,
        usage_limit,
        used_count,
        events:promotional_code_events(event_id)
      `,
    )
    .ilike('code', promoCode.trim().toUpperCase())
    .maybeSingle()

export const getTicketSubtotal = (
  ticketSelections: Array<{ ticketId: string; quantity: number }>,
  ticketPriceMap: Map<string, number>,
) =>
  ticketSelections.reduce((accumulator, item) => {
    const unitPrice = ticketPriceMap.get(item.ticketId) || 0
    return accumulator + unitPrice * (item.quantity || 0)
  }, 0)

export const getUpsellSubtotal = (
  upsells: Array<{ upsellId: string; quantity: number }>,
  upsellMap: Map<string, UpsellRow>,
) =>
  upsells.reduce((accumulator, item) => {
    const upsell = upsellMap.get(item.upsellId)
    if (!upsell) {
      return accumulator
    }
    return accumulator + upsell.price_cents * (item.quantity || 0)
  }, 0)

export const calcPromo = (
  promo: PromoRecord,
  ticketSubtotal: number,
) => {
  const now = new Date()
  const validFrom = promo.valid_from ? new Date(promo.valid_from) : null
  const validUntil = promo.valid_until ? new Date(promo.valid_until) : null

  const matchesEvent = (promo.events || []).length === 0
  const withinDates = (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)
  const usageAvailable = promo.usage_limit == null || promo.used_count < promo.usage_limit

  if (!(promo.is_active && matchesEvent && withinDates && usageAvailable)) {
    return { discountAmount: 0, appliedPromo: null }
  }

  let discountAmount = 0
  if (promo.discount_percent && promo.discount_percent > 0) {
    discountAmount = Math.round(ticketSubtotal * (promo.discount_percent / 100))
  } else if (promo.discount_amount && promo.discount_amount > 0) {
    discountAmount = promo.discount_amount
  }
  discountAmount = Math.min(discountAmount, ticketSubtotal)

  return {
    discountAmount,
    appliedPromo: {
      id: promo.id,
      code: promo.code,
      discount_percent: promo.discount_percent,
      discount_amount: promo.discount_amount,
      currency: promo.currency,
    },
  }
}

export const ensureAvailability = async (
  supabase: SupabaseSessionClient,
  eventId: string,
  totalRequestedParticipants: number,
) => {
  const { count: existingRegistrationsCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  return existingRegistrationsCount || 0
}

export const respondJson = (payload: unknown, status = 200) =>
  NextResponseConstructor.json(payload, { status })
