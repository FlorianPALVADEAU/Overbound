import { describe, expect, it } from 'vitest'
import type { EventParticipantRow } from '@/app/api/admin/events/participantsQueries'
import { getParticipantQuickActionState } from './participantQuickActions'

const participant = (departureMode: 'wave' | 'fixed', ticketId: string | null = 'ticket-1'): EventParticipantRow => ({
  id: 'registration-1',
  participant: { name: 'Ada', email: 'ada@example.com', accountStatus: 'claimed' },
  registration: { claimStatus: null, approvalStatus: 'approved', checkedIn: false, createdAt: '2026-09-15T10:00:00Z' },
  ticket: { id: ticketId, name: 'Trail', operations: { status: 'configured', departureMode } },
  departure: { startTime: null, waveIndex: null },
  group: null,
  payment: null,
})

describe('getParticipantQuickActionState', () => {
  it('keeps ticket preview available and disables SAS when the ticket does not manage waves', () => {
    const state = getParticipantQuickActionState(participant('fixed'))

    expect(state.ticket.disabled).toBe(false)
    expect(state.wave).toEqual({ disabled: true, reason: 'Ce billet ne permet pas de modifier le départ' })
  })

  it('disables ticket preview when the registration has no ticket', () => {
    const state = getParticipantQuickActionState(participant('wave', null))

    expect(state.ticket).toEqual({ disabled: true, reason: 'Aucun billet attribué' })
    expect(state.wave.disabled).toBe(false)
  })

  it('blocks every action on a cancelled and refunded bib', () => {
    const cancelled = participant('wave')
    cancelled.registration.cancelledAt = '2026-10-09T10:00:00Z'
    const state = getParticipantQuickActionState(cancelled)

    expect(state.ticket).toEqual({ disabled: true, reason: 'Billet annulé et remboursé' })
    expect(state.wave).toEqual({ disabled: true, reason: 'Billet annulé et remboursé' })
  })
})
