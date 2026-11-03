import type { Participant } from '@/components/registration/types'
import { classifyParticipantAge } from './participantAge'

interface MinorContext {
  eventDate: string
  /** `events.minimum_age`. */
  minimumAge: number
  ticketIsOpenFormat: (ticketId: string) => boolean
}

/** First names of the participants who are minors on the event day, in order; someone not yet named gets a neutral label. */
export const minorParticipantNames = (
  participants: readonly Pick<Participant, 'ticketId' | 'birthDate' | 'firstName'>[],
  { eventDate, minimumAge, ticketIsOpenFormat }: MinorContext,
): string[] =>
  participants
    .filter(
      (participant) =>
        classifyParticipantAge({
          birthDate: participant.birthDate,
          eventDate,
          minimumAge,
          isOpenFormat: ticketIsOpenFormat(participant.ticketId),
        }).status === 'minor',
    )
    .map((participant) => participant.firstName.trim() || 'ce participant')
