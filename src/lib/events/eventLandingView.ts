import { formatWaveStartTime, isOpenFormatTicket, isRankedFormatTicket } from '@/lib/openSas'
import { getCurrentTicketPrice } from '@/lib/pricing'
import type { EventPriceTier } from '@/types/EventPriceTier'

export interface LandingTicket {
  id: string
  name: string
  final_price_cents: number
  currency?: string | null
  race?: { name?: string | null; gallery_images?: string[] | null } | null
}

interface BuildInput {
  tickets: LandingTicket[]
  priceTiers: EventPriceTier[]
  eventSlug: string
}

/**
 * Everything the event landing template needs to decide what to show.
 * Sections are chosen by what the event has (capabilities), never by slug.
 */
export interface EventLandingView {
  lowestPriceCents: number | null
  currency: string
  openTicket: LandingTicket | null
  rankedTicket: LandingTicket | null
  hasBothFormats: boolean
  galleryImages: string[]
  /** Ticket to preselect from a generic CTA: only when there is no real choice. */
  soleTicketId: string | null
  registerHref: (ticketId?: string) => string
}

export const buildEventLandingView = ({
  tickets,
  priceTiers,
  eventSlug,
}: BuildInput): EventLandingView => {
  const prices = tickets
    .map((t) => getCurrentTicketPrice(t as never, priceTiers))
    .filter((p): p is number => typeof p === 'number')

  const openTicket =
    tickets.find((t) => isOpenFormatTicket(t.name, t.race?.name) && !isRankedFormatTicket(t.name, t.race?.name)) ?? null
  const rankedTicket = tickets.find((t) => isRankedFormatTicket(t.name, t.race?.name)) ?? null

  const raceImages = tickets
    .flatMap((t) => (Array.isArray(t.race?.gallery_images) ? t.race.gallery_images : []))
    .filter((url): url is string => typeof url === 'string' && url.length > 0)

  const base = `/events/${eventSlug}/register`

  return {
    lowestPriceCents: prices.length > 0 ? Math.min(...prices) : null,
    currency: tickets.find((t) => t.currency)?.currency ?? 'EUR',
    openTicket,
    rankedTicket,
    hasBothFormats: Boolean(openTicket && rankedTicket),
    galleryImages: raceImages,
    soleTicketId: tickets.length === 1 ? tickets[0].id : null,
    registerHref: (ticketId) => (ticketId ? `${base}?ticket=${ticketId}` : base),
  }
}

export const formatConfigTime = (time: { hour: number; minute: number }) =>
  `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`

export interface DepartureWave {
  wave_index: number
  start_time: string
  remaining: number
}

/** How a ticket's departure is presented in the chooser. */
export type TicketDeparture =
  | { kind: 'slots'; waves: DepartureWave[] }
  | { kind: 'single'; label: string | null; waveIndex: number | null; full: boolean }
  | { kind: 'loading' }

interface DescribeInput {
  ticket: Pick<LandingTicket, 'name' | 'race'>
  /** Slots of this ticket; undefined until the overview has loaded. */
  waves: DepartureWave[] | undefined
  rankedLabel: string
}

/**
 * Many slots → pick one. A single departure (RANKED start, or a ticket with
 * one slot) → one register button. Never guesses a time it does not know.
 */
export const describeTicketDeparture = ({ ticket, waves, rankedLabel }: DescribeInput): TicketDeparture => {
  if (isRankedFormatTicket(ticket.name, ticket.race?.name)) {
    return { kind: 'single', label: rankedLabel, waveIndex: null, full: false }
  }
  if (waves === undefined && isOpenFormatTicket(ticket.name, ticket.race?.name)) {
    return { kind: 'loading' }
  }
  if (waves && waves.length > 1) return { kind: 'slots', waves }
  if (waves && waves.length === 1) {
    const [only] = waves
    return {
      kind: 'single',
      label: formatWaveStartTime(only.start_time),
      waveIndex: only.wave_index,
      full: only.remaining <= 0,
    }
  }
  return { kind: 'single', label: null, waveIndex: null, full: false }
}

/** Slots shown as chips; the rest goes in a dropdown so 50 slots stay readable. */
export const MAX_VISIBLE_DEPARTURES = 4

export const splitDepartureWaves = (waves: DepartureWave[], max = MAX_VISIBLE_DEPARTURES) => ({
  visible: waves.slice(0, max),
  overflow: waves.slice(max),
})
