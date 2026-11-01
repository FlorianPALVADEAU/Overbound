import { getRankedStartTime } from '@/lib/openSas'
import { parseNumberList } from '@/lib/tickets/flexibleTicket'
import type { TicketOperationsConfig } from '@/types/Ticket'

/**
 * "Option OPEN" (open companion): a fixed-price option, chosen per RANKED
 * participant at checkout, that adds a second bib on the OPEN ticket of the
 * same event. It is a real second registration (own bib, own QR, own SAS),
 * linked to the RANKED one through `registrations.companion_of`.
 *
 * The contract lives on the RANKED ticket, in `operations_config.open_companion`.
 * No ticket or race name takes part in any decision here.
 */
export interface OpenCompanionConfig {
  /** OPEN ticket the companion bib is issued on. */
  openTicketId: string
  /** Fixed price, never discounted. */
  priceCents: number
  /** Longest a RANKED participant can still be on the course after the RANKED start. */
  rankedMaxDurationMinutes: number
  /** Rest the participant needs between the RANKED finish and the OPEN start. */
  minGapMinutes: number
}

const MINUTE_MS = 60 * 1000

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0

/** Reads `operations_config.open_companion`. Anything incomplete means the ticket has no option. */
export const parseOpenCompanionConfig = (
  config: TicketOperationsConfig | Record<string, unknown> | null | undefined,
): OpenCompanionConfig | null => {
  const raw = config?.open_companion
  if (!raw || typeof raw !== 'object') return null
  const { ticket_id, price_cents, ranked_max_duration_minutes, min_gap_minutes } = raw as Record<string, unknown>

  if (typeof ticket_id !== 'string' || ticket_id.length === 0) return null
  if (!isNonNegativeInteger(price_cents) || price_cents === 0) return null
  if (!isNonNegativeInteger(ranked_max_duration_minutes) || ranked_max_duration_minutes === 0) return null
  if (!isNonNegativeInteger(min_gap_minutes)) return null

  return {
    openTicketId: ticket_id,
    priceCents: price_cents,
    rankedMaxDurationMinutes: ranked_max_duration_minutes,
    minGapMinutes: min_gap_minutes,
  }
}

/**
 * When the RANKED participant starts: the ticket's fixed start if it has one,
 * otherwise the event's single RANKED departure.
 */
export const resolveRankedStart = (
  rankedConfig: TicketOperationsConfig | Record<string, unknown> | null | undefined,
  eventDateIso: string,
): Date => {
  const fixed = rankedConfig?.fixed_start_time
  if (typeof fixed === 'string') {
    const parsed = new Date(fixed)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return getRankedStartTime(eventDateIso)
}

/** First moment an OPEN SAS may start for a participant who also runs the RANKED. */
export const getCompanionEarliestStart = (config: OpenCompanionConfig, rankedStart: Date): Date =>
  new Date(rankedStart.getTime() + (config.rankedMaxDurationMinutes + config.minGapMinutes) * MINUTE_MS)

export interface CompanionWave {
  startTime: string
  capacity: number
  assignedCount: number
}

export type CompanionWaveBlock = 'TOO_EARLY' | 'FULL'

export type CompanionWaveAvailability = { selectable: true } | { selectable: false; reason: CompanionWaveBlock }

/** Whether the participant may pick this OPEN SAS as their companion start. */
export const getCompanionWaveAvailability = (wave: CompanionWave, earliestStart: Date): CompanionWaveAvailability => {
  const start = new Date(wave.startTime)
  if (Number.isNaN(start.getTime()) || start.getTime() < earliestStart.getTime()) {
    return { selectable: false, reason: 'TOO_EARLY' }
  }
  if (wave.assignedCount >= wave.capacity) return { selectable: false, reason: 'FULL' }
  return { selectable: true }
}

export const COMPANION_WAVE_MESSAGES: Record<CompanionWaveBlock, string> = {
  TOO_EARLY: 'Trop tôt : laisse-toi le temps de finir ton RANKED et de récupérer.',
  FULL: 'SAS complet.',
}

/** A companion bib paid for in an order, as the PaymentIntent remembers it. */
export interface PaidCompanionBib {
  /** Position of the RANKED participant in the order. */
  participantIndex: number
  /** OPEN SAS validated when the payment was prepared. */
  waveIndex: number
  /** What the companion bib cost. */
  priceCents: number
}

/**
 * Companion bibs of an order, from Stripe metadata (three lists of the same length: participant
 * positions, SAS, prices). A lists mismatch means the metadata is not ours, so nothing is trusted.
 */
export const readPaidCompanions = (metadata: Record<string, string | undefined> | null | undefined): PaidCompanionBib[] => {
  const indices = parseNumberList(metadata?.companion_participants)
  const waves = parseNumberList(metadata?.companion_waves)
  const prices = parseNumberList(metadata?.companion_prices)
  if (indices.length !== waves.length || indices.length !== prices.length) return []
  return indices.map((participantIndex, position) => ({
    participantIndex,
    waveIndex: waves[position]!,
    priceCents: prices[position]!,
  }))
}

/** What the checkout shows for the option on a RANKED ticket. */
export interface CompanionOffer {
  openTicketId: string
  openTicketName: string
  priceCents: number
  /** What the OPEN ticket costs on its own, to show the saving. */
  fullPriceCents: number | null
  /** First moment an OPEN SAS may start for this participant. */
  earliestStart: Date
}

/** The option of a RANKED ticket, or null when it has none or its OPEN ticket is not part of the event. */
export const resolveCompanionOffer = (
  ticket: { operations_config?: TicketOperationsConfig | Record<string, unknown> | null },
  eventTickets: ReadonlyArray<{ id: string; name: string; final_price_cents?: number | null }>,
  eventDateIso: string,
): CompanionOffer | null => {
  const config = parseOpenCompanionConfig(ticket.operations_config)
  if (!config) return null
  const openTicket = eventTickets.find((candidate) => candidate.id === config.openTicketId)
  if (!openTicket) return null
  return {
    openTicketId: openTicket.id,
    openTicketName: openTicket.name,
    priceCents: config.priceCents,
    fullPriceCents: openTicket.final_price_cents ?? null,
    earliestStart: getCompanionEarliestStart(config, resolveRankedStart(ticket.operations_config, eventDateIso)),
  }
}
