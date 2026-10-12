import { useEffect, useRef } from 'react'
import { trackAddToCart } from '@/lib/analytics/checkoutEvents'

interface AddToCartArgs {
  event: { id: string; slug: string; title: string }
  ticketSelections: Record<string, number>
  participantCount: number
  totalCents: number
  currency: string
}

/** Sends add_to_cart once per visit, as soon as the first ticket is chosen. */
export function useAddToCartTracking({ event, ticketSelections, participantCount, totalCents, currency }: AddToCartArgs) {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current || participantCount === 0) return
    trackedRef.current = true
    trackAddToCart(
      { eventId: event.id, eventSlug: event.slug, eventTitle: event.title },
      {
        ticketIds: Object.keys(ticketSelections).filter((ticketId) => (ticketSelections[ticketId] ?? 0) > 0),
        participantCount,
        totalCents,
        currency,
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once, on the first ticket
  }, [participantCount])
}
