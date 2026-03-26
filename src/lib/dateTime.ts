const FR_LOCALE = 'fr-FR'
const PARIS_TIME_ZONE = 'Europe/Paris'

type DateValue = string | number | Date | null | undefined

const normalizePgTimestamp = (raw: string) => {
  const value = raw.trim()

  // Already ISO with timezone.
  if (/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return value
  }

  // PostgreSQL style datetime with space and timezone offset (+00 or +00:00).
  const withOffsetMatch = value.match(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}(?:\.\d+)?)([+-]\d{2})(?::?(\d{2}))?$/,
  )
  if (withOffsetMatch) {
    const [, datePart, timePart, hourOffset, minuteOffset] = withOffsetMatch
    const offset = `${hourOffset}:${minuteOffset ?? '00'}`
    return `${datePart}T${timePart}${offset}`
  }

  // PostgreSQL style datetime without timezone: assume UTC for consistency.
  const withoutOffsetMatch = value.match(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}(?:\.\d+)?)$/,
  )
  if (withoutOffsetMatch) {
    const [, datePart, timePart] = withoutOffsetMatch
    return `${datePart}T${timePart}Z`
  }

  return value
}

const parseDateValue = (value: DateValue) => {
  if (!value) return null
  const parsed =
    value instanceof Date
      ? value
      : typeof value === 'string'
        ? new Date(normalizePgTimestamp(value))
        : new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export const formatClockTimeParis = (value: DateValue) => {
  const parsed = parseDateValue(value)
  if (parsed) {
    return parsed.toLocaleTimeString(FR_LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: PARIS_TIME_ZONE,
    })
  }

  if (typeof value === 'string') {
    const timeOnlyMatch = value.match(/^(\d{2}):(\d{2})(?::\d{2})?$/)
    if (timeOnlyMatch) {
      return `${timeOnlyMatch[1]}:${timeOnlyMatch[2]}`
    }
  }

  return null
}

export const formatDateTimeParis = (value: DateValue) => {
  const parsed = parseDateValue(value)
  if (!parsed) return null

  return parsed.toLocaleString(FR_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: PARIS_TIME_ZONE,
  })
}
