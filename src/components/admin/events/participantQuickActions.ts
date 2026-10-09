import type { EventParticipantRow } from '@/app/api/admin/events/participantsQueries'
import { supportsManualWaveChange } from '@/lib/tickets/operationsProfile'

export type ParticipantPreviewAction = 'ticket' | 'wave'

export type ParticipantQuickActionState = {
  ticket: { disabled: boolean; reason?: string }
  wave: { disabled: boolean; reason?: string }
}

/**
 * A SAS action is available only when the current ticket supports waves; nothing
 * can be changed on a cancelled (refunded) bib.
 */
export function getParticipantQuickActionState(
  participant: EventParticipantRow,
): ParticipantQuickActionState {
  if (participant.registration.cancelledAt) {
    const cancelled = { disabled: true, reason: 'Billet annulé et remboursé' }
    return { ticket: cancelled, wave: cancelled }
  }
  return {
    ticket: participant.ticket.id
      ? { disabled: false }
      : { disabled: true, reason: 'Aucun billet attribué' },
    wave: supportsManualWaveChange({
      status: participant.ticket.operations.status,
      departureMode: participant.ticket.operations.departureMode,
      departureChangePolicy: null,
    })
      ? { disabled: false }
      : { disabled: true, reason: participant.ticket.operations.status === 'unconfigured'
        ? 'Règles opérationnelles du billet à configurer'
        : 'Ce billet ne permet pas de modifier le départ' },
  }
}
