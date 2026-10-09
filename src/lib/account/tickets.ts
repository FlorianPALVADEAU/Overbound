import { isTicketTransferAllowed } from '@/lib/tickets/transferPolicy'
import type { AccountRegistrationItem } from '@/types/AccountRegistration'

const PARIS_TIME_ZONE = 'Europe/Paris'

export type EventPhase = 'upcoming' | 'today' | 'past'

export interface EventTicketGroup {
  /** Stable key: the event id, or the title when the event row is missing. */
  key: string
  eventId: string | null
  title: string
  date: string | null
  location: string | null
  phase: EventPhase
  tickets: AccountRegistrationItem[]
}

/** `YYYY-MM-DD` of an instant in the event timezone (Paris), so "today" never drifts with the device clock zone. */
const parisDay = (value: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value)

const DAY_MS = 24 * 60 * 60 * 1000

const parisDayIndex = (value: Date) => Math.floor(Date.parse(`${parisDay(value)}T00:00:00Z`) / DAY_MS)

const parseDate = (value: string | null | undefined) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * An event stays "today" until the end of its Paris calendar day: a participant
 * on a 13:00 wave must still reach the QR code after the 08:00 event start.
 */
export const getEventPhase = (eventDate: string | null | undefined, now: Date): EventPhase => {
  const date = parseDate(eventDate)
  if (!date) return 'upcoming'
  const delta = parisDayIndex(date) - parisDayIndex(now)
  if (delta > 0) return 'upcoming'
  if (delta === 0) return 'today'
  return 'past'
}

/** Whole Paris calendar days until the event (0 = today, negative = past). Null when the date is unknown. */
export const getDaysUntilEvent = (eventDate: string | null | undefined, now: Date): number | null => {
  const date = parseDate(eventDate)
  if (!date) return null
  return parisDayIndex(date) - parisDayIndex(now)
}

const normalizeEmail = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ''

/** True when the registration is the account holder's own bib (not one bought for someone else). */
export const isOwnTicket = (ticket: AccountRegistrationItem, userEmail: string | null | undefined) => {
  const holder = normalizeEmail(ticket.email)
  return holder === '' || holder === normalizeEmail(userEmail)
}

/** The QR code is shown until check-in, from purchase until the end of the event day. */
export const canShowTicketQr = (ticket: AccountRegistrationItem, now: Date) =>
  Boolean(ticket.qr_code_data_url) &&
  !ticket.checked_in &&
  getEventPhase(ticket.event_date, now) !== 'past'

/** Transfer needs a live token, an unchecked ticket and the deadline (J-1) not passed. */
export const canTransferTicket = (ticket: AccountRegistrationItem, now: Date) =>
  Boolean(ticket.transfer_token) &&
  !ticket.checked_in &&
  isTicketTransferAllowed(ticket.event_date, now)

export interface TransferState {
  /** The holder can start or complete a hand-over right now. */
  available: boolean
  /** The fee is paid: the link can be shared. */
  unlocked: boolean
  /** A hand-over would be possible but the J-1 deadline has passed. */
  closedByDeadline: boolean
}

export const getTransferState = (ticket: AccountRegistrationItem, now: Date): TransferState => {
  const available = canTransferTicket(ticket, now)
  return {
    available,
    unlocked: Boolean(ticket.transfer_unlocked),
    closedByDeadline:
      !available && Boolean(ticket.transfer_token) && !ticket.checked_in && getEventPhase(ticket.event_date, now) !== 'past',
  }
}

const compareTickets = (userEmail: string | null | undefined) => (a: AccountRegistrationItem, b: AccountRegistrationItem) => {
  const ownA = isOwnTicket(a, userEmail) ? 0 : 1
  const ownB = isOwnTicket(b, userEmail) ? 0 : 1
  if (ownA !== ownB) return ownA - ownB
  const bibA = a.bib_number ?? Number.POSITIVE_INFINITY
  const bibB = b.bib_number ?? Number.POSITIVE_INFINITY
  if (bibA !== bibB) return bibA - bibB
  return Date.parse(a.created_at) - Date.parse(b.created_at)
}

const phaseRank: Record<EventPhase, number> = { today: 0, upcoming: 1, past: 2 }

/**
 * Groups bibs by event. Order: today, then upcoming (soonest first), then past
 * (most recent first). Inside a group the holder's own bib comes first.
 */
export const groupTicketsByEvent = (
  tickets: AccountRegistrationItem[],
  now: Date,
  userEmail?: string | null,
): EventTicketGroup[] => {
  const groups = new Map<string, EventTicketGroup>()

  for (const ticket of tickets) {
    const key = ticket.event_id ?? ticket.event_title ?? 'unknown'
    const existing = groups.get(key)
    if (existing) {
      existing.tickets.push(ticket)
      continue
    }
    groups.set(key, {
      key,
      eventId: ticket.event_id,
      title: ticket.event_title ?? 'Événement',
      date: ticket.event_date,
      location: ticket.event_location,
      phase: getEventPhase(ticket.event_date, now),
      tickets: [ticket],
    })
  }

  const sortTickets = compareTickets(userEmail)
  const dateOf = (group: EventTicketGroup) => parseDate(group.date)?.getTime() ?? 0

  return Array.from(groups.values())
    .map((group) => ({ ...group, tickets: [...group.tickets].sort(sortTickets) }))
    .sort((a, b) => {
      if (a.phase !== b.phase) return phaseRank[a.phase] - phaseRank[b.phase]
      return a.phase === 'past' ? dateOf(b) - dateOf(a) : dateOf(a) - dateOf(b)
    })
}

/** The event the home screen puts first: the soonest one that is not over yet. */
export const pickFeaturedGroup = (groups: EventTicketGroup[]): EventTicketGroup | null =>
  groups.find((group) => group.phase !== 'past') ?? null

export interface CountdownDisplay {
  caption: string
  value: string
}

/** « Dans / 122 jours », « Départ / Demain »… for the event header; null once the event is over. */
export const countdownDisplay = (days: number | null): CountdownDisplay | null => {
  if (days === null || days < 0) return null
  if (days === 0) return { caption: 'Départ', value: "Aujourd'hui" }
  if (days === 1) return { caption: 'Départ', value: 'Demain' }
  return { caption: 'Dans', value: `${days} jours` }
}

export const buildTransferUrl = (origin: string, token: string) =>
  `${origin}/account/tickets/claim?token=${encodeURIComponent(token)}`
