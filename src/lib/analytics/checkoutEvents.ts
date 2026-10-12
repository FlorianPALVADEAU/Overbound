/**
 * Browser analytics of the checkout (GTM dataLayer, GA4, Meta Pixel). Every
 * call is a no-op when a tag is not loaded, for instance without consent.
 */

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>
  gtag?: (...args: unknown[]) => void
  fbq?: (...args: unknown[]) => void
}

const analyticsWindow = (): AnalyticsWindow | null => (typeof window === 'undefined' ? null : (window as AnalyticsWindow))

const euros = (cents: number) => Number((cents / 100).toFixed(2))

interface CheckoutEventContext {
  eventId: string
  eventSlug: string
  eventTitle: string
}

export const trackAddToCart = (
  context: CheckoutEventContext,
  cart: { ticketIds: string[]; participantCount: number; totalCents: number; currency: string },
) => {
  const target = analyticsWindow()
  if (!target) return
  const payload = {
    event_slug: context.eventSlug,
    event_id: context.eventId,
    step: 'participants',
    ticket_count: cart.ticketIds.length,
    participant_count: cart.participantCount,
    ticket_ids: cart.ticketIds.join(','),
  }
  target.dataLayer?.push({ event: 'add_to_cart', ...payload })
  target.gtag?.('event', 'add_to_cart', { event_category: 'event_register', event_label: context.eventSlug, ...payload })
  target.fbq?.('track', 'AddToCart', {
    content_name: context.eventTitle || context.eventSlug,
    content_category: 'event_register',
    content_type: 'product',
    content_ids: cart.ticketIds,
    value: euros(cart.totalCents),
    currency: cart.currency.toUpperCase(),
  })
}

export const trackBeginCheckout = (
  context: CheckoutEventContext,
  checkout: { paymentIntentId: string; ticketIds: string[]; totalCents: number; currency: string },
) => {
  const target = analyticsWindow()
  if (!target) return
  const eventId = `initiate_checkout_${checkout.paymentIntentId}`
  target.dataLayer?.push({
    event: 'begin_checkout',
    event_id: eventId,
    event_slug: context.eventSlug,
    event_key: context.eventId,
    value: euros(checkout.totalCents),
    currency: checkout.currency.toUpperCase(),
  })
  target.fbq?.(
    'track',
    'InitiateCheckout',
    {
      content_name: context.eventTitle || context.eventSlug,
      content_category: 'event',
      content_ids: checkout.ticketIds,
      content_type: 'product',
      value: euros(checkout.totalCents),
      currency: checkout.currency.toUpperCase(),
    },
    { eventID: eventId },
  )
}
