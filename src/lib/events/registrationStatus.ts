import type { EventStatus } from '@/types/base.type'

type EventRegistrationShape = {
  status: EventStatus | string | null | undefined
  sales_start?: string | null
  date?: string | null
}

export const hasSalesStarted = (
  salesStartIso: string | null | undefined,
  now: Date = new Date(),
) => {
  if (!salesStartIso) return false
  const salesStart = new Date(salesStartIso)
  if (Number.isNaN(salesStart.getTime())) return false
  return salesStart.getTime() <= now.getTime()
}

export const isEventDateUpcoming = (eventDateIso: string | null | undefined, now: Date = new Date()) => {
  if (!eventDateIso) return true
  const eventDate = new Date(eventDateIso)
  if (Number.isNaN(eventDate.getTime())) return true
  return eventDate.getTime() >= now.getTime()
}

export const isEventOpenForRegistration = (
  event: EventRegistrationShape,
  now: Date = new Date(),
) => {
  const status = String(event.status ?? '').toLowerCase()
  if (status === 'on_sale') {
    return true
  }

  if (status === 'announced') {
    return hasSalesStarted(event.sales_start, now) && isEventDateUpcoming(event.date, now)
  }

  return false
}

export const getEffectiveEventStatus = <T extends EventRegistrationShape>(
  event: T,
  now: Date = new Date(),
): T['status'] => {
  const status = String(event.status ?? '').toLowerCase()
  if (status === 'announced' && isEventOpenForRegistration(event, now)) {
    return 'on_sale' as T['status']
  }
  return event.status
}
