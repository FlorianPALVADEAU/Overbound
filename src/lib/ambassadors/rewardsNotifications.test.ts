import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendAmbassadorRewardEarnedEmailMock } = vi.hoisted(() => ({
  sendAmbassadorRewardEarnedEmailMock: vi.fn(),
}))

vi.mock('@/lib/ambassadors/email', () => ({
  sendAmbassadorRewardEarnedEmail: sendAmbassadorRewardEarnedEmailMock,
}))

import { notifyAmbassadorRewardsForOrder } from './rewardsNotifications'

interface FakeAdminOptions {
  registration?: { promotional_code_id: string | null } | null
  ambassador?: {
    id: string
    profile_id: string
    promo: { code: string } | { code: string }[] | null
  } | null
  rewards?: Array<{ id: string; reward_level: number; reward_name: string }> | null
  profile?: { full_name: string | null } | null
  authUserEmail?: string | null
}

function createFakeAdmin(options: FakeAdminOptions) {
  const state = {
    updatedRewardIds: null as string[] | null,
  }

  const admin = {
    from(table: string) {
      if (table === 'registrations') {
        return {
          select() {
            return {
              eq() {
                return {
                  not() {
                    return {
                      limit() {
                        return {
                          maybeSingle: async () => ({ data: options.registration ?? null }),
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

      if (table === 'ambassadors') {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      maybeSingle: async () => ({ data: options.ambassador ?? null }),
                    }
                  },
                }
              },
            }
          },
        }
      }

      if (table === 'ambassador_rewards') {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      is: async () => ({ data: options.rewards ?? null }),
                    }
                  },
                }
              },
            }
          },
          update(payload: Record<string, unknown>) {
            return {
              in: (_column: string, ids: string[]) => {
                state.updatedRewardIds = ids
                return Promise.resolve({ error: null })
              },
            }
          },
        }
      }

      if (table === 'profiles') {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({ data: options.profile ?? null }),
                }
              },
            }
          },
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    },
    auth: {
      admin: {
        getUserById: async () => ({
          data: {
            user: options.authUserEmail ? { email: options.authUserEmail } : null,
          },
        }),
      },
    },
  }

  return { admin, state }
}

describe('notifyAmbassadorRewardsForOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sendAmbassadorRewardEarnedEmailMock.mockResolvedValue(undefined)
  })

  it('sends the reward email and marks rewards as notified when an active ambassador earned unnotified rewards', async () => {
    const { admin, state } = createFakeAdmin({
      registration: { promotional_code_id: 'promo-1' },
      ambassador: { id: 'amb-1', profile_id: 'user-1', promo: { code: 'ALICE10' } },
      rewards: [
        { id: 'reward-1', reward_level: 3, reward_name: 'Réduction 50%' },
      ],
      profile: { full_name: 'Alice Martin' },
      authUserEmail: 'alice@example.com',
    })

    await notifyAmbassadorRewardsForOrder(admin as any, 'order-1')

    expect(sendAmbassadorRewardEarnedEmailMock).toHaveBeenCalledTimes(1)
    expect(sendAmbassadorRewardEarnedEmailMock).toHaveBeenCalledWith({
      to: 'alice@example.com',
      fullName: 'Alice Martin',
      ambassadorCode: 'ALICE10',
      rewards: [{ reward_level: 3, reward_name: 'Réduction 50%' }],
    })
    expect(state.updatedRewardIds).toEqual(['reward-1'])
  })

  it('unwraps the promo when Supabase returns it as an array (join shape)', async () => {
    const { admin } = createFakeAdmin({
      registration: { promotional_code_id: 'promo-1' },
      ambassador: { id: 'amb-1', profile_id: 'user-1', promo: [{ code: 'BOB20' }] },
      rewards: [{ id: 'reward-2', reward_level: 1, reward_name: 'Badge ambassadeur' }],
      profile: { full_name: 'Bob' },
      authUserEmail: 'bob@example.com',
    })

    await notifyAmbassadorRewardsForOrder(admin as any, 'order-2')

    expect(sendAmbassadorRewardEarnedEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ ambassadorCode: 'BOB20' }),
    )
  })

  it('does nothing when the order registration has no promotional code', async () => {
    const { admin } = createFakeAdmin({ registration: null })

    await notifyAmbassadorRewardsForOrder(admin as any, 'order-3')

    expect(sendAmbassadorRewardEarnedEmailMock).not.toHaveBeenCalled()
  })

  it('does nothing when there is no active ambassador for the promotional code', async () => {
    const { admin } = createFakeAdmin({
      registration: { promotional_code_id: 'promo-1' },
      ambassador: null,
    })

    await notifyAmbassadorRewardsForOrder(admin as any, 'order-4')

    expect(sendAmbassadorRewardEarnedEmailMock).not.toHaveBeenCalled()
  })

  it('does nothing when there are no unnotified earned rewards', async () => {
    const { admin } = createFakeAdmin({
      registration: { promotional_code_id: 'promo-1' },
      ambassador: { id: 'amb-1', profile_id: 'user-1', promo: { code: 'ALICE10' } },
      rewards: [],
    })

    await notifyAmbassadorRewardsForOrder(admin as any, 'order-5')

    expect(sendAmbassadorRewardEarnedEmailMock).not.toHaveBeenCalled()
  })

  it('does nothing when the ambassador profile has no resolvable email', async () => {
    const { admin } = createFakeAdmin({
      registration: { promotional_code_id: 'promo-1' },
      ambassador: { id: 'amb-1', profile_id: 'user-1', promo: { code: 'ALICE10' } },
      rewards: [{ id: 'reward-1', reward_level: 3, reward_name: 'Réduction 50%' }],
      profile: { full_name: 'Alice Martin' },
      authUserEmail: null,
    })

    await notifyAmbassadorRewardsForOrder(admin as any, 'order-6')

    expect(sendAmbassadorRewardEarnedEmailMock).not.toHaveBeenCalled()
  })
})
