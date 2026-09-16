import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Event } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'
import { getCurrentTicketPrice } from '@/lib/pricing'

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>
type EventForAnalytics = Event & { tickets?: Ticket[] | null }

/**
 * Ultra Arena landing page analytics: dataLayer/gtag/fbq mirroring, page view,
 * scroll depth, pricing section visibility, and the sticky desktop CTA
 * visibility flag (driven by the same scroll listener pattern).
 */
export const useEventAnalytics = (
  event: EventForAnalytics | undefined,
  isUltraArena: boolean,
  eventPath: string,
) => {
  const [showDesktopCta, setShowDesktopCta] = useState(false)

  const trackedLowestPrice = useMemo(() => {
    if (!event) return null
    const trackedTickets =
      (event.tickets as any[] | undefined)?.map((t) => ({
        ...t,
        race: t.race ?? undefined,
      })) ?? []
    const trackedTiers = (event as any).price_tiers || []
    const prices = trackedTickets
      .map((t) => getCurrentTicketPrice(t, trackedTiers))
      .filter((p): p is number => typeof p === 'number')
    return prices.length > 0 ? Math.min(...prices) : null
  }, [event])

  const trackEvent = useCallback(
    (eventName: string, payload: AnalyticsPayload = {}) => {
      if (typeof window === 'undefined' || !event) return

      const analyticsWindow = window as Window & {
        dataLayer?: Array<Record<string, unknown>>
        gtag?: (...args: unknown[]) => void
        fbq?: (...args: unknown[]) => void
      }

      const basePayload: Record<string, unknown> = {
        event: eventName,
        event_slug: event.slug,
        event_id: event.id,
        event_status: event.status,
        ...payload,
      }

      analyticsWindow.dataLayer?.push(basePayload)
      analyticsWindow.gtag?.('event', eventName, {
        event_category: 'event_landing',
        event_label: event.slug,
        ...payload,
      })

      // Meta Pixel mirror for retargeting/optimization
      if (analyticsWindow.fbq) {
        if (eventName === 'view_content' || eventName === 'page_view_event_landing') {
          analyticsWindow.fbq('track', 'ViewContent', {
            content_name: event.title ?? event.slug,
            content_category: 'event',
            content_ids: [event.id],
          })
        }
        if (eventName === 'add_to_cart') {
          analyticsWindow.fbq('track', 'AddToCart', {
            content_name: event.title ?? event.slug,
            content_category: 'event',
            content_ids: [event.id],
          })
        }
        if (eventName === 'begin_checkout' || eventName === 'begin_checkout_event') {
          analyticsWindow.fbq('track', 'InitiateCheckout', {
            content_name: event.title ?? event.slug,
            content_category: 'event',
            content_ids: [event.id],
          })
        }
      }
    },
    [event],
  )

  // Page view
  useEffect(() => {
    if (!isUltraArena || !event) return
    trackEvent('page_view_event_landing', {
      page_path: eventPath,
      has_price: trackedLowestPrice !== null,
    })
    trackEvent('view_content', {
      page_path: eventPath,
      content_type: 'event',
    })
  }, [isUltraArena, event, trackedLowestPrice, eventPath, trackEvent])

  // Scroll depth
  useEffect(() => {
    if (!isUltraArena) return

    let tracked25 = false
    let tracked50 = false
    let tracked90 = false

    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      if (max <= 0) return
      const pct = (window.scrollY / max) * 100

      if (!tracked25 && pct >= 25) {
        tracked25 = true
        trackEvent('scroll_25_event_page', { depth_percent: 25 })
      }
      if (!tracked50 && pct >= 50) {
        tracked50 = true
        trackEvent('scroll_50_event_page', { depth_percent: 50 })
        trackEvent('scroll_50', { depth_percent: 50 })
      }
      if (!tracked90 && pct >= 90) {
        tracked90 = true
        trackEvent('scroll_90_event_page', { depth_percent: 90 })
        trackEvent('scroll_90', { depth_percent: 90 })
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [isUltraArena, trackEvent])

  // Desktop sticky CTA — show after scrolling past the hero (~400px)
  useEffect(() => {
    if (!isUltraArena) return
    const onScroll = () => setShowDesktopCta(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [isUltraArena])

  // Pricing section visibility (decision zone)
  useEffect(() => {
    if (!isUltraArena) return
    const target = document.getElementById('tarifs-inscription')
    if (!target) return
    let fired = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (fired || !entry?.isIntersecting) return
        fired = true
        trackEvent('view_pricing', { section: 'pricing' })
        observer.disconnect()
      },
      { threshold: 0.25 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [isUltraArena, trackEvent])

  return { trackEvent, showDesktopCta }
}
