/**
 * Teaser sent before ticket sales open ("la billetterie ouvre le ... à ..."). Everything shown comes from
 * the event row: date, place, opening instant and T-shirt quota are never written in the mail by hand.
 */

const PARIS = 'Europe/Paris'

/** The teaser only makes sense shortly before the opening; a stale cron entry must not mail again. */
export const TEASER_WINDOW_DAYS = 9

export interface TeaserEvent {
  id: string
  slug: string
  title: string
  date: string
  location: string | null
  status: string | null
  sales_start: string | null
  tshirt_offer_quota: number | null
}

export interface TeaserContent {
  subject: string
  preview: string
  eventTitle: string
  eventDateLabel: string
  eventLocation: string | null
  salesStartLabel: string
  /** The opening split for the headline: "mardi", "1er décembre", "7h00". */
  salesWeekday: string
  salesDate: string
  salesTime: string
  tshirtQuota: number | null
  eventUrl: string
  /** Animated countdown to the opening, drawn when the mail is opened. */
  countdownUrl: string
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Sales are announced, not started yet, due within the teaser window, and the event is still ahead. */
export function isTeaserDue(event: TeaserEvent, now: Date): boolean {
  if (String(event.status ?? '').toLowerCase() !== 'announced') return false
  if (!event.sales_start) return false

  const salesStart = new Date(event.sales_start).getTime()
  const eventDate = new Date(event.date).getTime()
  if (Number.isNaN(salesStart) || Number.isNaN(eventDate)) return false

  const untilSales = salesStart - now.getTime()
  return untilSales > 0 && untilSales <= TEASER_WINDOW_DAYS * DAY_MS && eventDate > now.getTime()
}

/** "mardi 1er décembre" in Paris time. French writes the first of the month as "1er". */
export function formatParisDay(iso: string, options: { withYear?: boolean } = {}): string {
  const label = new Intl.DateTimeFormat('fr-FR', {
    timeZone: PARIS,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(options.withYear ? { year: 'numeric' } : {}),
  }).format(new Date(iso))
  return label.replace(/\b1 /, '1er ')
}

/** "7h00" in Paris time. */
export function formatParisTime(iso: string): string {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: PARIS,
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '0'
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00'
  return `${Number(hour)}h${minute}`
}

export function buildTeaserContent(event: TeaserEvent, siteUrl: string): TeaserContent {
  if (!event.sales_start) {
    throw new Error('[sale teaser] event has no sales_start')
  }

  const salesDay = formatParisDay(event.sales_start)
  const salesTime = formatParisTime(event.sales_start)
  const [salesWeekday = '', ...dateWords] = salesDay.split(' ')
  const salesStartLabel = `${salesDay} à ${salesTime}`
  const tshirtQuota = event.tshirt_offer_quota && event.tshirt_offer_quota > 0 ? event.tshirt_offer_quota : null
  const url = new URL(`${siteUrl.replace(/\/$/, '')}/events/${event.slug}`)
  url.searchParams.set('utm_source', 'email')
  url.searchParams.set('utm_medium', 'marketing')
  url.searchParams.set('utm_campaign', `sale_teaser_${event.slug}`)

  return {
    subject: `La billetterie ouvre ${salesStartLabel}`,
    preview: tshirtQuota
      ? `Sois là à l'ouverture : T-shirt offert aux ${tshirtQuota} premiers inscrits.`
      : 'Sois là à l\'ouverture.',
    eventTitle: event.title,
    eventDateLabel: formatParisDay(event.date, { withYear: true }),
    eventLocation: event.location,
    salesStartLabel,
    salesWeekday,
    salesDate: dateWords.join(' '),
    salesTime,
    tshirtQuota,
    eventUrl: url.toString(),
    countdownUrl: `${siteUrl.replace(/\/$/, '')}/api/email/countdown?event=${encodeURIComponent(event.slug)}`,
  }
}

/** One campaign per event: a rerun of the cron resumes it and never mails an address twice. */
export const teaserCampaignKey = (event: Pick<TeaserEvent, 'id'>) => `sale-teaser:${event.id}`
