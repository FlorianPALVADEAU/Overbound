import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerMock, resolveRequestUserMock } = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  resolveRequestUserMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServer: createSupabaseServerMock }))
vi.mock('@/lib/auth/resolveRequestUser', () => ({ resolveRequestUser: resolveRequestUserMock }))

import { POST } from './route'

const EVENT_ID = '56e08f7d-24c3-44be-b123-4f034c669909'
const REG_ID = '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'
const BODY = {
  commandId: '4d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
  previewId: 'preview-1',
  previewSourceVersion: 'version-1',
  currentSourceVersion: 'version-1',
  policyVariant: 'NO_MOVEMENT',
  reason: 'Correction opérationnelle validée',
  previewExpiresAt: '2026-09-20T10:00:00.000Z',
  eventStartsAt: '2026-09-20T08:00:00.000Z',
  eventTimezone: 'Europe/Paris',
}

describe('POST ticket change confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveRequestUserMock.mockResolvedValue({ id: 'admin-1' })
    createSupabaseServerMock.mockResolvedValue({
      from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role: 'admin' } }) }) }) }),
    })
  })

  it('does not activate confirmation before the audit/idempotency contract exists', async () => {
    const response = await POST(
      new Request('http://localhost', { method: 'POST', body: JSON.stringify(BODY) }) as any,
      { params: Promise.resolve({ id: EVENT_ID, registrationId: REG_ID }) },
    )
    expect(response.status).toBe(501)
    expect((await response.json()).code).toBe('NO_MOVEMENT_CONFIRMATION_CONTRACT_MISSING')
  })

  it('rejects malformed commands before authentication', async () => {
    const response = await POST(
      new Request('http://localhost', { method: 'POST', body: JSON.stringify({ ...BODY, reason: '' }) }) as any,
      { params: Promise.resolve({ id: EVENT_ID, registrationId: REG_ID }) },
    )
    expect(response.status).toBe(400)
    expect(resolveRequestUserMock).not.toHaveBeenCalled()
  })
})
