import { describe, expect, it } from 'vitest'
import { buildPreviousEdition, getPreviousSeason } from './previousEdition'

const levels = [
  { reward_level: 1, reward_name: 'Badge', points_required: 1, description: '', badge_label: '', kind: 'recognition' as const },
  { reward_level: 4, reward_name: 'Dossard Open offert', points_required: 5, description: '', badge_label: '', kind: 'bib' as const },
]

const reward = (id: string, reward_level: number, status: string, program_year = 2026) => ({
  id,
  program_year,
  reward_level,
  reward_name: `Palier ${reward_level}`,
  status,
})

describe('buildPreviousEdition', () => {
  it('is null for an ambassador who took part in no closed edition', () => {
    expect(buildPreviousEdition([], [], levels)).toBeNull()
  })

  it('keeps the final total and only the rewards that were claimed or delivered', () => {
    const edition = buildPreviousEdition(
      [{ season: 2026, total_points: 7 }],
      [reward('a', 1, 'fulfilled'), reward('b', 4, 'claimed'), reward('c', 5, 'cancelled')],
      levels,
    )
    expect(edition).toMatchObject({ label: 'Édition 2026', total_points: 7 })
    expect(edition?.rewards.map((item) => [item.id, item.kind, item.status])).toEqual([
      ['a', 'recognition', 'fulfilled'],
      ['b', 'bib', 'claimed'],
    ])
  })

  it('still shows the edition when only a reward remains', () => {
    expect(buildPreviousEdition([], [reward('a', 1, 'fulfilled')], levels)).toMatchObject({ total_points: 0 })
  })
})

describe('getPreviousSeason', () => {
  it('takes the latest closed season', () => {
    expect(getPreviousSeason([{ season: 2026, total_points: 1 }], [reward('a', 1, 'claimed', 2025)])).toBe(2026)
  })
})
