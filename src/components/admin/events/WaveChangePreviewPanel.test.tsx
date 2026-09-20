import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { useAdminEventWavesMock } = vi.hoisted(() => ({ useAdminEventWavesMock: vi.fn() }))

vi.mock('@/app/api/admin/events/eventsQueries', () => ({
  useAdminEventWaves: useAdminEventWavesMock,
}))

import { WaveChangePreviewPanel } from './WaveChangePreviewPanel'
import type { EventParticipantRow } from '@/app/api/admin/events/participantsQueries'

const participant = (departureMode: 'wave' | 'fixed'): EventParticipantRow => ({
  id: 'registration-1',
  participant: { name: 'Ada', email: 'ada@example.com', accountStatus: 'claimed' },
  registration: { claimStatus: null, approvalStatus: 'approved', checkedIn: false, createdAt: '2026-09-15T10:00:00Z' },
  ticket: { id: 'ticket-1', name: 'Trail', operations: { status: 'configured', departureMode } },
  departure: { startTime: '2026-09-20T12:10:00Z', waveIndex: departureMode === 'wave' ? 2 : null },
  group: null,
  payment: null,
})

describe('WaveChangePreviewPanel', () => {
  beforeEach(() => useAdminEventWavesMock.mockReturnValue({ data: [], isLoading: false }))

  it('explains that a ticket without wave management has no SAS action', () => {
    render(<WaveChangePreviewPanel eventId="event-1" participant={participant('fixed')} />)

    expect(screen.getByText('Ce billet ne permet pas de modifier le départ par SAS.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Prévisualiser' })).not.toBeInTheDocument()
  })

  it('offers target SAS choices when the ticket enables wave management', () => {
    useAdminEventWavesMock.mockReturnValue({
      data: [{ wave_index: 4, start_time: '2026-09-20T12:30:00Z', capacity: 50, assigned_count: 12, is_closed: false }],
      isLoading: false,
    })

    render(<WaveChangePreviewPanel eventId="event-1" participant={participant('wave')} />)

    expect(screen.getByRole('combobox', { name: 'SAS cible' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Prévisualiser' })).toBeInTheDocument()
    expect(screen.getByText('Lecture seule : aucune inscription ni capacité ne sera modifiée.')).toBeInTheDocument()
  })
})
