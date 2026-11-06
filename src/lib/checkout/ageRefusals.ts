import { ageRefusalMessage, classifyParticipantAge } from './participantAge'

interface AgeCheckedParticipant {
  id: string
  ticketId: string
  birthDate: string
}

interface AgeRefusalContext {
  eventDate: string
  /** `events.minimum_age`: 18, or 16 when the edition admits minors on the OPEN format. */
  minimumAge: number
  ticketIsOpenFormat: (ticketId: string) => boolean
}

/**
 * Birth-date refusals known as soon as the date is typed (a minor on a RANKED ticket, too young, impossible date),
 * keyed by participant id. Shown at once, without waiting for the visitor to try to pay. Empty dates are left to
 * the required-field check.
 */
export const birthDateRefusals = (
  participants: readonly AgeCheckedParticipant[],
  { eventDate, minimumAge, ticketIsOpenFormat }: AgeRefusalContext,
): Record<string, string> => {
  const refusals: Record<string, string> = {}
  for (const participant of participants) {
    if (!participant.birthDate.trim()) continue
    const age = classifyParticipantAge({
      birthDate: participant.birthDate,
      eventDate,
      minimumAge,
      isOpenFormat: ticketIsOpenFormat(participant.ticketId),
    })
    if (age.status === 'refused') refusals[participant.id] = ageRefusalMessage(age.reason, minimumAge)
  }
  return refusals
}
