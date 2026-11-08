import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendAmbassadorRewardEarnedEmailMock } = vi.hoisted(() => ({
  sendAmbassadorRewardEarnedEmailMock: vi.fn(),
}))

vi.mock('@/lib/ambassadors/email', () => ({
  sendAmbassadorRewardEarnedEmail: sendAmbassadorRewardEarnedEmailMock,
}))

const { nudgeMock } = vi.hoisted(() => ({ nudgeMock: vi.fn() }))
vi.mock('@/lib/ambassadors/pointsNudge', () => ({ nudgeAmbassadorNearGoal: nudgeMock }))

import { notifyAmbassadorRewardsForOrder } from './rewardsNotifications'

interface Fixture {
  events?: Array<{ ambassador_id: string }>
  ambassadors?: Record<string, { id: string; profile_id: string } | null>
  rewards?: Record<string, Array<{ id: string; reward_level: number; reward_name: string }>>
  emails?: Record<string, string | null>
}

/** Chainable stand-in for Supabase queries; filters are recorded so tests can assert on them. */
function createAdmin(fixture: Fixture) {
  const filters: Record<string, Array<[string, unknown]>> = {}
  const updatedRewardIds: string[][] = []

  const query = (table: string, resolve: (eq: Map<string, unknown>) => unknown) => {
    const eq = new Map<string, unknown>()
    const builder: Record<string, unknown> = {}
    const record = (name: string) => (column: string, value?: unknown) => {
      ;(filters[table] ??= []).push([`${name}:${column}`, value])
      eq.set(column, value)
      return builder
    }
    for (const name of ['eq', 'is']) builder[name] = record(name)
    for (const name of ['select', 'gt', 'or', 'order']) builder[name] = () => builder
    builder.maybeSingle = async () => ({ data: resolve(eq) })
    builder.then = (done: (value: unknown) => unknown) => done({ data: resolve(eq) })
    return builder
  }

  const admin = {
    from(table: string) {
      if (table === 'ambassador_points_events') return { select: () => query(table, () => fixture.events ?? []) }
      if (table === 'ambassadors') return { select: () => query(table, (eq) => fixture.ambassadors?.[eq.get('id') as string] ?? null) }
      if (table === 'profiles') return { select: () => query(table, () => ({ first_name: 'Ada' })) }
      if (table === 'ambassador_promotional_codes') {
        return { select: () => query(table, () => ({ promotional_code: { code: 'ADA20' } })) }
      }
      if (table === 'ambassador_rewards') {
        return {
          select: () => query(table, (eq) => fixture.rewards?.[eq.get('ambassador_id') as string] ?? []),
          update: () => ({
            in: async (_column: string, ids: string[]) => {
              updatedRewardIds.push(ids)
              return { error: null }
            },
          }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
    auth: {
      admin: {
        getUserById: async (profileId: string) => ({ data: { user: { email: fixture.emails?.[profileId] ?? null } } }),
      },
    },
  }

  return { admin: admin as never, filters, updatedRewardIds }
}

const ada = { id: 'amb-1', profile_id: 'profile-1' }
const reward = { id: 'rw-1', reward_level: 4, reward_name: 'Dossard Open offert' }

describe('notifyAmbassadorRewardsForOrder', () => {
  beforeEach(() => {
    sendAmbassadorRewardEarnedEmailMock.mockReset()
    nudgeMock.mockReset().mockResolvedValue(undefined)
  })

  it('emails the ambassador credited by the order and marks the rewards notified', async () => {
    const { admin, updatedRewardIds } = createAdmin({
      events: [{ ambassador_id: 'amb-1' }, { ambassador_id: 'amb-1' }],
      ambassadors: { 'amb-1': ada },
      rewards: { 'amb-1': [reward] },
      emails: { 'profile-1': 'ada@example.com' },
    })

    await notifyAmbassadorRewardsForOrder(admin, 'order-1')

    expect(sendAmbassadorRewardEarnedEmailMock).toHaveBeenCalledTimes(1)
    expect(sendAmbassadorRewardEarnedEmailMock).toHaveBeenCalledWith({
      to: 'ada@example.com',
      firstName: 'Ada',
      ambassadorCode: 'ADA20',
      rewards: [{ reward_level: 4, reward_name: 'Dossard Open offert' }],
    })
    expect(updatedRewardIds).toEqual([['rw-1']])
  })

  it('reaches every ambassador an order credited, not only the first code found', async () => {
    const { admin } = createAdmin({
      events: [{ ambassador_id: 'amb-1' }, { ambassador_id: 'amb-2' }],
      ambassadors: { 'amb-1': ada, 'amb-2': { id: 'amb-2', profile_id: 'profile-2' } },
      rewards: { 'amb-1': [reward], 'amb-2': [{ id: 'rw-2', reward_level: 1, reward_name: 'Badge' }] },
      emails: { 'profile-1': 'ada@example.com', 'profile-2': 'alan@example.com' },
    })

    await notifyAmbassadorRewardsForOrder(admin, 'order-1')

    expect(sendAmbassadorRewardEarnedEmailMock.mock.calls.map(([payload]) => payload.to)).toEqual(['ada@example.com', 'alan@example.com'])
  })

  it('ignores revoked ledger events', async () => {
    const { admin, filters } = createAdmin({ events: [] })

    await notifyAmbassadorRewardsForOrder(admin, 'order-1')

    expect(filters.ambassador_points_events).toContainEqual(['is:revoked_at', null])
    expect(sendAmbassadorRewardEarnedEmailMock).not.toHaveBeenCalled()
  })

  it('does nothing when there is no unnotified earned reward', async () => {
    const { admin, updatedRewardIds } = createAdmin({
      events: [{ ambassador_id: 'amb-1' }],
      ambassadors: { 'amb-1': ada },
      rewards: { 'amb-1': [] },
      emails: { 'profile-1': 'ada@example.com' },
    })

    await notifyAmbassadorRewardsForOrder(admin, 'order-1')

    expect(sendAmbassadorRewardEarnedEmailMock).not.toHaveBeenCalled()
    expect(updatedRewardIds).toEqual([])
  })

  it('does nothing for an inactive ambassador', async () => {
    const { admin } = createAdmin({ events: [{ ambassador_id: 'amb-1' }], ambassadors: { 'amb-1': null }, rewards: { 'amb-1': [reward] } })

    await notifyAmbassadorRewardsForOrder(admin, 'order-1')

    expect(sendAmbassadorRewardEarnedEmailMock).not.toHaveBeenCalled()
  })

  it('keeps the rewards unnotified when the ambassador has no email', async () => {
    const { admin, updatedRewardIds } = createAdmin({
      events: [{ ambassador_id: 'amb-1' }],
      ambassadors: { 'amb-1': ada },
      rewards: { 'amb-1': [reward] },
      emails: { 'profile-1': null },
    })

    await notifyAmbassadorRewardsForOrder(admin, 'order-1')

    expect(sendAmbassadorRewardEarnedEmailMock).not.toHaveBeenCalled()
    expect(updatedRewardIds).toEqual([])
  })

  it('nudges the ambassador when no reward email went out', async () => {
    const { admin } = createAdmin({ events: [{ ambassador_id: 'amb-1' }], ambassadors: { 'amb-1': ada }, rewards: { 'amb-1': [] } })

    await notifyAmbassadorRewardsForOrder(admin, 'order-1')

    expect(nudgeMock).toHaveBeenCalledWith(admin, 'amb-1')
  })

  it('sends one email per order: no nudge after a reward email', async () => {
    const { admin } = createAdmin({
      events: [{ ambassador_id: 'amb-1' }],
      ambassadors: { 'amb-1': ada },
      rewards: { 'amb-1': [reward] },
      emails: { 'profile-1': 'ada@example.com' },
    })

    await notifyAmbassadorRewardsForOrder(admin, 'order-1')

    expect(nudgeMock).not.toHaveBeenCalled()
  })

  it('still credits the order when the nudge fails', async () => {
    nudgeMock.mockRejectedValue(new Error('boom'))
    const { admin } = createAdmin({ events: [{ ambassador_id: 'amb-1' }], ambassadors: { 'amb-1': ada }, rewards: { 'amb-1': [] } })

    await expect(notifyAmbassadorRewardsForOrder(admin, 'order-1')).resolves.toBeUndefined()
  })
})
