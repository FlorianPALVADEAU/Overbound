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

/**
 * Picks the most recent past event, used by the events hub when nothing is
 * open: it carries the thank-you content (photos) and the waiting list.
 * Never a draft or a cancelled event.
 */
export const selectLastEvent = <T extends FeaturedEventCandidate>(events: T[]): T | null => {
  const past = events.filter((event) => {
    const status = String(event.status ?? '').toLowerCase()
    return status !== 'draft' && status !== 'cancelled'
  })
  return past.sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())[0] ?? null
}
