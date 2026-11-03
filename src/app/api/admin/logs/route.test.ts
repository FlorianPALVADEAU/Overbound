import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryRecorder, type QueryResult } from '@/lib/admin/queryRecorder'
import { encodeKeysetCursor } from '@/lib/admin/keysetCursor'

const { supabaseAdminMock, requireAdminMock } = vi.hoisted(() => ({ supabaseAdminMock: vi.fn(), requireAdminMock: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock, createSupabaseServer: vi.fn() }))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))

import { GET } from './route'

const ID = (n: number) => `3f2b8c1e-5d4a-4f6b-9a7c-${String(n).padStart(12, '0')}`
const log = (n: number) => ({ id: ID(n), created_at: `2026-11-03T10:${String(59 - n).padStart(2, '0')}:00.000Z` })

const call = (search: string, results: QueryResult[]) => {
  const recorder = createQueryRecorder(results)
  supabaseAdminMock.mockReturnValue(recorder.client)
  return GET(new Request(`http://localhost/api/admin/logs${search}`)).then(async (response) => ({ response, body: await response.json(), recorder }))
}

describe('GET /api/admin/logs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin' } })
  })

  it('returns a page, a next cursor when one more row exists, and the filtered total', async () => {
    const rows = Array.from({ length: 26 }, (_, index) => log(index))
    const { response, body, recorder } = await call('?limit=25', [{ count: 90 }, { data: rows }])

    expect(response.status).toBe(200)
    expect(body.logs).toHaveLength(25)
    expect(body.page).toMatchObject({ limit: 25, totalCount: 90 })
    expect(body.page.nextCursor).toBe(encodeKeysetCursor({ createdAt: rows[24].created_at, id: rows[24].id }))
    expect(recorder.callOf(1, 'limit')).toEqual([26])
    expect(recorder.callsOf(1, 'order')).toEqual([['created_at', { ascending: false }], ['id', { ascending: false }]])
  })

  it('has no next cursor on the last page', async () => {
    const { body } = await call('?limit=25', [{ count: 3 }, { data: [log(0), log(1), log(2)] }])
    expect(body.page.nextCursor).toBeNull()
  })

  it('applies the filters to the count and to the page, and the cursor only to the page', async () => {
    const cursor = encodeKeysetCursor({ createdAt: '2026-11-03T10:00:00.000Z', id: ID(1) })
    const { response, recorder } = await call(`?method=DELETE&status=500&query=remboursement&startDate=2026-11-01&endDate=2026-11-02&cursor=${cursor}`, [{ count: 4 }, { data: [] }])

    expect(response.status).toBe(200)
    for (const index of [0, 1]) {
      expect(recorder.callsOf(index, 'eq')).toEqual([['method', 'DELETE'], ['status_code', 500]])
      expect(recorder.callsOf(index, 'gte')).toEqual([['created_at', '2026-10-31T23:00:00.000Z']])
      expect(recorder.callsOf(index, 'lte')).toEqual([['created_at', '2026-11-02T22:59:59.999Z']])
      expect(String(recorder.callOf(index, 'or')?.[0])).toContain('summary.ilike.%remboursement%')
    }
    expect(recorder.callsOf(0, 'or')).toHaveLength(1)
    expect(recorder.callsOf(1, 'or')).toHaveLength(2)
    expect(String(recorder.callsOf(1, 'or')[1][0])).toContain(`id.lt.${ID(1)}`)
  })

  it('strips characters that would rewrite the or() filter from the search', async () => {
    const { recorder } = await call(`?query=${encodeURIComponent('a,id.eq.1)(')}`, [{ count: 0 }, { data: [] }])
    const filter = String(recorder.callOf(1, 'or')?.[0])
    expect(filter).not.toContain('a,id.eq')
    expect(filter.split(',')).toHaveLength(5)
  })

  it('answers 400 on a bad parameter or a forged cursor, without querying', async () => {
    expect((await call('?method=TRACE', [])).response.status).toBe(400)
    expect((await call('?cursor=forged', [])).response.status).toBe(400)
    expect((await call('?startDate=yesterday', [])).response.status).toBe(400)
  })

  it('answers 500 without leaking the database error', async () => {
    const { response, body } = await call('', [{ error: { message: 'relation does not exist' } }])
    expect(response.status).toBe(500)
    expect(JSON.stringify(body)).not.toContain('relation')
  })

  it('refuses a non-admin before reading anything', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) })
    const response = await GET(new Request('http://localhost/api/admin/logs'))
    expect(response.status).toBe(403)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
