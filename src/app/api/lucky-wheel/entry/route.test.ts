import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/rateLimit', () => ({
  getClientIp: () => '127.0.0.1',
  rateLimit: () => ({ allowed: true, remaining: 9, resetAt: Date.now() + 60_000 }),
}))

import { POST } from './route'

const ACTIVE_CAMPAIGN_ROW = {
  id: 'campaign-1',
  name: 'Lancement Ultra Arena',
  trigger_rules: {},
  commercial_phase: 'STANDARD',
  reward_expiration_hours: 48,
}

function buildRequest(body: unknown) {
  return new Request('http://localhost/api/lucky-wheel/entry', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as any
}

function campaignQuery(row: typeof ACTIVE_CAMPAIGN_ROW | null) {
  // Chainable stub: every filter method (.eq/.lte/.gte/.order/.limit)
  // returns the same object so the mock doesn't need to hard-code an
  // exact call count or order.
  const chain: any = {
    eq: () => chain,
    lte: () => chain,
    gte: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: async () => ({ data: row, error: null }),
  }
  return { select: () => chain }
}

function entriesQuery({
  existing,
  insertError,
  insertedId = 'entry-new',
}: {
  existing?: { id: string; spun_at: string | null } | null
  insertError?: { code: string } | null
  insertedId?: string
}) {
  let lookupCallCount = 0
  return {
    select() {
      return {
        eq() {
          return {
            eq() {
              return {
                maybeSingle: async () => {
                  lookupCallCount += 1
                  // Second lookup (post-insert-conflict race check) always
                  // returns the row a concurrent request would have created.
                  if (lookupCallCount > 1) {
                    return { data: existing ?? { id: insertedId, spun_at: null }, error: null }
                  }
                  return { data: existing ?? null, error: null }
                },
              }
            },
          }
        },
      }
    },
    insert() {
      return {
        select() {
          return {
            single: async () =>
              insertError
                ? { data: null, error: insertError }
                : { data: { id: insertedId }, error: null },
          }
        },
      }
    },
  }
}

function buildAdmin({
  campaign,
  existingEntry,
  insertError,
}: {
  campaign: typeof ACTIVE_CAMPAIGN_ROW | null
  existingEntry?: { id: string; spun_at: string | null } | null
  insertError?: { code: string } | null
}) {
  return {
    from(table: string) {
      if (table === 'lucky_wheel_campaigns') return campaignQuery(campaign)
      if (table === 'lucky_wheel_entries') return entriesQuery({ existing: existingEntry, insertError })
      throw new Error(`Unexpected table: ${table}`)
    },
  }
}

beforeEach(() => {
  supabaseAdminMock.mockReset()
})

describe('POST /api/lucky-wheel/entry', () => {
  it('creates a new entry for a first-time participant', async () => {
    supabaseAdminMock.mockReturnValue(buildAdmin({ campaign: ACTIVE_CAMPAIGN_ROW, existingEntry: null }))

    const response = await POST(
      buildRequest({ event_id: 'aaaaaaaa-1111-4111-8111-111111111111', email: 'runner@example.com' }),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json).toEqual({ success: true, wheel_entry_id: 'entry-new', already_participated: false })
  })

  it('returns 404 when no active campaign applies to the event', async () => {
    supabaseAdminMock.mockReturnValue(buildAdmin({ campaign: null }))

    const response = await POST(
      buildRequest({ event_id: 'aaaaaaaa-1111-4111-8111-111111111111', email: 'runner@example.com' }),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe('CAMPAIGN_UNAVAILABLE')
  })

  it('returns the existing entry instead of duplicating on repeat submission', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({
        campaign: ACTIVE_CAMPAIGN_ROW,
        existingEntry: { id: 'entry-existing', spun_at: null },
      }),
    )

    const response = await POST(
      buildRequest({ event_id: 'aaaaaaaa-1111-4111-8111-111111111111', email: 'runner@example.com' }),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ success: true, wheel_entry_id: 'entry-existing', already_participated: false })
  })

  it('rejects invalid input with 400', async () => {
    supabaseAdminMock.mockReturnValue(buildAdmin({ campaign: ACTIVE_CAMPAIGN_ROW }))

    const response = await POST(buildRequest({ event_id: 'not-a-uuid', email: 'not-an-email' }))

    expect(response.status).toBe(400)
  })

  it('treats a concurrent duplicate insert (23505) as already participated, not a 500', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({ campaign: ACTIVE_CAMPAIGN_ROW, existingEntry: null, insertError: { code: '23505' } }),
    )

    const response = await POST(
      buildRequest({ event_id: 'aaaaaaaa-1111-4111-8111-111111111111', email: 'runner@example.com' }),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
  })

  it('honors the honeypot field without writing anything', async () => {
    const admin = buildAdmin({ campaign: ACTIVE_CAMPAIGN_ROW })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await POST(
      buildRequest({
        event_id: 'aaaaaaaa-1111-4111-8111-111111111111',
        email: 'runner@example.com',
        website: 'http://spam.example',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.already_participated).toBe(true)
  })
})
