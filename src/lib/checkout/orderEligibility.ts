import { ticketUsesWaveSelection } from '@/lib/tickets/operationsProfile'
import { isAdultOnEventDate, MINIMUM_AGE } from './participantAge'

interface EligibilityParticipant {
  ticketId: string
  birthDate?: string
  selectedWaveIndex?: number | null
}

type EligibilityTicket = Parameters<typeof ticketUsesWaveSelection>[0] & { id: string }

interface EligibilityContext {
  eventDate: string
  tickets: readonly EligibilityTicket[]
  /** The buyer's group already has a departure on this event: it wins over any SAS choice. */
  hasGroupAnchor: boolean
}

/**
 * Checks run before any money is taken: once Stripe has charged, refusing the
 * registration would leave a paid order without bibs. Returns the reason for
 * the first participant who cannot register, or null.
 */
export const checkOrderEligibility = (
  participants: readonly EligibilityParticipant[],
  { eventDate, tickets, hasGroupAnchor }: EligibilityContext,
): string | null => {
  for (const [index, participant] of participants.entries()) {
    const label = `Participant ${index + 1}`
    if (!participant.birthDate || !isAdultOnEventDate(participant.birthDate, eventDate)) {
      return `${label} : il faut avoir ${MINIMUM_AGE} ans le jour de l'événement.`
    }
    const ticket = tickets.find((item) => item.id === participant.ticketId)
    if (ticket && ticketUsesWaveSelection(ticket) && !hasGroupAnchor && !participant.selectedWaveIndex) {
      return `${label} : choisis ton SAS de départ.`
    }
  }
  return null
}
