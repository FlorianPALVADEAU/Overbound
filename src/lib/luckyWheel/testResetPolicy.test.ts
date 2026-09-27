import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isDevUnlimitedSpinEmail, resetLuckyWheelEntryForDevTesting } from './testResetPolicy'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('isDevUnlimitedSpinEmail', () => {
  it('returns true only for the exact email in development', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(isDevUnlimitedSpinEmail('florian.plvd@gmail.com')).toBe(true)
    expect(isDevUnlimitedSpinEmail('FLORIAN.PLVD@GMAIL.COM')).toBe(true)
    expect(isDevUnlimitedSpinEmail(' florian.plvd@gmail.com ')).toBe(true)
  })

  it('returns false for any other email, even in development', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(isDevUnlimitedSpinEmail('someone-else@example.com')).toBe(false)
  })

  it('returns false for the exempted email outside development', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(isDevUnlimitedSpinEmail('florian.plvd@gmail.com')).toBe(false)
  })
})

describe('resetLuckyWheelEntryForDevTesting', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('does nothing when there is no prior entry', async () => {
    const admin = {
      from: (table: string) => {
        if (table === 'lucky_wheel_entries') {
          return { select: () => ({ eq: () => ({ eq: async () => ({ data: [], error: null }) }) }) }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }

    await expect(
      resetLuckyWheelEntryForDevTesting({ admin, campaignId: 'campaign-1', email: 'x@example.com' }),
    ).resolves.toBeUndefined()
  })

  it('deletes allocations before the entry to respect the FK (no cascade)', async () => {
    const calls: string[] = []
    const admin = {
      from: (table: string) => {
        if (table === 'lucky_wheel_entries') {
          return {
            select: () => ({
              eq: () => ({ eq: async () => ({ data: [{ id: 'entry-1' }], error: null }) }),
            }),
            delete: () => {
              calls.push('delete entries')
              return { in: async () => ({ error: null }) }
            },
          }
        }
        if (table === 'lucky_wheel_reward_allocations') {
          return {
            delete: () => {
              calls.push('delete allocations')
              return { in: async () => ({ error: null }) }
            },
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }

    await resetLuckyWheelEntryForDevTesting({ admin, campaignId: 'campaign-1', email: 'florian.plvd@gmail.com' })

    expect(calls).toEqual(['delete allocations', 'delete entries'])
  })

  it('propagates an error if the allocation delete fails', async () => {
    const admin = {
      from: (table: string) => {
        if (table === 'lucky_wheel_entries') {
          return {
            select: () => ({
              eq: () => ({ eq: async () => ({ data: [{ id: 'entry-1' }], error: null }) }),
            }),
          }
        }
        if (table === 'lucky_wheel_reward_allocations') {
          return { delete: () => ({ in: async () => ({ error: new Error('db down') }) }) }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }

    await expect(
      resetLuckyWheelEntryForDevTesting({ admin, campaignId: 'campaign-1', email: 'florian.plvd@gmail.com' }),
    ).rejects.toThrow('db down')
  })
})
