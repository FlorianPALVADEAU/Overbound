import { fail, ok, type Result } from '../types'
import type { HttpFailure } from './httpFailure'
import type { PromoPriceRow } from '../mappers'
import type { PricingSupabase } from './supabaseClient'

export interface PromoRow extends PromoPriceRow {
  id: string
  currency: string | null
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
  usage_limit: number | null
  used_count: number
  events: Array<{ event_id: string }> | null
}

const PROMO_COLUMNS = `
  id, code, discount_percent, discount_amount, currency, is_active, valid_from, valid_until,
  usage_limit, used_count, target_upsell_id,
  events:promotional_code_events(event_id),
  ambassadors:ambassadors(id)
`

/** Active, within its dates, under its usage limit, and allowed on this event. */
export const isPromoUsableOnEvent = (promo: PromoRow, eventId: string, now: Date) => {
  const allowedEvents = (promo.events ?? []).map((item) => item.event_id)
  const startsOk = !promo.valid_from || now >= new Date(promo.valid_from)
  const endsOk = !promo.valid_until || now <= new Date(promo.valid_until)
  const usageOk = promo.usage_limit == null || promo.used_count < promo.usage_limit
  const eventOk = allowedEvents.length === 0 || allowedEvents.includes(eventId)
  return promo.is_active && startsOk && endsOk && usageOk && eventOk
}

const isUpsellSoldOnEvent = async (supabase: PricingSupabase, upsellId: string, eventId: string) => {
  const { data, error } = await supabase
    .from('upsells')
    .select('id')
    .eq('id', upsellId)
    .eq('is_active', true)
    .or(`event_id.eq.${eventId},event_id.is.null`)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

/**
 * Loads the codes of an order and checks each one can be used on this event.
 * Combination rules are not checked here: the pricing engine owns them.
 */
export const loadOrderPromos = async (
  supabase: PricingSupabase,
  codes: readonly string[],
  eventId: string,
  now: Date,
): Promise<Result<PromoRow[], HttpFailure>> => {
  const rows: PromoRow[] = []
  for (const code of codes) {
    const { data, error } = await supabase.from('promotional_codes').select(PROMO_COLUMNS).ilike('code', code).maybeSingle()
    const row = data as PromoRow | null
    if (error || !row || !isPromoUsableOnEvent(row, eventId, now)) {
      return fail({ status: 409, message: `Le code promo ${code} est invalide ou expiré.` })
    }
    if (row.target_upsell_id && !(await isUpsellSoldOnEvent(supabase, row.target_upsell_id, eventId))) {
      return fail({ status: 422, message: `Le code ${code} n'est pas applicable pour cet événement, aucun produit éligible.` })
    }
    rows.push(row)
  }
  return ok(rows)
}
