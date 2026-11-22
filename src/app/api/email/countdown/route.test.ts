import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, renderMock, glyphsMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  renderMock: vi.fn(),
  glyphsMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/email/countdownGif', () => ({ renderCountdownGif: renderMock }))
vi.mock('@/lib/email/countdownGlyphs', () => ({ loadCountdownGlyphs: glyphsMock }))

import { GET } from './route'

function mockEvent(result: { data: { sales_start: string | null } | null; error: { message: string } | null }) {
  const query = { select: () => query, eq: () => query, maybeSingle: async () => result }
  supabaseAdminMock.mockReturnValue({ from: () => query })
}

const call = (query: string) => GET({ nextUrl: new URL(`https://x.test/api/email/countdown${query}`) } as never)

describe('GET /api/email/countdown', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    glyphsMock.mockResolvedValue({ digits: [], labels: {} })
  })

  it('rejects a missing or malformed event slug', async () => {
    expect((await call('')).status).toBe(400)
    expect((await call('?event=../etc')).status).toBe(400)
    expect(renderMock).not.toHaveBeenCalled()
  })

  it('answers 404 for an unknown event or one without an opening date', async () => {
    mockEvent({ data: null, error: null })
    expect((await call('?event=unknown')).status).toBe(404)

    mockEvent({ data: { sales_start: null }, error: null })
    expect((await call('?event=ultra-arena-2027')).status).toBe(404)
  })

  it('answers 500 when the event cannot be read', async () => {
    mockEvent({ data: null, error: { message: 'boom' } })
    expect((await call('?event=ultra-arena-2027')).status).toBe(500)
  })

  it('renders a GIF counting down to the opening stored on the event', async () => {
    mockEvent({ data: { sales_start: '2026-12-01T06:00:00Z' }, error: null })
    renderMock.mockResolvedValue(Buffer.from('GIF89a'))

    const response = await call('?event=ultra-arena-2027')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/gif')
    expect(response.headers.get('cache-control')).toContain('s-maxage=20')
    expect(renderMock).toHaveBeenCalledWith(expect.anything(), Date.UTC(2026, 11, 1, 6), expect.any(Number))
  })

  it('answers 500 when drawing fails', async () => {
    mockEvent({ data: { sales_start: '2026-12-01T06:00:00Z' }, error: null })
    renderMock.mockRejectedValue(new Error('render'))

    expect((await call('?event=ultra-arena-2027')).status).toBe(500)
  })
})
