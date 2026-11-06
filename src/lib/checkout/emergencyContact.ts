import type { Participant } from '@/components/registration/types'

export interface EmergencyContactSuggestion {
  name: string
  phone: string
  /** Participant the contact is copied from, for the button label. */
  fromParticipantId: string
}

const isFilled = (value: string | undefined) => Boolean(value?.trim())

/**
 * Several bibs are often bought by people who share the same emergency contact
 * (family, friends, colleagues). Suggests the first other participant's contact
 * while this participant has none of their own; never overwrites what was typed.
 */
export const emergencyContactToReuse = (
  participants: readonly Participant[],
  participantId: string,
): EmergencyContactSuggestion | null => {
  const target = participants.find((participant) => participant.id === participantId)
  if (!target || isFilled(target.emergencyContactName) || isFilled(target.emergencyContactPhone)) return null

  const source = participants.find(
    (participant) =>
      participant.id !== participantId && isFilled(participant.emergencyContactName) && isFilled(participant.emergencyContactPhone),
  )
  return source
    ? { name: source.emergencyContactName.trim(), phone: source.emergencyContactPhone.trim(), fromParticipantId: source.id }
    : null
}
