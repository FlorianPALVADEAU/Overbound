import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, DELETE } from './route'

// ── Fake Supabase builder ────────────────────────────────────────────────────

type TableName = 'bootcamps' | 'bootcamp_registrations' | 'profiles'

interface FakeState {
  user: { id: string; email: string } | null
  bootcamp: Record<string, unknown> | null
  insertError: { code?: string; message: string } | null
  profile: { full_name: string | null } | null
  deleteError: { message: string } | null
}

function makeSupabase(state: FakeState) {
  const builder = (table: TableName) => {
    let _filters: Array<{ key: string; value: unknown }> = []

    const q: Record<string, unknown> = {
      select: () => q,
      insert: (_payload: unknown) => q,
      delete: () => q,
      eq: (key: string, value: unknown) => {
        _filters.push({ key, value })
        return q
      },
      single: () => {
        if (table === 'bootcamps') {
          if (state.bootcamp) return Promise.resolve({ data: state.bootcamp, error: null })
          return Promise.resolve({ data: null, error: { message: 'Not found' } })
        }
        if (table === 'profiles') {
          return Promise.resolve({ data: state.profile, error: null })
        }
        if (table === 'bootcamp_registrations') {
          if (state.insertError) return Promise.resolve({ data: null, error: state.insertError })
          return Promise.resolve({ data: { id: 'reg-1' }, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      },
      // For INSERT on bootcamp_registrations
      then: (resolve: (v: unknown) => void) => {
        if (table === 'bootcamp_registrations') {
          if (state.insertError) return resolve({ data: null, error: state.insertError })
          if (state.deleteError) return resolve({ data: null, error: state.deleteError })
          return resolve({ data: null, error: null })
        }
        return resolve({ data: null, error: null })
      },
    }
    return q
  }

  // Override: insert returns an awaitable with error
  const insertBuilder = (table: TableName) => {
    const q = {
      insert: (_payload: unknown) => ({
        then: (resolve: (v: unknown) => void) => {
          if (state.insertError) return resolve({ error: state.insertError })
          return resolve({ error: null })
        },
      }),
      delete: () => ({
        eq: (k1: string, v1: unknown) => ({
          eq: (_k2: string, _v2: unknown) => ({
            then: (resolve: (v: unknown) => void) => {
              if (state.deleteError) return resolve({ error: state.deleteError })
              return resolve({ error: null })
            },
          }),
        }),
      }),
      select: () => insertBuilder(table),
      eq: (_k: string, _v: unknown) => insertBuilder(table),
      single: () => {
        if (table === 'bootcamps') {
          if (state.bootcamp) return Promise.resolve({ data: state.bootcamp, error: null })
          return Promise.resolve({ data: null, error: { message: 'Not found' } })
        }
        if (table === 'profiles') return Promise.resolve({ data: state.profile, error: null })
        return Promise.resolve({ data: null, error: null })
      },
    }
    return q
  }

  return {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: state.user },
          error: state.user ? null : { message: 'Not authenticated' },
        }),
    },
    from: insertBuilder,
  }
}

// ── Module mocks ─────────────────────────────────────────────────────────────

const mockSendEmail = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: vi.fn(),
}))

vi.mock('@/lib/email/bootcamps', () => ({
  sendBootcampRegistrationEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

import { createSupabaseServer } from '@/lib/supabase/server'
const mockCreateSupabaseServer = vi.mocked(createSupabaseServer)

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeParams(id = 'bc-1') {
  return { params: Promise.resolve({ id }) }
}

const BOOTCAMP = {
  id: 'bc-1',
  title: 'Bootcamp Airtime',
  starts_at: '2026-07-25T08:00:00+02:00',
  location_name: 'Airtime Training',
  location_address: '2 Rue Charlie Chaplin, 78390 Bois-d\'Arcy',
}

// ── POST /api/bootcamps/[id]/register ────────────────────────────────────────

describe('POST /api/bootcamps/[id]/register', () => {
  beforeEach(() => {
    mockSendEmail.mockClear()
  })

  it('retourne 401 si utilisateur non authentifié', async () => {
    mockCreateSupabaseServer.mockResolvedValue(
      makeSupabase({ user: null, bootcamp: BOOTCAMP, insertError: null, profile: null, deleteError: null }) as never,
    )

    const res = await POST(new Request('http://localhost'), makeParams())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Non authentifié')
  })

  it('retourne 404 si bootcamp introuvable', async () => {
    mockCreateSupabaseServer.mockResolvedValue(
      makeSupabase({ user: { id: 'u-1', email: 'u@test.com' }, bootcamp: null, insertError: null, profile: null, deleteError: null }) as never,
    )

    const res = await POST(new Request('http://localhost'), makeParams())
    expect(res.status).toBe(404)
  })

  it('retourne 409 si déjà inscrit (code 23505)', async () => {
    mockCreateSupabaseServer.mockResolvedValue(
      makeSupabase({
        user: { id: 'u-1', email: 'u@test.com' },
        bootcamp: BOOTCAMP,
        insertError: { code: '23505', message: 'duplicate key' },
        profile: null,
        deleteError: null,
      }) as never,
    )

    const res = await POST(new Request('http://localhost'), makeParams())
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('Déjà inscrit à ce bootcamp')
  })

  it('retourne 201 et envoie un email en cas de succès', async () => {
    mockCreateSupabaseServer.mockResolvedValue(
      makeSupabase({
        user: { id: 'u-1', email: 'u@test.com' },
        bootcamp: BOOTCAMP,
        insertError: null,
        profile: { full_name: 'Alice Dupont' },
        deleteError: null,
      }) as never,
    )

    const res = await POST(new Request('http://localhost'), makeParams())
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(mockSendEmail).toHaveBeenCalledOnce()
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'u@test.com',
        fullName: 'Alice Dupont',
        bootcampTitle: 'Bootcamp Airtime',
      }),
    )
  })

  it("n'envoie pas d'email si l'utilisateur n'a pas d'email", async () => {
    mockCreateSupabaseServer.mockResolvedValue(
      makeSupabase({
        user: { id: 'u-1', email: '' },
        bootcamp: BOOTCAMP,
        insertError: null,
        profile: { full_name: null },
        deleteError: null,
      }) as never,
    )

    const res = await POST(new Request('http://localhost'), makeParams())
    expect(res.status).toBe(201)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})

// ── DELETE /api/bootcamps/[id]/register ─────────────────────────────────────

describe('DELETE /api/bootcamps/[id]/register', () => {
  it('retourne 401 si utilisateur non authentifié', async () => {
    mockCreateSupabaseServer.mockResolvedValue(
      makeSupabase({ user: null, bootcamp: null, insertError: null, profile: null, deleteError: null }) as never,
    )

    const res = await DELETE(new Request('http://localhost'), makeParams())
    expect(res.status).toBe(401)
  })

  it('retourne 200 et success:true en cas de succès', async () => {
    mockCreateSupabaseServer.mockResolvedValue(
      makeSupabase({
        user: { id: 'u-1', email: 'u@test.com' },
        bootcamp: BOOTCAMP,
        insertError: null,
        profile: null,
        deleteError: null,
      }) as never,
    )

    const res = await DELETE(new Request('http://localhost'), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('retourne 500 si la suppression échoue', async () => {
    mockCreateSupabaseServer.mockResolvedValue(
      makeSupabase({
        user: { id: 'u-1', email: 'u@test.com' },
        bootcamp: BOOTCAMP,
        insertError: null,
        profile: null,
        deleteError: { message: 'DB error' },
      }) as never,
    )

    const res = await DELETE(new Request('http://localhost'), makeParams())
    expect(res.status).toBe(500)
  })
})
