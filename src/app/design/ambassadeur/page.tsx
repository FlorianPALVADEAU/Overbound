import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AmbassadorDashboard } from '@/components/ambassadors/AmbassadorDashboard'
import type { AmbassadorDashboardData } from '@/types/Ambassador'

// Reference render of the ambassador dashboard with fixed data, for the responsive checks
// (e2e/ambassador-dashboard.spec.ts) and design review. Local and preview only, 404 in production.
export const metadata: Metadata = {
  title: 'Design system : espace ambassadeur',
  robots: { index: false, follow: false },
}

const level = (reward_level: number, points_required: number, reward_name: string, description: string, kind: 'recognition' | 'discount' | 'merch' | 'bib' | 'perk') => ({
  reward_level,
  reward_name,
  points_required,
  description,
  badge_label: reward_name,
  kind,
})

const FIXTURE: AmbassadorDashboardData = {
  program: {
    levels: [
      level(1, 1, 'Badge Ambassadeur', 'Ton badge ambassadeur et ta place au classement.', 'recognition'),
      level(2, 3, '-50 % sur ton dossard', 'Un code de -50 % sur ton propre dossard.', 'discount'),
      level(3, 5, 'T-shirt Overbound', 'Un T-shirt Overbound, envoyé chez toi.', 'merch'),
      level(4, 8, 'Dossard Open offert', 'Un dossard Open offert, pour toi ou pour un ami.', 'bib'),
      level(5, 12, 'Mise en avant sur nos réseaux', 'Tu es mis en avant sur les réseaux sociaux d’Overbound.', 'recognition'),
      level(6, 20, 'Dossard Ranked offert', 'Un dossard Ranked offert, pour toi ou pour un ami.', 'bib'),
      level(7, 25, 'Pack média offert', 'Les photos et vidéos de l’événement, offertes.', 'perk'),
      level(8, 30, 'Ambassadeur Or', 'Le statut Ambassadeur Or, puis un dossard offert tous les 5 points.', 'recognition'),
    ],
    bonus: { base_points: 30, interval_points: 5, reward_name: 'Dossard offert' },
  },
  season_ends_at: '2027-12-31T22:59:59Z',
  code: 'ADA20',
  total_points: 6,
  points_breakdown: { open_count: 4, ranked_count: 1 },
  rewards: [
    { id: 'r1', reward_level: 1, reward_name: 'Badge Ambassadeur', kind: 'recognition', points_required: 1, status: 'fulfilled', program_year: 2027, earned_at: '2026-11-05T10:00:00Z', expires_at: '2027-12-31T22:59:59Z', claimed_at: '2026-11-06T10:00:00Z', fulfilled_at: '2026-11-07T10:00:00Z' },
    { id: 'r2', reward_level: 2, reward_name: '-50 % sur ton dossard', kind: 'discount', points_required: 3, status: 'earned', program_year: 2027, earned_at: '2026-11-12T10:00:00Z', expires_at: '2027-12-31T22:59:59Z', claimed_at: null, fulfilled_at: null },
    { id: 'r3', reward_level: 3, reward_name: 'T-shirt Overbound', kind: 'merch', points_required: 5, status: 'earned', program_year: 2027, earned_at: '2026-11-20T10:00:00Z', expires_at: '2027-12-31T22:59:59Z', claimed_at: null, fulfilled_at: null },
  ],
  next_reward: { reward_level: 4, reward_name: 'Dossard Open offert', points_required: 8, points_remaining: 2 },
  leaderboard: {
    total_ranked: 9,
    current_user_rank: 4,
    top: [
      { rank: 1, name: 'Alan T.', points: 21, is_current_user: false },
      { rank: 2, name: 'Grace H.', points: 14, is_current_user: false },
      { rank: 3, name: 'Linus T.', points: 9, is_current_user: false },
    ],
    chase: { name: 'Linus T.', points_to_pass: 4 },
  },
  recruits_table: [
    { id: 'a', name: 'Marie Dupont', signup_date: '2026-11-20T10:00:00Z', race_format: 'ranked', payment_status: 'paid', points: 2, points_status: 'counted', order_id: 'o1' },
    { id: 'b', name: 'Thomas Bernard', signup_date: '2026-11-18T10:00:00Z', race_format: 'open', payment_status: 'paid', points: 1, points_status: 'counted', order_id: 'o2' },
    { id: 'c', name: 'Camille Petit', signup_date: '2026-11-15T10:00:00Z', race_format: 'open', payment_status: 'refunded', points: 0, points_status: 'revoked', order_id: 'o3' },
    { id: 'd', name: 'Nicolas Moreau', signup_date: '2026-11-14T10:00:00Z', race_format: 'open', payment_status: 'pending', points: 0, points_status: 'none', order_id: 'o4' },
    { id: 'e', name: 'Julie Roux', signup_date: '2026-11-10T10:00:00Z', race_format: 'open', payment_status: 'paid', points: 1, points_status: 'counted', order_id: 'o5' },
    { id: 'f', name: 'Hugo Girard', signup_date: '2026-11-08T10:00:00Z', race_format: 'open', payment_status: 'paid', points: 1, points_status: 'counted', order_id: 'o6' },
  ],
  previous_edition: {
    label: 'Édition 2026',
    total_points: 14,
    rewards: [{ id: 'old', reward_name: 'Dossard Open offert', kind: 'bib', status: 'fulfilled' }],
  },
}

export default function AmbassadorDashboardDesignPage() {
  if (process.env.VERCEL_ENV === 'production') notFound()
  return <AmbassadorDashboard fullName="Ada Lovelace" data={FIXTURE} adminView />
}
