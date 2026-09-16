import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerMock, supabaseAdminMock } = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: createSupabaseServerMock,
  supabaseAdmin: supabaseAdminMock,
}))

import { POST } from './route'

const REGISTRATION_ROW = {
  id: 'reg-1',
  email: 'runner@example.com',
  checked_in: false,
  start_time: '2026-09-12T10:20:00.000Z',
  wave_index: 3,
  tickets: [{ name: 'Primal OPEN', events: [{ title: 'Ultra Arena', date: '2026-09-12', location: 'SQY' }] }],
}

function mockAuthedUser(role: string | null) {
  createSupabaseServerMock.mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1', email: 'staff@example.com' } } }),
    },
    from(table: string) {
      if (table === 'profiles') {
        return {
          select() {
            return {
              eq() {
                return {
                  single: async () => ({ data: role ? { role } : null }),
                }
              },
            }
          },
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  })
}

function mockUnauthenticated() {
  createSupabaseServerMock.mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
  })
}

function createAdmin(options: { registration?: typeof REGISTRATION_ROW | null; updateError?: unknown }) {
  const registration = options.registration
  return {
    from(table: string) {
      if (table === 'registrations') {
        return {
          select() {
            return {
              eq() {
                return {
                  single: async () => ({ data: registration ?? null }),
                }
              },
            }
          },
          update(payload: { checked_in: boolean }) {
            return {
              eq() {
                return {
                  select() {
                    return {
                      single: async () =>
                        options.updateError
                          ? { data: null, error: options.updateError }
                          : { data: { ...registration, checked_in: payload.checked_in }, error: null },
                    }
                  },
                }
              },
            }
          },
        }
      }
      if (table === 'admin_request_logs') {
        return { insert: async () => ({ error: null }) }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }
}

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/checkin', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/checkin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when the user is not authenticated', async () => {
    mockUnauthenticated()

    const response = await POST(jsonRequest({ token: 'qr-1' }))

    expect(response.status).toBe(401)
  })

  it('returns 403 when the user is neither admin nor volunteer', async () => {
    mockAuthedUser('participant')
    supabaseAdminMock.mockReturnValue(createAdmin({ registration: REGISTRATION_ROW }))

    const response = await POST(jsonRequest({ token: 'qr-1' }))

    expect(response.status).toBe(403)
  })

  it('returns 400 when the QR token is missing from the body', async () => {
    mockAuthedUser('volunteer')

    const response = await POST(jsonRequest({}))

    expect(response.status).toBe(400)
  })

  it('returns 404 when no registration matches the QR token', async () => {
    mockAuthedUser('volunteer')
    supabaseAdminMock.mockReturnValue(createAdmin({ registration: null }))

    const response = await POST(jsonRequest({ token: 'unknown-token' }))

    expect(response.status).toBe(404)
  })

  it('checks a participant in successfully', async () => {
    mockAuthedUser('volunteer')
    supabaseAdminMock.mockReturnValue(createAdmin({ registration: REGISTRATION_ROW }))

    const response = await POST(jsonRequest({ token: 'qr-1' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.registration.checked_in).toBe(true)
    expect(body.registration.email).toBe('runner@example.com')
  })

  it('returns 409 when checking in someone already checked in', async () => {
    mockAuthedUser('admin')
    supabaseAdminMock.mockReturnValue(
      createAdmin({ registration: { ...REGISTRATION_ROW, checked_in: true } }),
    )

    const response = await POST(jsonRequest({ token: 'qr-1' }))

    expect(response.status).toBe(409)
  })

  it('undoes a check-in successfully', async () => {
    mockAuthedUser('admin')
    supabaseAdminMock.mockReturnValue(
      createAdmin({ registration: { ...REGISTRATION_ROW, checked_in: true } }),
    )

    const response = await POST(jsonRequest({ token: 'qr-1', action: 'undo' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.registration.checked_in).toBe(false)
  })

  it('returns 409 when undoing a check-in that never happened', async () => {
    mockAuthedUser('admin')
    supabaseAdminMock.mockReturnValue(createAdmin({ registration: REGISTRATION_ROW }))

    const response = await POST(jsonRequest({ token: 'qr-1', action: 'undo' }))

    expect(response.status).toBe(409)
  })

  it('returns 500 when the update fails', async () => {
    mockAuthedUser('admin')
    supabaseAdminMock.mockReturnValue(
      createAdmin({ registration: REGISTRATION_ROW, updateError: new Error('db error') }),
    )

    const response = await POST(jsonRequest({ token: 'qr-1' }))

    expect(response.status).toBe(500)
  })
})
