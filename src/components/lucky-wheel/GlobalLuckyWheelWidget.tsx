'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'
import { useEventDetail } from '@/app/api/events/[id]/eventDetailQueries'
import { resolveLuckyWheelPlacement } from '@/lib/luckyWheel/placement'

const LuckyWheelWidget = dynamic(
  () => import('./LuckyWheelWidget').then((mod) => mod.LuckyWheelWidget),
  { ssr: false },
)

/**
 * FDR-0015 §7.1: mounted once in Layout. Which routes may show the wheel,
 * and which event it targets there, is decided by the allowlist in
 * src/lib/luckyWheel/placement.ts -- any other route renders nothing. On
 * an event page the URL param can be a slug or a UUID; useEventDetail
 * resolves either to the real event, same lookup the event page itself
 * uses. /api/lucky-wheel/campaign requires a real event UUID, which both
 * paths provide via event.id.
 */
export function GlobalLuckyWheelWidget() {
  const placement = resolveLuckyWheelPlacement(usePathname())
  const routeEventParam = placement?.source === 'route-event' ? placement.eventParam : ''

  const { data: routeEventData } = useEventDetail(routeEventParam)
  // Shared, cached query (the header reads it too), so no extra request.
  const { data: featuredEventData } = useFeaturedEvent()

  if (!placement) return null

  const eventId =
    placement.source === 'route-event' ? routeEventData?.event?.id : featuredEventData?.event?.id

  if (!eventId) return null

  // Keyed by event: navigating client-side between two allowlisted pages
  // that target different events remounts the widget with fresh state.
  return <LuckyWheelWidget key={eventId} eventId={eventId} />
}
