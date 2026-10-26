import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerMock, supabaseAdminMock } = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: createSupabaseServerMock,
  supabaseAdmin: supabaseAdminMock,
}))

import { NextRequest } from 'next/server'
import { POST } from './route'

const upsert = vi.fn()

function mockEvent(event: { id: string; status: string; sales_start: string | null } | null) {
  supabaseAdminMock.mockReturnValue({
    from(table: string) {
      if (table === 'events') {
        return {
          select: () => ({
            eq: () => ({ single: async () => ({ data: event, error: event ? null : { message: 'not found' } }) }),
          }),
        }
      }
      return { upsert }
    },
  })
}

let ipCounter = 0
const call = (body: unknown) =>
  POST(
    new NextRequest('http://localhost/api/events/ultra-arena-2026/notify', {
      method: 'POST',
      headers: { 'x-forwarded-for': `10.0.0.${++ipCounter}` },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: 'ultra-arena-2026' }) },
  )

describe('POST /api/events/[id]/notify', () => {
  beforeEach(() => {
    upsert.mockReset().mockResolvedValue({ error: null })
    createSupabaseServerMock.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: null } }) } })
  })

  it('stores the email on a completed event (waiting list for the next edition)', async () => {
    mockEvent({ id: 'evt-1', status: 'completed', sales_start: null })
    const res = await call({ email: 'Runner@Example.com' })
    expect(res.status).toBe(201)
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ event_id: 'evt-1', email: 'runner@example.com' }),
      expect.objectContaining({ onConflict: 'event_id,email' }),
    )
  })

  it('rejects an invalid email', async () => {
    mockEvent({ id: 'evt-1', status: 'completed', sales_start: null })
    const res = await call({ email: 'not-an-email' })
    expect(res.status).toBe(400)
    expect(upsert).not.toHaveBeenCalled()
  })

  it('returns 404 for an unknown event', async () => {
    mockEvent(null)
    const res = await call({ email: 'runner@example.com' })
    expect(res.status).toBe(404)
  })

  it('returns 500 when the insert fails', async () => {
    mockEvent({ id: 'evt-1', status: 'completed', sales_start: null })
    upsert.mockResolvedValue({ error: { message: 'boom' } })
    const res = await call({ email: 'runner@example.com' })
    expect(res.status).toBe(500)
  })
})
