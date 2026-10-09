import { getEffectiveEventStatus, isEventOpenForRegistration } from './registrationStatus'

type FeaturedEventCandidate = {
  status: string | null | undefined
  sales_start?: string | null
  date: string | null | undefined
}

/**
 * Picks the event to feature on the homepage, the header and any other page
 * with no event of its own in context. Prefers the soonest event that is
 * open for registration (or about to be); falls back to the soonest
 * announced event if nothing is open yet. Never picks a draft, and never a
 * date that has already passed with no live status.
 */
export const selectFeaturedEvent = <T extends FeaturedEventCandidate>(
  events: T[],
  now: Date = new Date(),
): T | null => {
  const withEffectiveStatus = events
    .filter((event) => String(event.status ?? '').toLowerCase() !== 'draft')
    .map((event) => ({ event, effectiveStatus: String(getEffectiveEventStatus(event, now) ?? '') }))

  const open = withEffectiveStatus
    .filter(({ event, effectiveStatus }) => effectiveStatus === 'on_sale' || isEventOpenForRegistration(event, now))
    .sort((a, b) => new Date(a.event.date ?? 0).getTime() - new Date(b.event.date ?? 0).getTime())

  if (open.length > 0) return open[0].event

  const announced = withEffectiveStatus
    .filter(({ effectiveStatus }) => effectiveStatus === 'announced')
    .sort((a, b) => new Date(a.event.date ?? 0).getTime() - new Date(b.event.date ?? 0).getTime())

  return announced[0]?.event ?? null
}
