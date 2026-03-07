import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

const exchangeCodeForSessionMock = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
    },
  })),
}))

describe('GET /auth/callback', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.overbound-race.com'
    exchangeCodeForSessionMock.mockReset()
    exchangeCodeForSessionMock.mockResolvedValue({ error: null })
  })

  it('redirects to login with provider error description', async () => {
    const request = new NextRequest(
      'https://www.overbound-race.com/auth/callback?error=access_denied&error_description=popup%20blocked',
    )

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://www.overbound-race.com/auth/login?error=popup+blocked',
    )
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled()
  })

  it('redirects to login when code is missing', async () => {
    const request = new NextRequest('https://www.overbound-race.com/auth/callback?next=%2Faccount')

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/auth/login?error=')
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled()
  })

  it('redirects to safe next path on successful exchange', async () => {
    const request = new NextRequest(
      'https://www.overbound-race.com/auth/callback?code=test-code&next=%2Fevents%2Fultra-arena-2026',
    )

    const response = await GET(request)

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('test-code')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://www.overbound-race.com/events/ultra-arena-2026',
    )
  })

  it('falls back to /account when next is not internal', async () => {
    const request = new NextRequest(
      'https://www.overbound-race.com/auth/callback?code=test-code&next=https%3A%2F%2Fevil.com',
    )

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://www.overbound-race.com/account')
  })

  it('redirects to login when exchange fails', async () => {
    exchangeCodeForSessionMock.mockResolvedValueOnce({
      error: { message: 'invalid grant' },
    })

    const request = new NextRequest('https://www.overbound-race.com/auth/callback?code=bad-code')

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://www.overbound-race.com/auth/login?error=invalid+grant',
    )
  })
})
