import { loadEnvConfig } from '@next/env'
import type { Page } from '@playwright/test'
import type { AmbassadorDashboardData, AmbassadorReward } from '@/types/Ambassador'
import { disableAutomaticPopups } from './popups'

// The ambassador dashboard reads the session and one dashboard API. Specs answer both with fixed
// data, so a run never depends on the database or on a real login.

export const CODE = 'ADA20'

const SEASON_ENDS_AT = '2027-12-31T22:59:59Z'

export const earnedReward = (overrides: Partial<AmbassadorReward> = {}): AmbassadorReward => ({
  id: 'reward-3',
  reward_level: 2,
  reward_name: '-50 % sur ton dossard',
  kind: 'discount',
  points_required: 3,
  status: 'earned',
  program_year: 2027,
  earned_at: '2026-11-12T10:00:00Z',
  expires_at: SEASON_ENDS_AT,
  claimed_at: null,
  fulfilled_at: null,
  ...overrides,
})

const level = (reward_level: number, points_required: number, reward_name: string, kind: 'recognition' | 'discount' | 'merch' | 'bib') => ({
  reward_level,
  reward_name,
  points_required,
  description: reward_name,
  badge_label: reward_name,
  kind,
})

export const dashboardData = (overrides: Partial<AmbassadorDashboardData> = {}): AmbassadorDashboardData => ({
  program: {
    levels: [
      level(1, 1, 'Badge Ambassadeur', 'recognition'),
      level(2, 3, '-50 % sur ton dossard', 'discount'),
      level(3, 5, 'T-shirt Overbound', 'merch'),
      level(4, 8, 'Dossard Open offert', 'bib'),
    ],
    bonus: { base_points: 30, interval_points: 5, reward_name: 'Dossard offert' },
  },
  season_ends_at: SEASON_ENDS_AT,
  code: CODE,
  total_points: 4,
  points_breakdown: { open_count: 3, ranked_count: 0 },
  rewards: [earnedReward()],
  next_reward: { reward_level: 3, reward_name: 'T-shirt Overbound', points_required: 5, points_remaining: 1 },
  leaderboard: { total_ranked: 0, current_user_rank: null, top: [], chase: null },
  recruits_table: [],
  previous_edition: null,
  ...overrides,
})

/**
 * The page asks Supabase for a local session before it calls /api/session, and treats "none" as a visitor.
 * A cookie in the format of @supabase/ssr, with a far-future expiry, is read without any network call.
 */
const signInLocally = async (page: Page, email: string) => {
  loadEnvConfig(process.cwd())
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required (.env.local)')

  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60
  const base64Url = (value: string) => Buffer.from(value).toString('base64url')
  const accessToken = [base64Url('{"alg":"HS256","typ":"JWT"}'), base64Url(JSON.stringify({ sub: 'amb-user', exp: expiresAt })), 'e2e'].join('.')
  const session = {
    access_token: accessToken,
    refresh_token: 'e2e-refresh',
    token_type: 'bearer',
    expires_in: 24 * 60 * 60,
    expires_at: expiresAt,
    user: { id: 'amb-user', aud: 'authenticated', role: 'authenticated', email, app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
  }
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  await page.context().addCookies([
    { name: `sb-${projectRef}-auth-token`, value: `base64-${base64Url(JSON.stringify(session))}`, domain: 'localhost', path: '/' },
  ])
}

export interface DashboardStub {
  /** Bodies sent to the claim API, in order. */
  claimBodies: () => unknown[]
  /** Replaces what the dashboard API answers from now on (the page refetches after a claim). */
  setData: (data: AmbassadorDashboardData) => void
}

interface StubOptions {
  role?: string | null
  email?: string
  data?: AmbassadorDashboardData
  /** Answer of the claim API. Defaults to a success. */
  claim?: { status: number; json: unknown }
}

/** A signed-in ambassador whose dashboard and claim API are answered by the spec. */
export const stubAmbassadorApis = async (page: Page, { role = 'ambassador', email = 'ada@example.com', data = dashboardData(), claim }: StubOptions = {}): Promise<DashboardStub> => {
  let current = data
  const claimBodies: unknown[] = []

  await signInLocally(page, email)
  await disableAutomaticPopups(page)
  await page.addInitScript(() => {
    window.localStorage.setItem('overbound-consent', JSON.stringify({ analytics: false, marketing: false, updatedAt: new Date().toISOString() }))
  })
  await page.route('**/api/session', (route) =>
    route.fulfill({
      json: { user: { id: 'amb-user', email }, profile: { full_name: 'Ada Lovelace', role }, alerts: null },
    }),
  )
  await page.route('**/api/ambassadors/dashboard', (route) => route.fulfill({ json: current }))
  await page.route('**/api/ambassadors/rewards/claim', (route) => {
    claimBodies.push(route.request().postDataJSON())
    return route.fulfill(claim ?? { json: { reward: earnedReward({ status: 'claimed', claimed_at: new Date().toISOString() }) } })
  })

  return { claimBodies: () => claimBodies, setData: (next) => void (current = next) }
}
