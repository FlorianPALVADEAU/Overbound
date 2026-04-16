import { useMemo } from 'react'
import type {
  AppliedPromo,
  EventTicket,
  EventUpsell,
  PricingSummary,
  SelectedUpsellState,
} from '@/components/registration/types'
import type { EventPriceTier } from '@/types/EventPriceTier'
import { getCurrentPriceTier, calculateCurrentPrice } from '@/types/EventPriceTier'
import { calculatePromoDiscount, calculatePromoDiscounts } from '@/lib/registration'

export function useRegistrationPricing(
  tickets: EventTicket[],
  selectedTicketSlots: string[],
  ticketMap: Record<string, EventTicket>,
  selectedUpsells: SelectedUpsellState,
  upsells: EventUpsell[],
  appliedPromos: AppliedPromo[],
  eventPriceTiers: EventPriceTier[],
  serverPricing: PricingSummary | null,
) {
  const defaultCurrency = useMemo(() => {
    const first = tickets.find((t) => t.currency)?.currency
    return (first || 'eur').toLowerCase()
  }, [tickets])

  const activeTier = getCurrentPriceTier(eventPriceTiers)
  const hasActiveDiscount = Boolean(activeTier && activeTier.discount_percentage > 0)

  const ticketSubtotal = useMemo(() => {
    return selectedTicketSlots.reduce((acc, ticketId) => {
      const ticket = ticketMap[ticketId]
      if (!ticket || !ticket.final_price_cents) return acc
      const price = activeTier
        ? calculateCurrentPrice(ticket.final_price_cents, activeTier)
        : ticket.final_price_cents
      return acc + price
    }, 0)
  }, [selectedTicketSlots, ticketMap, activeTier])

  const baseTicketSubtotal = useMemo(() => {
    return selectedTicketSlots.reduce((acc, ticketId) => {
      const ticket = ticketMap[ticketId]
      if (!ticket || !ticket.final_price_cents) return acc
      return acc + ticket.final_price_cents
    }, 0)
  }, [selectedTicketSlots, ticketMap])

  const tierDiscountAmount = useMemo(
    () => Math.max(0, baseTicketSubtotal - ticketSubtotal),
    [baseTicketSubtotal, ticketSubtotal],
  )

  const upsellSubtotal = useMemo(() => {
    return Object.entries(selectedUpsells).reduce((acc, [upsellId, config]) => {
      const upsell = upsells.find((u) => u.id === upsellId)
      if (!upsell) return acc
      return acc + config.quantity * upsell.price_cents
    }, 0)
  }, [selectedUpsells, upsells])

  const discountAmount = useMemo(
    () =>
      calculatePromoDiscounts(appliedPromos, ticketSubtotal, {
        tierDiscountAmount,
        baseTicketSubtotal,
      }),
    [appliedPromos, baseTicketSubtotal, tierDiscountAmount, ticketSubtotal],
  )

  const isTierDiscountOverriddenByPromo = useMemo(() => {
    const luoffPromo = appliedPromos.find((promo) => promo.code?.trim().toUpperCase() === 'LUOFF30')
    if (!luoffPromo) return false
    const juoffPromo = appliedPromos.find((promo) => promo.code?.trim().toUpperCase() === 'JUOFF50')
    if (!juoffPromo) return false

    const juoffExtraDiscount = calculatePromoDiscount(juoffPromo, ticketSubtotal, {
      tierDiscountAmount,
      baseTicketSubtotal,
    })

    return juoffExtraDiscount > 0
  }, [appliedPromos, baseTicketSubtotal, tierDiscountAmount, ticketSubtotal])

  const totalDue = useMemo(
    () => Math.max(ticketSubtotal + upsellSubtotal - discountAmount, 0),
    [ticketSubtotal, upsellSubtotal, discountAmount],
  )

  const computedPricing: PricingSummary = useMemo(
    () => ({
      ticketTotal: ticketSubtotal,
      upsellTotal: upsellSubtotal,
      discountAmount,
      totalDue,
      currency: defaultCurrency,
    }),
    [defaultCurrency, discountAmount, ticketSubtotal, totalDue, upsellSubtotal],
  )

  const summaryPricing = serverPricing ?? computedPricing

  return {
    defaultCurrency,
    activeTier,
    hasActiveDiscount,
    isTierDiscountOverriddenByPromo,
    ticketSubtotal,
    upsellSubtotal,
    discountAmount,
    totalDue,
    computedPricing,
    summaryPricing,
  }
}
