import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isTurnstileConfigured, verifyTurnstileToken } from './turnstile'

const fetchMock = vi.fn()

describe('verifyTurnstileToken', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('skips the check when no secret key is set', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    expect(isTurnstileConfigured()).toBe(false)
    expect(await verifyTurnstileToken(undefined)).toEqual({ ok: true, skipped: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a missing token once configured', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    expect(await verifyTurnstileToken(undefined)).toEqual({ ok: false, reason: 'missing-token' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts a token Cloudflare validates and forwards the visitor IP', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    expect(await verifyTurnstileToken('token', '1.2.3.4')).toEqual({ ok: true, skipped: false })
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams
    expect(body.get('secret')).toBe('secret')
    expect(body.get('response')).toBe('token')
    expect(body.get('remoteip')).toBe('1.2.3.4')
  })

  it('rejects a token Cloudflare refuses', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: false }) })
    expect(await verifyTurnstileToken('bad')).toEqual({ ok: false, reason: 'rejected' })
  })

  it('blocks when Cloudflare cannot be reached', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    fetchMock.mockRejectedValue(new Error('network'))
    expect(await verifyTurnstileToken('token')).toEqual({ ok: false, reason: 'unreachable' })
  })
})
