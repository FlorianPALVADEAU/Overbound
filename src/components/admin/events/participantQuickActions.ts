import type { EventParticipantRow } from '@/app/api/admin/events/participantsQueries'

export type ParticipantPreviewAction = 'ticket' | 'wave'

export type ParticipantQuickActionState = {
  ticket: { disabled: boolean; reason?: string }
  wave: { disabled: boolean; reason?: string }
}

/**
 * A SAS action is available only when the current ticket supports waves.
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
      : { disabled: true, reason: 'Ce billet ne gère pas de SAS' },
  }
}
