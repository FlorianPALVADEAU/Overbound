import { isOpenFormatTicket } from '@/lib/openSas'
import { ticketUsesWaveSelection } from '@/lib/tickets/operationsProfile'
import { missingMinorContacts, type MinorContacts } from './minorContacts'
import { ageRefusalMessage, classifyParticipantAge } from './participantAge'

interface EligibilityParticipant extends MinorContacts {
  ticketId: string
  birthDate?: string
  selectedWaveIndex?: number | null
}

type EligibilityTicket = Parameters<typeof ticketUsesWaveSelection>[0] & { id: string }

interface EligibilityContext {
  eventDate: string
  /** `events.minimum_age`: 18, or 16 when the edition admits minors on the OPEN format. */
  minimumAge: number
  tickets: readonly EligibilityTicket[]
  /** The buyer's group already has a departure on this event: it wins over any SAS choice. */
  hasGroupAnchor: boolean
}

export type Admission = { admitted: true; isMinor: boolean } | { admitted: false; reason: string }

/**
 * Age rules for one participant: old enough for the event, a minor only on the OPEN format, and a minor
 * always with a legal representative and an adult on site.
 */
export const admitParticipant = (
  participant: Pick<EligibilityParticipant, 'birthDate' | keyof MinorContacts>,
  ticket: { name?: string | null; race?: { name?: string | null } | null } | undefined,
  { eventDate, minimumAge }: Pick<EligibilityContext, 'eventDate' | 'minimumAge'>,
): Admission => {
  const age = classifyParticipantAge({
    birthDate: participant.birthDate,
    eventDate,
    minimumAge,
    isOpenFormat: isOpenFormatTicket(ticket?.name, ticket?.race?.name),
  })
  if (age.status === 'refused') return { admitted: false, reason: ageRefusalMessage(age.reason, minimumAge) }
  if (age.status === 'minor' && missingMinorContacts(participant).length > 0) {
    return { admitted: false, reason: "le représentant légal et l'adulte référent sont obligatoires avant 18 ans." }
  }
  return { admitted: true, isMinor: age.status === 'minor' }
}

/**
 * Checks run before any money is taken: once Stripe has charged, refusing the
 * registration would leave a paid order without bibs. Returns the reason for
 * the first participant who cannot register, or null.
 */
export const checkOrderEligibility = (
  participants: readonly EligibilityParticipant[],
  { eventDate, minimumAge, tickets, hasGroupAnchor }: EligibilityContext,
): string | null => {
  for (const [index, participant] of participants.entries()) {
    const label = `Participant ${index + 1}`
    const ticket = tickets.find((item) => item.id === participant.ticketId)
    const admission = admitParticipant(participant, ticket, { eventDate, minimumAge })
    if (!admission.admitted) return `${label} : ${admission.reason}`
    if (ticket && ticketUsesWaveSelection(ticket) && !hasGroupAnchor && !participant.selectedWaveIndex) {
      return `${label} : choisis ton SAS de départ.`
    }
  }
  return null
}
