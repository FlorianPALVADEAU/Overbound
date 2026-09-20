import { describe, expect, it } from 'vitest'
import { resolveGroupAnchorFromProfile } from '@/lib/groups/resolveGroupAnchor'
import { syncOpenRegistrationsToWave } from '@/lib/groups/syncOpenGroupWave'

type RegistrationRow = {
  id: string
  user_id: string
  event_id: string
  wave_index: number | null
  start_time: string | null
  created_at?: string
  ticket?: any
}

class Query {
  private readonly admin: FakeAdmin
  private readonly table: string
  private action: 'select' | 'update' = 'select'
  private filters: Array<{ op: 'eq' | 'in'; key: string; value: any }> = []
  private updatePayload: Record<string, any> | null = null

  constructor(admin: FakeAdmin, table: string) {
    this.admin = admin
    this.table = table
  }

  select() {
    this.action = 'select'
    return this
  }

  update(payload: Record<string, any>) {
    this.action = 'update'
    this.updatePayload = payload
    return this
  }

  eq(key: string, value: any) {
    this.filters.push({ op: 'eq', key, value })
    return this
  }

  in(key: string, value: any[]) {
    this.filters.push({ op: 'in', key, value })
    return this
  }

  not() {
    return this
  }

  order() {
    return this
  }

  maybeSingle() {
    return this
  }

  then(resolve: (value: any) => void, reject?: (reason?: any) => void) {
    try {
      resolve(this.admin.execute(this.table, this.action, this.filters, this.updatePayload))
    } catch (error) {
      reject?.(error)
    }
  }
}

class FakeAdmin {
  registrations: RegistrationRow[] = []
  eventWaveUpdates: Array<{ event_id: string; wave_index: number; assigned_count: number }> = []
  rpcCalls: Array<{ registrationId: string; waveIndex: number }> = []

  from(table: string) {
    return new Query(this, table)
  }

  async rpc(_name: string, params: { p_registration_id: string; p_wave_index: number }) {
    this.rpcCalls.push({ registrationId: params.p_registration_id, waveIndex: params.p_wave_index })
    this.registrations = this.registrations.map((row) =>
      row.id === params.p_registration_id ? { ...row, wave_index: params.p_wave_index } : row,
    )
    return { data: {}, error: null }
  }

  execute(
    table: string,
    action: 'select' | 'update',
    filters: Array<{ op: 'eq' | 'in'; key: string; value: any }>,
    updatePayload: Record<string, any> | null,
  ) {
    if (table === 'registrations' && action === 'select') {
      const rows = this.registrations.filter((row) => {
        for (const filter of filters) {
          if (filter.op === 'eq' && (row as any)[filter.key] !== filter.value) return false
          if (filter.op === 'in' && !filter.value.includes((row as any)[filter.key])) return false
        }
        return true
      })

      const isCountQuery = filters.some((filter) => filter.key === 'wave_index')
      if (isCountQuery) {
        return { count: rows.length, data: null, error: null }
      }
      return { data: rows, error: null }
    }

    if (table === 'registrations' && action === 'update' && updatePayload) {
      const idFilter = filters.find((filter) => filter.key === 'id' && filter.op === 'eq')
      if (!idFilter) return { error: null }

      this.registrations = this.registrations.map((row) =>
        row.id === idFilter.value ? { ...row, ...updatePayload } : row,
      )
      return { error: null }
    }

    if (table === 'event_waves' && action === 'update' && updatePayload) {
      const eventId = filters.find((filter) => filter.key === 'event_id')?.value
      const waveIndex = filters.find((filter) => filter.key === 'wave_index')?.value
      if (eventId && typeof waveIndex === 'number') {
        this.eventWaveUpdates.push({
          event_id: eventId,
          wave_index: waveIndex,
          assigned_count: updatePayload.assigned_count,
        })
      }
      return { error: null }
    }

    throw new Error(`Unhandled query: ${table}.${action}`)
  }
}

describe('resolveGroupAnchorFromProfile', () => {
  it('returns the latest anchor from a wave-enabled ticket', async () => {
    const admin = new FakeAdmin()
    admin.registrations = [
      {
        id: 'r-ranked',
        user_id: 'u1',
        event_id: 'e1',
        wave_index: 3,
        start_time: '2026-05-01T08:30:00.000Z',
        created_at: '2026-05-02T10:00:00.000Z',
        ticket: { operations_config: { departure_mode: 'fixed' } },
      },
      {
        id: 'r-open',
        user_id: 'u1',
        event_id: 'e2',
        wave_index: 1,
        start_time: '2026-05-01T08:00:00.000Z',
        created_at: '2026-05-01T09:00:00.000Z',
        ticket: { operations_config: { departure_mode: 'wave' } },
      },
    ]

    const anchor = await resolveGroupAnchorFromProfile(admin as any, 'u1')
    expect(anchor).toEqual({
      eventId: 'e2',
      waveIndex: 1,
      startTime: '2026-05-01T08:00:00.000Z',
    })
  })

  it('returns null when no wave-enabled registration exists', async () => {
    const admin = new FakeAdmin()
    admin.registrations = [
      {
        id: 'r1',
        user_id: 'u1',
        event_id: 'e1',
        wave_index: 3,
        start_time: '2026-05-01T08:30:00.000Z',
        ticket: { operations_config: { departure_mode: 'fixed' } },
      },
    ]

    const anchor = await resolveGroupAnchorFromProfile(admin as any, 'u1')
    expect(anchor).toBeNull()
  })
})

describe('syncOpenRegistrationsToWave', () => {
  it('moves only wave-enabled registrations through the ticket-scoped RPC', async () => {
    const admin = new FakeAdmin()
    admin.registrations = [
      {
        id: 'open-to-move',
        user_id: 'u1',
        event_id: 'event-1',
        wave_index: 2,
        start_time: '2026-06-01T08:10:00.000Z',
        ticket: { operations_config: { departure_mode: 'wave' } },
      },
      {
        id: 'open-already-target',
        user_id: 'u2',
        event_id: 'event-1',
        wave_index: 1,
        start_time: '2026-06-01T08:00:00.000Z',
        ticket: { operations_config: { departure_mode: 'wave' } },
      },
      {
        id: 'ranked-untouched',
        user_id: 'u1',
        event_id: 'event-1',
        wave_index: 3,
        start_time: '2026-06-01T08:00:00.000Z',
        ticket: { operations_config: { departure_mode: 'fixed' } },
      },
    ]

    const result = await syncOpenRegistrationsToWave({
      admin: admin as any,
      eventId: 'event-1',
      waveIndex: 1,
      profileIds: ['u1', 'u2'],
    })

    expect(result).toEqual({ moved: 1, waveRegistrations: 2 })

    const moved = admin.registrations.find((row) => row.id === 'open-to-move')
    expect(moved?.wave_index).toBe(1)
    const ranked = admin.registrations.find((row) => row.id === 'ranked-untouched')
    expect(ranked?.wave_index).toBe(3)
    expect(admin.rpcCalls).toEqual([{ registrationId: 'open-to-move', waveIndex: 1 }])
  })
})
