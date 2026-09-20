import { describe, expect, it, vi } from 'vitest'
import {
  assignSelectedWaveToRegistration,
  syncRegistrationToGroupAnchor,
  SelectedWaveUnavailableError,
} from './selectedWaveAssignment'

const buildAdmin = (rpcImpl: (...args: any[]) => any) => ({
  rpc: vi.fn(rpcImpl),
})

describe('assignSelectedWaveToRegistration', () => {
  it('returns the assignment on success', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({
        data: { wave_index: 5, start_time: '2026-09-12T10:50:00Z', wave_capacity: 50, wave_position: 12 },
        error: null,
      }),
    )

    const result = await assignSelectedWaveToRegistration({
      admin,
      eventId: 'event-1',
      registrationId: 'reg-1',
      waveIndex: 5,
    })

    expect(result).toEqual({ waveIndex: 5, startTime: '2026-09-12T10:50:00Z', waveCapacity: 50, wavePosition: 12 })
    expect(admin.rpc).toHaveBeenCalledWith('assign_selected_wave_to_registration', {
      p_event_id: 'event-1',
      p_registration_id: 'reg-1',
      p_wave_index: 5,
    })
  })

  it('throws SelectedWaveUnavailableError when the RPC reports the wave is unavailable', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({ data: null, error: new Error('SELECTED_WAVE_UNAVAILABLE: wave 5 is full') }),
    )

    await expect(
      assignSelectedWaveToRegistration({ admin, eventId: 'event-1', registrationId: 'reg-1', waveIndex: 5 }),
    ).rejects.toBeInstanceOf(SelectedWaveUnavailableError)
  })

  it('rethrows unrelated RPC errors unchanged', async () => {
    const admin = buildAdmin(() => Promise.resolve({ data: null, error: new Error('connection reset') }))

    await expect(
      assignSelectedWaveToRegistration({ admin, eventId: 'event-1', registrationId: 'reg-1', waveIndex: 5 }),
    ).rejects.toThrow('connection reset')
  })
})

describe('syncRegistrationToGroupAnchor', () => {
  it('returns the anchor assignment on success', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({
        data: { wave_index: 3, start_time: '2026-09-12T10:30:00Z', wave_capacity: 50, wave_position: 4 },
        error: null,
      }),
    )

    const result = await syncRegistrationToGroupAnchor({
      admin,
      eventId: 'event-1',
      registrationId: 'reg-2',
      waveIndex: 3,
    })

    expect(result).toEqual({ waveIndex: 3, startTime: '2026-09-12T10:30:00Z', waveCapacity: 50, wavePosition: 4 })
    expect(admin.rpc).toHaveBeenCalledWith('sync_registration_to_group_anchor', {
      p_event_id: 'event-1',
      p_registration_id: 'reg-2',
      p_wave_index: 3,
    })
  })

  it('rethrows RPC errors unchanged (no unavailability translation — an anchor always applies)', async () => {
    const admin = buildAdmin(() => Promise.resolve({ data: null, error: new Error('GROUP_ANCHOR_WAVE_NOT_FOUND') }))

    await expect(
      syncRegistrationToGroupAnchor({ admin, eventId: 'event-1', registrationId: 'reg-2', waveIndex: 3 }),
    ).rejects.toThrow('GROUP_ANCHOR_WAVE_NOT_FOUND')
  })
})
