import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryRecorder, type QueryResult } from '@/lib/admin/queryRecorder'

const mocks = vi.hoisted(() => ({ supabaseAdmin: vi.fn(), requireAdmin: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: mocks.supabaseAdmin, createSupabaseServer: vi.fn() }))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: mocks.requireAdmin }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: (handler: unknown) => handler }))

import { GET } from './route'

const EVENT = '56e08f7d-24c3-44be-b123-4f034c669909'
const registration = (n: number, email: string) => ({
  id: `0d0272d2-647c-4b7b-8c68-${String(n).padStart(12, '0')}`,
  user_id: null,
  ticket_id: null,
  order_id: null,
  email,
  checked_in: false,
  claim_status: 'guest',
  approval_status: 'approved',
  created_at: '2026-10-01T08:00:00.000Z',
  start_time: null,
  wave_index: null,
  cancelled_at: null,
  cancellation_reason: null,
  bib_number: null,
  paid_ticket_cents: null,
})

const call = async (search: string, results: QueryResult[], id = EVENT) => {
  const recorder = createQueryRecorder(results)
  mocks.supabaseAdmin.mockReturnValue(recorder.client)
  const response = await (GET as unknown as (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>)(
    new Request(`http://localhost/api/admin/events/${id}/participants/export${search}`),
    { params: Promise.resolve({ id }) },
  )
  return { response, recorder }
}

describe('GET /api/admin/events/[id]/participants/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAdmin.mockResolvedValue({ ok: true, user: { id: 'admin' } })
  })

  it('sends a UTF-8 CSV with a BOM, one line per registration, and a file name for the event', async () => {
    const { response } = await call('?status=all', [{ data: [registration(1, 'ada@example.com'), registration(2, '=cmd@example.com')] }])
    const bytes = new Uint8Array(await response.clone().arrayBuffer())
    const text = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/csv')
    expect(response.headers.get('Content-Disposition')).toContain(`participants-${EVENT}.csv`)
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf])
    expect(text).toContain('ada@example.com')
    // A formula in a cell is neutralised so Excel does not run it.
    expect(text).not.toMatch(/(^|,|")=cmd@example\.com/)
    expect(text.trim().split('\n').length).toBe(3)
  })

  it('exports only what the list filters select, scoped to the event', async () => {
    const { recorder } = await call('?status=cancelled&check_in=checked_in&ticket_id=' + '44444444-4444-4444-8444-444444444444', [{ data: [] }])

    expect(recorder.callsOf(0, 'eq')).toEqual([['event_id', EVENT], ['checked_in', true], ['ticket_id', '44444444-4444-4444-8444-444444444444']])
    expect(recorder.callsOf(0, 'not')).toEqual([['cancelled_at', 'is', null]])
  })

  it('keeps reading pages of 1000 until one comes back short', async () => {
    const full = Array.from({ length: 1000 }, (_, index) => registration(index, `p${index}@example.com`))
    const { response, recorder } = await call('', [{ data: full }, {}, {}, {}, {}, { data: [registration(2000, 'last@example.com')] }])

    expect(response.status).toBe(200)
    expect(recorder.queries.filter((query) => query.table === 'registrations').length).toBeGreaterThanOrEqual(2)
    expect(recorder.callsOf(0, 'range')).toEqual([[0, 999]])
  })

  it('answers 400 for an invalid event id or filters, and 403 for a non-admin', async () => {
    expect((await call('', [], 'not-a-uuid')).response.status).toBe(400)
    expect((await call('?status=weird', [])).response.status).toBe(400)

    mocks.requireAdmin.mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) })
    expect((await call('', [])).response.status).toBe(403)
  })

  it('answers 500 without leaking the database error', async () => {
    const { response } = await call('', [{ error: { message: 'permission denied for table registrations' } }])
    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('permission denied')
  })
})
