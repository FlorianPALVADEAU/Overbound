const DEFAULT_EVENT_TIME_ZONE = 'Europe/Paris'

export type EventCorrectionCutoffInput = {
  eventStart: string | Date | null | undefined
  now?: Date
  timeZone?: string | null
}

export type EventCorrectionCutoffStatus = {
  allowed: boolean
  cutoffAt: string | null
  eventStart: string | null
  timeZone: string
  blocker: string | null
}

const getLocalDateParts = (instant: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)

  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  if (![year, month, day].every(Number.isFinite)) throw new Error('Date locale invalide')
  return { year, month, day }
}

const getTimeZoneOffsetMinutes = (instant: Date, timeZone: string) => {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset',
  }).formatToParts(instant).find((part) => part.type === 'timeZoneName')?.value
  const match = name?.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/)
  if (!match) return 0
  const sign = match[1] === '-' ? -1 : 1
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0))
}

/** Convert a local calendar midnight to an instant, including DST offsets. */
const localMidnightToInstant = (year: number, month: number, day: number, timeZone: string) => {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  const offset = getTimeZoneOffsetMinutes(utcGuess, timeZone)
  return new Date(utcGuess.getTime() - offset * 60_000)
}

const parseInstant = (value: string | Date | null | undefined) => {
  const instant = value instanceof Date ? new Date(value.getTime()) : value ? new Date(value) : null
  return instant && !Number.isNaN(instant.getTime()) ? instant : null
}

/**
 * Corrections are closed at local midnight on the calendar day before the event.
 * This is intentionally based on the event's local date, not a 24-hour duration.
 */
export const getEventCorrectionCutoff = ({ eventStart, now = new Date(), timeZone }: EventCorrectionCutoffInput): EventCorrectionCutoffStatus => {
  const resolvedTimeZone = timeZone?.trim() || DEFAULT_EVENT_TIME_ZONE
  const start = parseInstant(eventStart)
  if (!start) {
    return { allowed: false, cutoffAt: null, eventStart: null, timeZone: resolvedTimeZone, blocker: 'La date de début de l’événement est invalide : correction bloquée.' }
  }

  try {
    const localDate = getLocalDateParts(start, resolvedTimeZone)
    const dayBefore = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day - 1))
    const cutoff = localMidnightToInstant(dayBefore.getUTCFullYear(), dayBefore.getUTCMonth() + 1, dayBefore.getUTCDate(), resolvedTimeZone)
    const isClosed = now.getTime() >= cutoff.getTime()
    return {
      allowed: !isClosed,
      cutoffAt: cutoff.toISOString(),
      eventStart: start.toISOString(),
      timeZone: resolvedTimeZone,
      blocker: isClosed ? 'Les corrections sont interdites à partir de J-1 inclus avant le début de l’événement.' : null,
    }
  } catch {
    return { allowed: false, cutoffAt: null, eventStart: start.toISOString(), timeZone: resolvedTimeZone, blocker: 'Le fuseau horaire de l’événement est invalide : correction bloquée.' }
  }
}
