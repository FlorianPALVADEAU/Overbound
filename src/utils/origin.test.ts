import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { getBaseUrl } from '@/utils/origin'

const ORIGINAL_ENV = { ...process.env }

const resetEnv = () => {
  process.env = { ...ORIGINAL_ENV }
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.VERCEL_URL
  delete process.env.NEXT_BASE_URL
}

describe('getBaseUrl', () => {
  beforeEach(() => {
    resetEnv()
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  const buildRequest = (headers?: Record<string, string>) =>
    ({ headers: new Headers(headers) } as unknown as Request)

  it('prefers the origin header when it is present', () => {
    const req = buildRequest({ origin: 'https://from-header.dev/' })
    expect(getBaseUrl(req)).toBe('https://from-header.dev')
  })

  it('falls back to forwarded proto/host headers', () => {
    const req = buildRequest({
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'proxy.example.com',
    })
    expect(getBaseUrl(req)).toBe('https://proxy.example.com')
  })

  it('respects the environment fallback order', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://public.example.com/'
    expect(getBaseUrl(buildRequest())).toBe('https://public.example.com')

    delete process.env.NEXT_PUBLIC_SITE_URL
    process.env.VERCEL_URL = 'deploy.vercel.app'
    expect(getBaseUrl(buildRequest())).toBe('https://deploy.vercel.app')

    delete process.env.VERCEL_URL
    process.env.NEXT_BASE_URL = 'https://legacy-base.dev'
    expect(getBaseUrl(buildRequest())).toBe('https://legacy-base.dev')
  })

  it('defaults to localhost when nothing else is provided', () => {
    expect(getBaseUrl(buildRequest())).toBe('http://localhost:3000')
  })

  it('throws if the fallback URL misses the protocol', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'missing-protocol.test'
    expect(() => getBaseUrl(buildRequest())).toThrow(/Base URL must include http/i)
  })
})
