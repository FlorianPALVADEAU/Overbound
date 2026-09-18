import type { EventParticipantRow } from '@/app/api/admin/events/participantsQueries'

export type ParticipantPreviewAction = 'ticket' | 'wave'

export type ParticipantQuickActionState = {
  ticket: { disabled: boolean; reason?: string }
  wave: { disabled: boolean; reason?: string }
}

/**
 * Preview actions deliberately stay read-only. A RANKED registration has no
 * SAS to inspect or change; the ticket preview remains available so its
 * server-side blockers can be explained to the operator.
 */
export function getParticipantQuickActionState(
  participant: EventParticipantRow,
): ParticipantQuickActionState {
  return {
    ticket: participant.ticket.id
      ? { disabled: false }
      : { disabled: true, reason: 'Aucun billet attribué' },
    wave: participant.ticket.format === 'OPEN'
      ? { disabled: false }
      : { disabled: true, reason: 'Les inscriptions RANKED n’ont pas de SAS' },
  }
}
