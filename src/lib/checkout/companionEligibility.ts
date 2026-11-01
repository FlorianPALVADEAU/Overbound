import {
  COMPANION_WAVE_MESSAGES,
  getCompanionEarliestStart,
  getCompanionWaveAvailability,
  parseOpenCompanionConfig,
  resolveRankedStart,
} from '@/lib/tickets/openCompanion'

interface CompanionParticipant {
  ticketId: string
  companionWaveIndex?: number | null
}

interface CompanionTicket {
  id: string
  operations_config?: Record<string, unknown> | null
}

/** A SAS of the OPEN ticket, as stored in event_waves. */
export interface CompanionWaveRow {
  ticket_id: string
  wave_index: number
  start_time: string
  capacity: number
  assigned_count: number
  is_closed: boolean
}

interface CompanionContext {
  eventDate: string
  /** Tickets of the order: each carries the contract of its own companion option. */
  tickets: readonly CompanionTicket[]
  /** SAS of the event, for every OPEN ticket a contract points to. */
  waves: readonly CompanionWaveRow[]
}

/** Companion bibs asked for in the order, to size seats and spots. */
export const countCompanions = (participants: readonly CompanionParticipant[]): number =>
  participants.filter((participant) => participant.companionWaveIndex != null).length

/**
 * Checks run before any money is taken, like `checkOrderEligibility`: the option exists on the
 * participant's ticket, and the chosen OPEN SAS starts late enough and still has room, counting
 * the other companions of the same order. Returns the reason for the first refusal, or null.
 */
export const checkCompanionOrder = (
  participants: readonly CompanionParticipant[],
  { eventDate, tickets, waves }: CompanionContext,
): string | null => {
  const takenInOrder = new Map<string, number>()

  for (const [index, participant] of participants.entries()) {
    if (participant.companionWaveIndex == null) continue
    const label = `Participant ${index + 1}`

    const ticket = tickets.find((item) => item.id === participant.ticketId)
    const config = parseOpenCompanionConfig(ticket?.operations_config)
    if (!ticket || !config) return `${label} : l'option OPEN n'est pas disponible pour ce billet.`

    const wave = waves.find(
      (item) => item.ticket_id === config.openTicketId && item.wave_index === participant.companionWaveIndex,
    )
    if (!wave) return `${label} : SAS OPEN introuvable.`

    const key = `${wave.ticket_id}:${wave.wave_index}`
    const taken = takenInOrder.get(key) ?? 0
    const availability = wave.is_closed
      ? ({ selectable: false, reason: 'FULL' } as const)
      : getCompanionWaveAvailability(
          { startTime: wave.start_time, capacity: wave.capacity, assignedCount: wave.assigned_count + taken },
          getCompanionEarliestStart(config, resolveRankedStart(ticket.operations_config, eventDate)),
        )
    if (!availability.selectable) return `${label} : ${COMPANION_WAVE_MESSAGES[availability.reason]}`

    takenInOrder.set(key, taken + 1)
  }

  return null
}
