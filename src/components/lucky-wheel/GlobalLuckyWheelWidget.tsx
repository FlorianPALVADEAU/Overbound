'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'
import { useEventDetail } from '@/app/api/events/[id]/eventDetailQueries'

const LuckyWheelWidget = dynamic(
  () => import('./LuckyWheelWidget').then((mod) => mod.LuckyWheelWidget),
  { ssr: false },
)

/**
 * FDR-0015 §7.1: resolves which event the Lucky Wheel should target from
 * page context, so the widget can mount once, site-wide, instead of being
 * hand-wired into every event page. On an event page (/events/[id]/*), the
 * URL param can be a slug or a UUID -- useEventDetail resolves either to
 * the real event, same lookup the event page itself uses. Everywhere
 * else, the site-wide featured event is used (same one the homepage's
 * FeaturedEventBar shows). /api/lucky-wheel/campaign requires a real
 * event UUID, which both paths provide via event.id.
 */
export function GlobalLuckyWheelWidget() {
  const params = useParams<{ id?: string }>()
  const routeEventParam = params?.id

  const { data: routeEventData } = useEventDetail(routeEventParam ?? '')
  const { data: featuredEventData } = useFeaturedEvent()

  const eventId = routeEventParam ? routeEventData?.event?.id : featuredEventData?.event?.id

  if (!eventId) return null

  return <LuckyWheelWidget eventId={eventId} />
}
