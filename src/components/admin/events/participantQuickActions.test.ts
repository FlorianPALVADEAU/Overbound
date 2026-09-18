import { describe, expect, it } from 'vitest'
import type { EventParticipantRow } from '@/app/api/admin/events/participantsQueries'
import { getParticipantQuickActionState } from './participantQuickActions'

const participant = (format: 'OPEN' | 'RANKED', ticketId: string | null = 'ticket-1'): EventParticipantRow => ({
  id: 'registration-1',
  participant: { name: 'Ada', email: 'ada@example.com', accountStatus: 'claimed' },
  registration: { claimStatus: null, approvalStatus: 'approved', checkedIn: false, createdAt: '2026-09-15T10:00:00Z' },
  ticket: { id: ticketId, name: 'Trail', format },
  departure: { startTime: null, waveIndex: null },
  group: null,
  payment: null,
})

describe('getParticipantQuickActionState', () => {
  it('keeps ticket preview available and disables SAS for RANKED', () => {
    const state = getParticipantQuickActionState(participant('RANKED'))

    expect(state.ticket.disabled).toBe(false)
    expect(state.wave).toEqual({ disabled: true, reason: 'Les inscriptions RANKED n’ont pas de SAS' })
  })

  it('disables ticket preview when the registration has no ticket', () => {
    const state = getParticipantQuickActionState(participant('OPEN', null))

    expect(state.ticket).toEqual({ disabled: true, reason: 'Aucun billet attribué' })
    expect(state.wave.disabled).toBe(false)
  })
})
