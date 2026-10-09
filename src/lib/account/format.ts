import { formatClockTimeParis } from '@/lib/dateTime'

const FR_LOCALE = 'fr-FR'
const PARIS_TIME_ZONE = 'Europe/Paris'

const toDate = (value: string | null | undefined) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** « samedi 12 septembre 2026 » */
export const formatLongDate = (value: string | null | undefined) => {
  const date = toDate(value)
  if (!date) return null
  return date.toLocaleDateString(FR_LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: PARIS_TIME_ZONE,
  })
}

/** « sept. 2026 » */
export const formatMonthYear = (value: string | null | undefined) => {
  const date = toDate(value)
  if (!date) return null
  return date.toLocaleDateString(FR_LOCALE, { month: 'short', year: 'numeric', timeZone: PARIS_TIME_ZONE })
}

/** « 11 sept. à 14:30 » */
export const formatShortDateTime = (value: Date | null) => {
  if (!value) return null
  const day = value.toLocaleDateString(FR_LOCALE, { day: 'numeric', month: 'short', timeZone: PARIS_TIME_ZONE })
  return `${day} à ${formatClockTimeParis(value)}`
}

export const buildMapsUrl = (location: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

export const formatPrice = (amountCents: number | null, currency: string | null) => {
  if (typeof amountCents !== 'number' || !currency) return null
  return new Intl.NumberFormat(FR_LOCALE, { style: 'currency', currency: currency.toUpperCase() }).format(
    amountCents / 100,
  )
}
