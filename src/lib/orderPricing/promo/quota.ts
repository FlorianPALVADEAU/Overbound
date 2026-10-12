import type { PricingPromo, PromoRejection, PromoRejectionReason } from '../types'
import { isWelcomeStackableCode, MAX_PROMO_CODES_PER_ORDER, normalizePromoCode } from './rules'

export type QuotaPromo = Pick<PricingPromo, 'code' | 'isAmbassador' | 'targetUpsellId'>

interface Accepted {
  codes: string[]
  ambassador: number
  ticket: QuotaPromo[]
  product: number
}

const rejectionFor = (promo: QuotaPromo, accepted: Accepted): PromoRejectionReason | null => {
  const code = normalizePromoCode(promo.code)
  if (accepted.codes.includes(code)) return 'DUPLICATE_CODE'
  if (accepted.codes.length >= MAX_PROMO_CODES_PER_ORDER) return 'TOO_MANY_CODES'
  if (promo.isAmbassador) return accepted.ambassador >= 1 ? 'ONE_AMBASSADOR_CODE' : null
  if (promo.targetUpsellId) return accepted.product >= 1 ? 'ONE_PRODUCT_CODE' : null
  const stacksWithWelcome = [...accepted.ticket, promo].some((item) => isWelcomeStackableCode(item.code))
  return accepted.ticket.length >= 1 && !stacksWithWelcome ? 'ONE_TICKET_CODE' : null
}

/**
 * Which codes may share one order: one ambassador code, one ticket code (two if
 * one of them is WELCOME05), one product code, two codes at most. Codes are
 * read in the order they were entered; the one that breaks a rule is rejected.
 */
export const checkPromoQuota = <T extends QuotaPromo>(promos: readonly T[]) => {
  const accepted: Accepted = { codes: [], ambassador: 0, ticket: [], product: 0 }
  const kept: T[] = []
  const rejections: PromoRejection[] = []

  for (const promo of promos) {
    const reason = rejectionFor(promo, accepted)
    if (reason) {
      rejections.push({ code: promo.code, reason })
      continue
    }
    kept.push(promo)
    accepted.codes.push(normalizePromoCode(promo.code))
    if (promo.isAmbassador) accepted.ambassador += 1
    else if (promo.targetUpsellId) accepted.product += 1
    else accepted.ticket.push(promo)
  }

  return { kept, rejections }
}
