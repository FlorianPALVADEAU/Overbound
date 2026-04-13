import type { AppliedPromo, EventUpsell } from '@/components/registration/types'
import { DEFAULT_TSHIRT_SIZES } from '@/constants/registration'

const NON_CUMULABLE_WITH_TIER_CODES = new Set(['JUOFF30'])

type PromoDiscountOptions = {
  tierDiscountAmount?: number
  baseTicketSubtotal?: number
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
  if (!promo || ticketSubtotal <= 0) return 0

  const calculateDiscountForSubtotal = (subtotal: number) => {
    if (promo.discount_percent && promo.discount_percent > 0) {
      return Math.min(subtotal, Math.round(subtotal * (promo.discount_percent / 100)))
    }

    if (promo.discount_amount && promo.discount_amount > 0) {
      return Math.min(subtotal, promo.discount_amount)
    }

    return 0
  }

  const normalizedCode = promo.code?.trim().toUpperCase()

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
  if (!Array.isArray(promos) || promos.length === 0 || ticketSubtotal <= 0) return 0

  const total = promos.reduce(
    (acc, promo) => acc + calculatePromoDiscount(promo, ticketSubtotal, options),
    0,
  )
  return Math.min(total, ticketSubtotal)
}

export const joinName = (first: string, last: string): string =>
  `${first.trim()} ${last.trim()}`.trim()

export const humanizeMetaKey = (key: string): string =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
