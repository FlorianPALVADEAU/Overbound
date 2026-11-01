import { describe, expect, it } from 'vitest'
import { buildRecruitRows, type RecruitPointEvent, type RecruitRegistration } from './recruits'

const registration = (overrides: Partial<RecruitRegistration> = {}): RecruitRegistration => ({
  id: 'reg-1',
  user_id: null,
  email: 'ada.lovelace@example.com',
  created_at: '2026-11-10T10:00:00Z',
  order_id: 'order-1',
  ticket: { race_format: 'open' },
  ...overrides,
})

const event = (overrides: Partial<RecruitPointEvent> = {}): RecruitPointEvent => ({
  registration_id: 'reg-1',
  points: 1,
  race_format: 'open',
  revoked_at: null,
  ...overrides,
})

const SEASON_START = '2026-11-02T00:00:00Z'

const build = (registrations: RecruitRegistration[], pointEvents: RecruitPointEvent[]) =>
  buildRecruitRows({
    registrations,
    pointEvents,
    seasonStartedAt: SEASON_START,
    orderStatuses: new Map([['order-1', 'paid']]),
    profileNames: new Map(),
  })

describe('buildRecruitRows', () => {
  it('credits the ledger points of a paid referral', () => {
    const [row] = build([registration()], [event({ points: 2, race_format: 'ranked' })])
    expect(row).toMatchObject({ points: 2, points_status: 'counted', race_format: 'ranked', payment_status: 'paid' })
  })

  it('shows 0 and "none" for a referral without a ledger event instead of inferring points', () => {
    const [row] = build([registration({ ticket: { race_format: 'ranked' } })], [])
    expect(row).toMatchObject({ points: 0, points_status: 'none', race_format: 'ranked' })
  })

  it('shows a revoked event as revoked with 0 points', () => {
    const [row] = build([registration()], [event({ revoked_at: '2026-11-20T00:00:00Z' })])
    expect(row).toMatchObject({ points: 0, points_status: 'revoked' })
  })

  it('hides referrals of a closed season that have no ledger event', () => {
    const rows = build(
      [registration({ id: 'a' }), registration({ id: 'old', created_at: '2026-08-10T10:00:00Z' })],
      [event({ registration_id: 'a' })],
    )
    expect(rows.map((row) => row.id)).toEqual(['a'])
  })

  it('keeps an older referral that a manual credit put in the ledger', () => {
    const rows = build([registration({ id: 'old', created_at: '2026-08-10T10:00:00Z' })], [event({ registration_id: 'old' })])
    expect(rows.map((row) => row.id)).toEqual(['old'])
  })

  it('sorts the newest signup first', () => {
    const rows = build(
      [registration({ id: 'old', created_at: '2026-11-03T00:00:00Z' }), registration({ id: 'new', created_at: '2026-12-02T00:00:00Z' })],
      [],
    )
    expect(rows.map((row) => row.id)).toEqual(['new', 'old'])
  })

  it('names participants of a shared order from their email', () => {
    const rows = build(
      [registration({ id: 'a', user_id: 'buyer', email: 'ada.lovelace@example.com' }), registration({ id: 'b', user_id: 'buyer', email: 'alan.turing@example.com' })],
      [],
    )
    expect(rows.map((row) => row.name).sort()).toEqual(['Ada Lovelace', 'Alan Turing'])
  })
})
