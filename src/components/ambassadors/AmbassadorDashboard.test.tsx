import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { AmbassadorDashboardData } from '@/types/Ambassador'
import { AmbassadorDashboard } from './AmbassadorDashboard'

const level = (reward_level: number, points_required: number, reward_name: string, kind: 'recognition' | 'bib' | 'discount' = 'bib') => ({
  reward_level,
  reward_name,
  points_required,
  description: `Description ${reward_name}`,
  badge_label: reward_name,
  kind,
})

const baseData: AmbassadorDashboardData = {
  season_ends_at: '2027-12-31T22:59:59Z',
  open_event_slug: 'ultra-arena-2027',
  program: {
    levels: [level(1, 1, 'Badge Ambassadeur', 'recognition'), level(2, 3, '-20 % sur ton dossard', 'discount'), level(3, 12, 'Dossard Open offert')],
    bonus: { base_points: 12, interval_points: 5, reward_name: 'Dossard offert' },
  },
  code: 'ADA20',
  total_points: 0,
  points_breakdown: { open_count: 0, ranked_count: 0 },
  rewards: [],
  next_reward: null,
  leaderboard: { total_ranked: 0, current_user_rank: null, top: [], chase: null },
  recruits_table: [],
  previous_edition: null,
}

describe('AmbassadorDashboard', () => {
  it('guides a new ambassador to the first point', () => {
    render(<AmbassadorDashboard profile={{ first_name: 'Ada', last_name: 'Lovelace' }} data={baseData} adminView />)

    expect(screen.getByRole('heading', { name: /salut ada/i })).toBeTruthy()
    expect(screen.getByText('Prochain palier')).toBeTruthy()
    expect(screen.getAllByText('Badge Ambassadeur').length).toBeGreaterThan(0)
    expect(screen.getByText(/encore 1 point/i)).toBeTruthy()
    expect(screen.getByText(/aucune inscription avec ton code/i)).toBeTruthy()
  })

  it('shows the claim button for an earned reward and the rank to beat', () => {
    const data: AmbassadorDashboardData = {
      ...baseData,
      total_points: 3,
      rewards: [
        {
          id: 'r2',
          reward_level: 2,
          reward_name: '-20 % sur ton dossard',
          kind: 'discount',
          points_required: 3,
          status: 'earned',
          program_year: 2027,
          earned_at: '2026-11-05T10:00:00Z',
          expires_at: '2027-12-31T22:59:59Z',
          claimed_at: null,
          fulfilled_at: null,
        },
      ],
      leaderboard: {
        total_ranked: 2,
        current_user_rank: 2,
        top: [
          { rank: 1, name: 'Alan T.', points: 9, is_current_user: false },
          { rank: 2, name: 'Ada L.', points: 3, is_current_user: true },
        ],
        chase: { name: 'Alan T.', points_to_pass: 7 },
      },
    }
    render(<AmbassadorDashboard profile={{ first_name: 'Ada', last_name: 'Lovelace' }} data={data} adminView />)

    expect(screen.getByRole('button', { name: 'Réclamer' })).toBeTruthy()
    expect(screen.getByText(/pour passer devant alan t\. : encore 7 points/i)).toBeTruthy()
    expect(screen.getByText('2e au classement')).toBeTruthy()
    expect(screen.getByText(/à réclamer avant le 31 décembre 2027/i)).toBeTruthy()
  })

  it('lists the previous edition as read only history', () => {
    const data: AmbassadorDashboardData = {
      ...baseData,
      previous_edition: {
        label: 'Édition 2026',
        total_points: 14,
        rewards: [{ id: 'old', reward_name: 'Dossard Open offert', kind: 'bib', status: 'fulfilled' }],
      },
    }
    render(<AmbassadorDashboard data={data} adminView />)

    expect(screen.getByText('Édition 2026')).toBeTruthy()
    fireEvent.click(screen.getByText('Édition 2026'))
    expect(screen.getAllByText('Dossard Open offert').length).toBeGreaterThan(0)
  })
})
