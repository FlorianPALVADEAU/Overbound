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
import { calculatePromoDiscount } from '@/lib/registration'

export function useRegistrationPricing(
  tickets: EventTicket[],
  selectedTicketSlots: string[],
  ticketMap: Record<string, EventTicket>,
  selectedUpsells: SelectedUpsellState,
  upsells: EventUpsell[],
  appliedPromo: AppliedPromo | null,
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

  const upsellSubtotal = useMemo(() => {
    return Object.entries(selectedUpsells).reduce((acc, [upsellId, config]) => {
      const upsell = upsells.find((u) => u.id === upsellId)
      if (!upsell) return acc
      return acc + config.quantity * upsell.price_cents
    }, 0)
  }, [selectedUpsells, upsells])

  const discountAmount = useMemo(
    () => calculatePromoDiscount(appliedPromo, ticketSubtotal),
    [appliedPromo, ticketSubtotal],
  )

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
    ticketSubtotal,
    upsellSubtotal,
    discountAmount,
    totalDue,
    computedPricing,
    summaryPricing,
  }
}
