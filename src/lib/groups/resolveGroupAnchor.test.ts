import { describe, expect, it } from 'vitest'
import { resolveGroupAnchorFromProfile } from './resolveGroupAnchor'

type RegistrationRow = {
  event_id: string | null
  wave_index: number | null
  start_time: string | null
  created_at: string
  ticket: { name: string | null; race: { name: string | null } | null } | { name: string | null; race: { name: string | null } | null }[] | null
}

function createAdmin(rows: RegistrationRow[]) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                not() {
                  return {
                    not() {
                      return {
                        not() {
                          return {
                            order: async () => ({ data: rows, error: null }),
                          }
                        },
                      }
                    },
                  }
                },
              }
            },
          }
        },
      }
    },
  }
}

describe('resolveGroupAnchorFromProfile', () => {
  it('returns the first OPEN registration, skipping RANKED ones', async () => {
    const admin = createAdmin([
      {
        event_id: 'event-1',
        wave_index: null,
        start_time: '2026-09-12T08:00:00.000Z',
        created_at: '2026-06-02T10:00:00.000Z',
        ticket: { name: 'Fury RANKED', race: { name: 'Fury' } },
      },
      {
        event_id: 'event-1',
        wave_index: 3,
        start_time: '2026-09-12T10:20:00.000Z',
        created_at: '2026-06-01T09:00:00.000Z',
        ticket: { name: 'Primal OPEN', race: { name: 'Primal' } },
      },
    ])

    const result = await resolveGroupAnchorFromProfile(admin, 'profile-1')

    expect(result).toEqual({
      eventId: 'event-1',
      waveIndex: 3,
      startTime: '2026-09-12T10:20:00.000Z',
    })
  })

  it('returns null when the profile has no OPEN registration', async () => {
    const admin = createAdmin([
      {
        event_id: 'event-1',
        wave_index: null,
        start_time: '2026-09-12T08:00:00.000Z',
        created_at: '2026-06-02T10:00:00.000Z',
        ticket: { name: 'Fury RANKED', race: { name: 'Fury' } },
      },
    ])

    const result = await resolveGroupAnchorFromProfile(admin, 'profile-1')

    expect(result).toBeNull()
  })

  it('handles ticket/race relations returned as arrays (Supabase join shape)', async () => {
    const admin = createAdmin([
      {
        event_id: 'event-2',
        wave_index: 7,
        start_time: '2026-09-12T11:00:00.000Z',
        created_at: '2026-06-03T10:00:00.000Z',
        ticket: [{ name: 'Kids OPEN', race: [{ name: 'Kids' }] as any }],
      },
    ])

    const result = await resolveGroupAnchorFromProfile(admin, 'profile-2')

    expect(result).toEqual({
      eventId: 'event-2',
      waveIndex: 7,
      startTime: '2026-09-12T11:00:00.000Z',
    })
  })

  it('propagates the Supabase error instead of swallowing it', async () => {
    const admin = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  not() {
                    return {
                      not() {
                        return {
                          not() {
                            return {
                              order: async () => ({ data: null, error: new Error('db down') }),
                            }
                          },
                        }
                      },
                    }
                  },
                }
              },
            }
          },
        }
      },
    }

    await expect(resolveGroupAnchorFromProfile(admin, 'profile-1')).rejects.toThrow('db down')
  })
})
