import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import type { PricingSupabase } from '@/lib/orderPricing/server'
import type { UpsellType } from '@/types/Upsell'

export const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-08-27.basil',
})

export interface OrderTicketRow {
  id: string
  name: string
  final_price_cents: number | null
  currency: string | null
  operations_config: Record<string, unknown> | null
  race: { name: string | null } | null
  event: {
    id: string
    title: string
    date: string
    sales_start?: string | null
    location: string
    status: string
    capacity: number | null
    price_tiers: Array<{
      id: string
      discount_percentage: number
      available_from: string | null
      available_until: string | null
      display_order: number | null
      max_registrations: number | null
    }> | null
  } | null
}

export interface OrderUpsellRow {
  id: string
  type: UpsellType
  price_cents: number
}

export const fetchTicketsForSelections = async (supabase: PricingSupabase, ticketIds: string[]) => {
  const { data, error } = await supabase
    .from('tickets')
    .select(
      `id, name, final_price_cents, currency, operations_config,
      race:races!tickets_race_id_fkey(name),
      event:events (
        id, title, date, sales_start, location, status, capacity,
        price_tiers:event_price_tiers(id, discount_percentage, available_from, available_until, display_order, max_registrations)
      )`,
    )
    .in('id', ticketIds)
  if (error) throw error
  return (data ?? []) as unknown as OrderTicketRow[]
}

export const fetchUpsellsForEvent = async (supabase: PricingSupabase, eventId: string) => {
  const { data, error } = await supabase
    .from('upsells')
    .select('id, type, price_cents')
    .eq('is_active', true)
    .or(`event_id.eq.${eventId},event_id.is.null`)
  if (error) throw error
  return (data ?? []) as OrderUpsellRow[]
}

export const countActiveRegistrations = async (supabase: PricingSupabase, eventId: string) => {
  const { count, error } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .is('cancelled_at', null)
  if (error) throw error
  return count ?? 0
}

/**
 * True when the buyer's group already holds a departure on this event (FDR-0005): its members skip the SAS choice.
 * Read as admin, but only for a group the buyer belongs to: a group id from the request proves nothing.
 */
export const groupHasAnchorOnEvent = async (
  admin: PricingSupabase,
  groupId: string | null | undefined,
  userId: string,
  eventId: string,
) => {
  if (!groupId) return false
  const { data: membership, error: membershipError } = await admin
    .from('group_members')
    .select('group_id')
    .eq('group_id', groupId)
    .eq('profile_id', userId)
    .limit(1)
    .maybeSingle()
  if (membershipError) throw membershipError
  if (!membership) return false

  const { data, error } = await admin.from('groups').select('anchor_event_id, anchor_wave_index').eq('id', groupId).maybeSingle()
  if (error) throw error
  const group = data as { anchor_event_id: string | null; anchor_wave_index: number | null } | null
  return group?.anchor_event_id === eventId && group.anchor_wave_index != null
}

export const respondJson = (payload: unknown, status = 200) => NextResponse.json(payload, { status })
