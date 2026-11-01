import { describe, expect, it } from 'vitest'
import { buildLeaderboard } from './leaderboard'

const entry = (id: string, name: string | null, points: number) => ({
  ambassador_id: id,
  profile_id: `profile-${id}`,
  full_name: name,
  points,
})

describe('buildLeaderboard', () => {
  it('ranks by points and finds the current ambassador', () => {
    const board = buildLeaderboard([entry('a', 'Ada Lovelace', 5), entry('b', 'Alan Turing', 9)], 'a')
    expect(board.top.map((row) => row.name)).toEqual(['Alan T.', 'Ada L.'])
    expect(board).toMatchObject({ current_user_rank: 2, total_ranked: 2 })
    expect(board.top[1].is_current_user).toBe(true)
  })

  it('breaks ties by name so the order is stable', () => {
    const board = buildLeaderboard([entry('b', 'Zoe Z', 3), entry('a', 'Anna A', 3)], 'b')
    expect(board.top.map((row) => row.name)).toEqual(['Anna A.', 'Zoe Z.'])
  })

  it('keeps three rows but ranks everyone with points', () => {
    const entries = Array.from({ length: 12 }, (_, index) => entry(String(index), `Name${index} X`, index + 1))
    const board = buildLeaderboard(entries, '0')
    expect(board.top).toHaveLength(3)
    expect(board).toMatchObject({ total_ranked: 12, current_user_rank: 12 })
  })

  it('does not rank ambassadors without points', () => {
    const board = buildLeaderboard([entry('a', 'Ada L', 0), entry('b', 'Alan T', 4)], 'a')
    expect(board).toMatchObject({ total_ranked: 1, current_user_rank: null, chase: null })
  })

  it('has no rank when the viewer is not an active ambassador', () => {
    expect(buildLeaderboard([entry('a', 'Ada L', 1)], 'unknown').current_user_rank).toBeNull()
  })

  it('tells how many points pass the ambassador above', () => {
    const board = buildLeaderboard([entry('a', 'Ada Lovelace', 5), entry('b', 'Alan Turing', 9)], 'a')
    expect(board.chase).toEqual({ name: 'Alan T.', points_to_pass: 5 })
  })

  it('needs one point more than a tie to pass', () => {
    const board = buildLeaderboard([entry('a', 'Zoe Z', 4), entry('b', 'Anna A', 4)], 'a')
    expect(board.chase).toEqual({ name: 'Anna A.', points_to_pass: 1 })
  })

  it('has nobody to chase for the leader', () => {
    expect(buildLeaderboard([entry('a', 'Ada L', 9), entry('b', 'Alan T', 2)], 'a').chase).toBeNull()
  })
})
