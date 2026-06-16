import { describe, expect, it } from 'vitest'
import {
  assignOpenWaveToRegistration,
  buildOpenWaveRows,
  buildOpenWaveSchedule,
  getRankedStartTime,
} from './openSas'

const EVENT_DATE = '2026-09-12T00:00:00+02:00'

describe('openSas schedule', () => {
  it('builds 24 OPEN waves from 12:00 to 15:50 Paris time', () => {
    const schedule = buildOpenWaveSchedule(EVENT_DATE)

    expect(schedule.waveCount).toBe(24)
    expect(schedule.intervalMinutes).toBe(10)
    expect(schedule.firstDeparture.toISOString()).toBe('2026-09-12T10:00:00.000Z')
    expect(schedule.lastDeparture.toISOString()).toBe('2026-09-12T13:50:00.000Z')
  })

  it('builds event wave rows without changing wave order or capacity', () => {
    const { rows } = buildOpenWaveRows('event-1', EVENT_DATE)

    expect(rows).toHaveLength(24)
    expect(rows[0]).toMatchObject({
      event_id: 'event-1',
      wave_index: 1,
      start_time: '2026-09-12T10:00:00.000Z',
      capacity: 50,
    })
    expect(rows[23]).toMatchObject({
      wave_index: 24,
      start_time: '2026-09-12T13:50:00.000Z',
    })
  })

  it('sets the RANKED single start at 08:00 Paris time', () => {
    expect(getRankedStartTime(EVENT_DATE).toISOString()).toBe('2026-09-12T06:00:00.000Z')
  })
})

describe('assignOpenWaveToRegistration', () => {
  it('passes afternoon OPEN schedule and distance windows to the assignment RPC', async () => {
    const calls: Array<{ fn: string; params: Record<string, unknown> }> = []
    const admin = {
      rpc: async (fn: string, params: Record<string, unknown>) => {
        calls.push({ fn, params })
        return {
          data: {
            wave_index: 1,
            start_time: params.p_first_departure,
            wave_capacity: 50,
            wave_position: 1,
            assignment_constraint_breached: false,
          },
          error: null,
        }
      },
    }

    const assignment = await assignOpenWaveToRegistration({
      admin,
      eventId: 'event-1',
      registrationId: 'registration-1',
      eventDateIso: EVENT_DATE,
      ticketName: 'Ultra OPEN',
      raceName: 'OPEN',
      distanceIdealKm: 20,
      distanceMinKm: 20,
    })

    expect(assignment?.startTime).toBe('2026-09-12T10:00:00.000Z')
    expect(calls).toHaveLength(1)
    expect(calls[0].fn).toBe('assign_open_wave_to_registration')
    expect(calls[0].params).toMatchObject({
      p_event_id: 'event-1',
      p_registration_id: 'registration-1',
      p_first_departure: '2026-09-12T10:00:00.000Z',
      p_wave_count: 24,
      p_interval_minutes: 10,
      p_default_capacity: 50,
      p_preferred_start: '2026-09-12T10:00:00.000Z',
      p_preferred_end: '2026-09-12T11:30:00.000Z',
      p_latest_allowed: '2026-09-12T11:30:00.000Z',
    })
  })
})
