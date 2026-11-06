import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const upsert = vi.fn()
const select = vi.fn()
const single = vi.fn()
const resolveRequestUser = vi.fn()

vi.mock('@/lib/auth/resolveRequestUser', () => ({ resolveRequestUser: (...args: unknown[]) => resolveRequestUser(...args) }))
vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      upsert: (...args: unknown[]) => {
        upsert(...args)
        return { select: (...columns: unknown[]) => (select(...columns), { single }) }
      },
    }),
  }),
}))

const { PATCH } = await import('./route')

const patch = (body: unknown) =>
  PATCH(
    new NextRequest('http://localhost/api/account/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )

describe('PATCH /api/account/profile: sex', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveRequestUser.mockResolvedValue({ id: 'user-1' })
    single.mockResolvedValue({ data: { full_name: 'Camille', sex: 'femme' }, error: null })
  })

  it('saves a sex on the profile of the signed-in user', async () => {
    const response = await patch({ sex: 'femme' })

    expect(response.status).toBe(200)
    expect(upsert).toHaveBeenCalledWith({ id: 'user-1', sex: 'femme' }, { onConflict: 'id' })
    expect(select).toHaveBeenCalledWith(expect.stringContaining('sex'))
  })

  it('clears the sex when the form sends a blank value', async () => {
    const response = await patch({ sex: '' })

    expect(response.status).toBe(200)
    expect(upsert).toHaveBeenCalledWith({ id: 'user-1', sex: null }, { onConflict: 'id' })
  })

  it('refuses any value outside homme and femme, before writing', async () => {
    const response = await patch({ sex: 'autre' })

    expect(response.status).toBe(422)
    expect(upsert).not.toHaveBeenCalled()
  })

  it('refuses the change for an anonymous visitor', async () => {
    resolveRequestUser.mockResolvedValue(null)

    const response = await patch({ sex: 'homme' })

    expect(response.status).toBe(401)
    expect(upsert).not.toHaveBeenCalled()
  })
})
