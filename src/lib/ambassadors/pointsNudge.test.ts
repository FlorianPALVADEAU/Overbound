import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AmbassadorProgramRules } from '@/types/Ambassador'

const { sendNudgeMock, loadSeasonMock, loadRulesMock } = vi.hoisted(() => ({
  sendNudgeMock: vi.fn(),
  loadSeasonMock: vi.fn(),
  loadRulesMock: vi.fn(),
}))
vi.mock('@/lib/ambassadors/email', () => ({ sendAmbassadorPointsNudgeEmail: sendNudgeMock }))
vi.mock('@/lib/ambassadors/season', () => ({ loadCurrentSeason: loadSeasonMock }))
vi.mock('@/lib/ambassadors/programRules', () => ({ loadProgramRules: loadRulesMock }))

import { getNudgeGoal, nudgeAmbassadorNearGoal } from './pointsNudge'

const program: AmbassadorProgramRules = {
  levels: [
    { reward_level: 1, reward_name: 'Badge', points_required: 1, description: '', badge_label: '', kind: 'recognition' },
    { reward_level: 2, reward_name: 'Dossard Open offert', points_required: 8, description: '', badge_label: '', kind: 'bib' },
  ],
  bonus: null,
}

describe('getNudgeGoal', () => {
  it('nudges within two points of the next goal', () => {
    expect(getNudgeGoal(program, 6)).toMatchObject({ name: 'Dossard Open offert', pointsRemaining: 2 })
    expect(getNudgeGoal(program, 7)).toMatchObject({ pointsRemaining: 1 })
  })

  it('stays quiet when the goal is further away or the ladder is done', () => {
    expect(getNudgeGoal(program, 3)).toBeNull()
    expect(getNudgeGoal(program, 8)).toBeNull()
  })
})

interface Fixture {
  totalPoints: number
  alreadySent?: boolean
  email?: string | null
}

function createAdmin({ totalPoints, alreadySent = false, email = 'ada@example.com' }: Fixture) {
  const deleted: unknown[] = []
  const upserts: unknown[] = []
  const chain = (data: unknown) => {
    const builder: Record<string, unknown> = {}
    for (const name of ['select', 'eq']) builder[name] = () => builder
    builder.maybeSingle = async () => ({ data })
    return builder
  }
  const admin = {
    from(table: string) {
      if (table === 'ambassadors') return chain({ id: 'amb-1', profile_id: 'profile-1' })
      if (table === 'ambassador_points_years') return chain({ total_points: totalPoints })
      if (table === 'profiles') return chain({ full_name: 'Ada Lovelace' })
      if (table === 'ambassador_promotional_codes') return chain({ promotional_code: { code: 'ADA20' } })
      return {
        upsert: (row: unknown) => {
          upserts.push(row)
          return { select: async () => ({ data: alreadySent ? [] : [{ points_required: 8 }], error: null }) }
        },
        delete: () => {
          const builder: Record<string, unknown> = {}
          builder.eq = (...args: unknown[]) => {
            deleted.push(args)
            return builder
          }
          return builder
        },
      }
    },
    auth: { admin: { getUserById: async () => ({ data: { user: { email } } }) } },
  }
  return { admin: admin as never, deleted, upserts }
}

describe('nudgeAmbassadorNearGoal', () => {
  beforeEach(() => {
    sendNudgeMock.mockReset().mockResolvedValue(undefined)
    loadSeasonMock.mockReset().mockResolvedValue({ season: 2027, startedAt: '', endsAt: null })
    loadRulesMock.mockReset().mockResolvedValue(program)
  })

  it('emails an ambassador two points from a goal and records the nudge', async () => {
    const { admin, upserts } = createAdmin({ totalPoints: 6 })
    await nudgeAmbassadorNearGoal(admin, 'amb-1')

    expect(upserts).toEqual([{ ambassador_id: 'amb-1', season: 2027, points_required: 8 }])
    expect(sendNudgeMock).toHaveBeenCalledWith({
      to: 'ada@example.com',
      fullName: 'Ada Lovelace',
      ambassadorCode: 'ADA20',
      goalName: 'Dossard Open offert',
      pointsRemaining: 2,
    })
  })

  it('sends nothing when the ambassador is too far from the goal', async () => {
    const { admin } = createAdmin({ totalPoints: 3 })
    await nudgeAmbassadorNearGoal(admin, 'amb-1')
    expect(sendNudgeMock).not.toHaveBeenCalled()
  })

  it('sends the same nudge only once', async () => {
    const { admin } = createAdmin({ totalPoints: 6, alreadySent: true })
    await nudgeAmbassadorNearGoal(admin, 'amb-1')
    expect(sendNudgeMock).not.toHaveBeenCalled()
  })

  it('releases the nudge when the email fails so a retry can resend', async () => {
    sendNudgeMock.mockRejectedValue(new Error('Resend down'))
    const { admin, deleted } = createAdmin({ totalPoints: 6 })

    await expect(nudgeAmbassadorNearGoal(admin, 'amb-1')).rejects.toThrow('Resend down')
    expect(deleted.length).toBeGreaterThan(0)
  })

  it('releases the nudge when the ambassador has no email', async () => {
    const { admin, deleted } = createAdmin({ totalPoints: 6, email: null })
    await nudgeAmbassadorNearGoal(admin, 'amb-1')

    expect(sendNudgeMock).not.toHaveBeenCalled()
    expect(deleted.length).toBeGreaterThan(0)
  })
})
