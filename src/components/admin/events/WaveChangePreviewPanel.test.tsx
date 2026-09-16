import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { useAdminEventWavesMock } = vi.hoisted(() => ({ useAdminEventWavesMock: vi.fn() }))

vi.mock('@/app/api/admin/events/eventsQueries', () => ({
  useAdminEventWaves: useAdminEventWavesMock,
}))

import { WaveChangePreviewPanel } from './WaveChangePreviewPanel'
import type { EventParticipantRow } from '@/app/api/admin/events/participantsQueries'

const participant = (format: 'OPEN' | 'RANKED'): EventParticipantRow => ({
  id: 'registration-1',
  participant: { name: 'Ada', email: 'ada@example.com', accountStatus: 'claimed' },
  registration: { claimStatus: null, approvalStatus: 'approved', checkedIn: false, createdAt: '2026-09-15T10:00:00Z' },
  ticket: { id: 'ticket-1', name: `Trail ${format}`, format },
  departure: { startTime: '2026-09-20T12:10:00Z', waveIndex: format === 'OPEN' ? 2 : null },
  group: null,
  payment: null,
})

describe('WaveChangePreviewPanel', () => {
  beforeEach(() => useAdminEventWavesMock.mockReturnValue({ data: [], isLoading: false }))

  it('explains that RANKED registrations have no SAS action', () => {
    render(<WaveChangePreviewPanel eventId="event-1" participant={participant('RANKED')} />)

    expect(screen.getByText('Le changement de SAS concerne uniquement les inscriptions OPEN.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Prévisualiser' })).not.toBeInTheDocument()
  })

  it('offers target SAS choices for an OPEN registration', () => {
    useAdminEventWavesMock.mockReturnValue({
      data: [{ wave_index: 4, start_time: '2026-09-20T12:30:00Z', capacity: 50, assigned_count: 12, is_closed: false }],
      isLoading: false,
    })

    render(<WaveChangePreviewPanel eventId="event-1" participant={participant('OPEN')} />)

    expect(screen.getByRole('combobox', { name: 'SAS cible' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Prévisualiser' })).toBeInTheDocument()
    expect(screen.getByText('Lecture seule : aucune inscription ni capacité ne sera modifiée.')).toBeInTheDocument()
  })
})
