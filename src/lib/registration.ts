import type { AppliedPromo, EventUpsell } from '@/components/registration/types'
import { DEFAULT_TSHIRT_SIZES } from '@/constants/registration'

const NON_CUMULABLE_WITH_TIER_CODES = new Set(['LUOFF30', 'JUOFF50'])
const OPEN_TICKET_CODE_SUFFIX = 'OPENTICKET'

export const isOpenTicketPromoCode = (code?: string | null) =>
  Boolean(code?.trim().toUpperCase().endsWith(OPEN_TICKET_CODE_SUFFIX))

type PromoDiscountOptions = {
  tierDiscountAmount?: number
  baseTicketSubtotal?: number
  firstOpenTicketPrice?: number
  // FDR-0014 addendum (product-line discounts): subtotal per selected
  // upsell (quantity * unit price), keyed by upsell id. Required to net a
  // promo.target_upsell_id code against the right line -- never against
  // ticketSubtotal. An upsell missing from this map (not selected by the
  // participant) makes the code's discount resolve to 0, not a fallback to
  // the ticket subtotal.
  upsellSubtotalsById?: Record<string, number>
}

export const resolveUpsellSizes = (upsell: EventUpsell): string[] => {
  const sizes = upsell.options?.sizes
  return sizes && sizes.length > 0 ? sizes : DEFAULT_TSHIRT_SIZES
}

export const extractTshirtSizes = (meta?: Record<string, any>): string[] => {
  if (!meta) return []
  if (Array.isArray(meta.sizes)) {
    return meta.sizes.filter((size): size is string => typeof size === 'string' && size.length > 0)
  }
  if (typeof meta.size === 'string' && meta.size.trim().length > 0) {
    return [meta.size]
  }
  return []
}

export const normalizeTshirtSizes = (
  meta: Record<string, any> | undefined,
  quantity: number,
  availableSizes: string[],
): string[] => {
  if (quantity <= 0) return []
  const fallback = availableSizes[0] ?? DEFAULT_TSHIRT_SIZES[0]
  const initial = extractTshirtSizes(meta)
  const normalized = initial
    .slice(0, quantity)
    .map((size) => (availableSizes.includes(size) ? size : fallback))

  const result = [...normalized]
  while (result.length < quantity) {
    result.push(fallback)
  }

  if (result.length > quantity) {
    return result.slice(0, quantity)
  }

  return result
}

export const buildTshirtMeta = (
  meta: Record<string, any> | undefined,
  quantity: number,
  availableSizes: string[],
): Record<string, any> => {
  if (quantity <= 0) {
    return {}
  }
  const sizes = normalizeTshirtSizes(meta, quantity, availableSizes)
  const baseMeta = { ...(meta || {}) }
  delete baseMeta.size
  return {
    ...baseMeta,
    sizes,
  }
}

export const formatPrice = (valueInCents: number, currency: string): string => {
  return (valueInCents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  })
}

export const calculatePromoDiscount = (
  promo: AppliedPromo | null,
  ticketSubtotal: number,
  options?: PromoDiscountOptions,
): number => {
  if (!promo) return 0

  const calculateDiscountForSubtotal = (subtotal: number) => {
    if (promo.discount_percent && promo.discount_percent > 0) {
      return Math.min(subtotal, Math.round(subtotal * (promo.discount_percent / 100)))
    }

    if (promo.discount_amount && promo.discount_amount > 0) {
      return Math.min(subtotal, promo.discount_amount)
    }

    return 0
  }

  // FDR-0014 addendum: a product-scoped code nets only against its own
  // upsell's subtotal, never against ticketSubtotal -- and resolves to 0,
  // not a fallback to the ticket, when that upsell isn't in the cart. This
  // branch is checked first and is a hard exit: a target_upsell_id code
  // never falls through to the ticket-scoped branches below.
  if (promo.target_upsell_id) {
    const upsellSubtotal = options?.upsellSubtotalsById?.[promo.target_upsell_id] ?? 0
    if (upsellSubtotal <= 0) return 0
    return calculateDiscountForSubtotal(upsellSubtotal)
  }

  if (ticketSubtotal <= 0) return 0

  const normalizedCode = promo.code?.trim().toUpperCase()

  if (normalizedCode && isOpenTicketPromoCode(normalizedCode)) {
    const firstOpenTicketPrice = options?.firstOpenTicketPrice ?? 0
    if (firstOpenTicketPrice <= 0) return 0
    return calculateDiscountForSubtotal(firstOpenTicketPrice)
  }

  if (normalizedCode && NON_CUMULABLE_WITH_TIER_CODES.has(normalizedCode)) {
    const tierDiscountAmount = Math.max(0, options?.tierDiscountAmount ?? 0)
    const baseTicketSubtotal = Math.max(ticketSubtotal, options?.baseTicketSubtotal ?? ticketSubtotal)
    const standalonePromoDiscount = calculateDiscountForSubtotal(baseTicketSubtotal)
    return Math.min(ticketSubtotal, Math.max(0, standalonePromoDiscount - tierDiscountAmount))
  }

  return calculateDiscountForSubtotal(ticketSubtotal)
}

export const calculatePromoDiscounts = (
  promos: AppliedPromo[],
  ticketSubtotal: number,
  options?: PromoDiscountOptions,
): number => {
  if (!Array.isArray(promos) || promos.length === 0) return 0

  // FDR-0014 addendum: the overall ceiling can no longer be a flat
  // Math.min(total, ticketSubtotal) -- a product-scoped promo's discount
  // must never be clamped against the ticket subtotal, only against its
  // own upsell's subtotal (already enforced per-promo above via
  // calculateDiscountForSubtotal's Math.min(subtotal, ...)). Ticket-scoped
  // discounts are summed and clamped to ticketSubtotal as before;
  // upsell-scoped discounts are summed separately with no shared ceiling
  // across different upsells (each already capped at its own line's value).
  let ticketScopedTotal = 0
  let upsellScopedTotal = 0
  for (const promo of promos) {
    const amount = calculatePromoDiscount(promo, ticketSubtotal, options)
    if (promo.target_upsell_id) {
      upsellScopedTotal += amount
    } else {
      ticketScopedTotal += amount
    }
  }

  return Math.min(ticketScopedTotal, Math.max(ticketSubtotal, 0)) + upsellScopedTotal
}

export const joinName = (first: string, last: string): string =>
  `${first.trim()} ${last.trim()}`.trim()

export const humanizeMetaKey = (key: string): string =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
