import type { Participant } from '@/components/registration/types'

/**
 * Who would follow `source` onto its SAS: the other participants on the same
 * ticket (SAS belong to a ticket) who are not on it yet.
 */
export const participantsToAlign = (participants: readonly Participant[], sourceId: string): string[] => {
  const source = participants.find((participant) => participant.id === sourceId)
  if (!source?.selectedWaveIndex) return []
  return participants
    .filter((participant) => participant.id !== source.id)
    .filter((participant) => participant.ticketId === source.ticketId)
    .filter((participant) => participant.selectedWaveIndex !== source.selectedWaveIndex)
    .map((participant) => participant.id)
}
