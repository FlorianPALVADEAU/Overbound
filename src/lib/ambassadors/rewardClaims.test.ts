import { describe, expect, it } from 'vitest'
import { claimAmbassadorReward, releaseAmbassadorRewardClaim } from './rewardClaims'

type Result = { data: unknown; error: unknown }

/** Chainable stand-in for a Supabase query: records every filter and answers terminal calls in order. */
function createAdmin(answers: Result[]) {
  const calls: Array<{ method: string; args: unknown[] }> = []
  const queue = [...answers]
  const builder: Record<string, unknown> = {}
  for (const method of ['update', 'select', 'eq', 'gt', 'is', 'or']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args })
      return builder
    }
  }
  builder.maybeSingle = async () => queue.shift() ?? { data: null, error: null }
  builder.then = (resolve: (value: Result) => unknown) => resolve(queue.shift() ?? { data: null, error: null })
  return { admin: { from: () => builder } as never, calls }
}

const reward = { id: 'r1', reward_level: 4, reward_name: 'Dossard Open offert', points_required: 5, status: 'claimed' }
const now = new Date('2026-11-01T10:00:00Z')

describe('claimAmbassadorReward', () => {
  it('claims an earned reward of the given season only', async () => {
    const { admin, calls } = createAdmin([{ data: reward, error: null }])
    const result = await claimAmbassadorReward(admin, { ambassadorId: 'a1', programYear: 2027, rewardLevel: 4, now })

    expect(result).toMatchObject({ ok: true, reward: { id: 'r1', status: 'claimed' } })
    const filters = calls.filter((c) => c.method === 'eq').map((c) => c.args)
    expect(filters).toContainEqual(['program_year', 2027])
    expect(filters).toContainEqual(['reward_level', 4])
    expect(filters).toContainEqual(['status', 'earned'])
    expect(calls).toContainEqual({ method: 'or', args: [`expires_at.is.null,expires_at.gt.${now.toISOString()}`] })
  })

  it('reports a reward that does not exist', async () => {
    const { admin } = createAdmin([{ data: null, error: null }, { data: null, error: null }])
    expect(await claimAmbassadorReward(admin, { ambassadorId: 'a1', programYear: 2027, rewardLevel: 4, now })).toEqual({
      ok: false,
      reason: 'NOT_FOUND',
    })
  })

  it('reports an earned reward whose season ended', async () => {
    const { admin } = createAdmin([{ data: null, error: null }, { data: { status: 'earned', expires_at: '2026-12-31T22:59:59Z' }, error: null }])
    expect(await claimAmbassadorReward(admin, { ambassadorId: 'a1', programYear: 2027, rewardLevel: 4, now })).toEqual({
      ok: false,
      reason: 'EXPIRED',
    })
  })

  it('refuses a second claim of an already claimed or cancelled reward', async () => {
    for (const status of ['claimed', 'fulfilled', 'cancelled']) {
      const { admin } = createAdmin([{ data: null, error: null }, { data: { status }, error: null }])
      expect(await claimAmbassadorReward(admin, { ambassadorId: 'a1', programYear: 2027, rewardLevel: 4, now })).toEqual({
        ok: false,
        reason: 'NOT_CLAIMABLE',
      })
    }
  })

  it('throws when the update fails', async () => {
    const { admin } = createAdmin([{ data: null, error: new Error('db down') }])
    await expect(claimAmbassadorReward(admin, { ambassadorId: 'a1', programYear: 2027, rewardLevel: 4, now })).rejects.toThrow('db down')
  })
})

describe('releaseAmbassadorRewardClaim', () => {
  it('only reverts a claim that is still claimed and not fulfilled', async () => {
    const { admin, calls } = createAdmin([{ data: null, error: null }])
    await releaseAmbassadorRewardClaim(admin, 'r1')
    expect(calls.filter((c) => c.method === 'eq').map((c) => c.args)).toEqual([['id', 'r1'], ['status', 'claimed']])
    expect(calls).toContainEqual({ method: 'is', args: ['fulfilled_at', null] })
  })
})
