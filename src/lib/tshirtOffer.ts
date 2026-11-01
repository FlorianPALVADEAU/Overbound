import { DEFAULT_TSHIRT_SIZES } from '@/constants/registration'

/**
 * Offer "T-shirt offert aux N premiers participants, tout billet confondu".
 * The count is derived, never stored: the first N non-cancelled registrations
 * of the event (companion bibs excluded, they belong to a participant already
 * counted) by creation order. A cancellation can only move people up, so
 * nobody who is in loses their place.
 */
export interface TshirtOffer {
  quota: number
  claimed: number
  remaining: number
}

export type TshirtSize = (typeof DEFAULT_TSHIRT_SIZES)[number]

export const TSHIRT_SIZES: readonly string[] = DEFAULT_TSHIRT_SIZES

export const isTshirtSize = (value: unknown): value is TshirtSize =>
  typeof value === 'string' && TSHIRT_SIZES.includes(value)

/** Admin input to a quota: positive integer, otherwise the offer is off (null). */
export const parseTshirtQuota = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/** Null when the event has no offer. `claimed` is the number of counted registrations. */
export const buildTshirtOffer = (quota: unknown, claimed: number): TshirtOffer | null => {
  const parsedQuota = parseTshirtQuota(quota)
  if (parsedQuota === null) return null
  return { quota: parsedQuota, claimed, remaining: Math.max(parsedQuota - claimed, 0) }
}

/** Participant `index` (0-based) of an order is offered a T-shirt while the remaining stock covers them. */
export const isParticipantOffered = (offer: TshirtOffer | null | undefined, index: number): boolean =>
  offer !== null && offer !== undefined && index < offer.remaining

/** Urgency copy tier, so the wording sharpens as stock runs out. */
export type TshirtUrgency = 'open' | 'low' | 'last'

export const tshirtUrgency = (offer: TshirtOffer): TshirtUrgency =>
  offer.remaining <= 10 ? 'last' : offer.remaining <= Math.ceil(offer.quota / 3) ? 'low' : 'open'

/** One short line of site copy for the current stock. Sold out: null, the offer disappears rather than taunt. */
export const tshirtHeadline = (offer: TshirtOffer): string | null => {
  if (offer.remaining === 0) return null
  return tshirtUrgency(offer) === 'open'
    ? `T-shirt offert aux ${offer.quota} premiers`
    : `T-shirt offert : plus que ${offer.remaining}`
}
