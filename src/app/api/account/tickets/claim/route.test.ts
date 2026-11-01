import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerMock, supabaseAdminMock, notifyMock, redactMock, consumeMock, unlockedMock } = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  notifyMock: vi.fn(),
  redactMock: vi.fn(),
  consumeMock: vi.fn(),
  unlockedMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServer: createSupabaseServerMock, supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: (handler: unknown) => handler }))
vi.mock('@/lib/tickets/transferAftermath', () => ({ notifyTransferParties: notifyMock, redactFormerHolderWaiver: redactMock }))
vi.mock('@/lib/tickets/ticketTransfers', () => ({ consumeTransfer: consumeMock, isTransferUnlocked: unlockedMock }))

import { POST } from './route'

const TOKEN = '11111111-1111-4111-8111-111111111111'

const submission = {
  token: TOKEN,
  participant: {
    firstName: 'Camille',
    lastName: 'Martin',
    birthDate: '1990-05-04',
    emergencyContactName: 'Jo',
    emergencyContactPhone: '0600000000',
    medicalInfo: '',
    healthDataConsent: false,
  },
  signatureImage: 'data:image/png;base64,abc',
  signatureMetadata: {},
  disclaimer: { read: true, accepted: true, rulebookAccepted: true },
}

const RANKED = {
  id: 'ranked-1',
  user_id: 'seller',
  transfer_token: TOKEN,
  claim_status: 'pending',
  email: 'seller@example.com',
  qr_code_token: 'qr-ranked',
  is_affiliated: false,
  guarantor_user_id: null,
  event_id: 'event-1',
  ticket_id: 'ticket-1',
  event: { title: 'Ultra Arena', date: '2099-09-12T06:00:00.000Z' },
}

const COMPANION = {
  id: 'open-1',
  user_id: 'seller',
  email: 'seller@example.com',
  qr_code_token: 'qr-open',
  claim_status: 'pending',
  is_affiliated: false,
  guarantor_user_id: null,
  flexible_refund: true,
}

interface Update {
  id: string
  patch: Record<string, unknown>
}

const fakeAdmin = (options: { companions?: unknown[]; signatureError?: unknown } = {}) => {
  const updates: Update[] = []
  const signatures: Array<Record<string, unknown>> = []
  const admin = {
    from(table: string) {
      if (table === 'registration_signatures') {
        return {
          insert: async (rows: Array<Record<string, unknown>>) => {
            signatures.push(...rows)
            return { error: options.signatureError ?? null }
          },
        }
      }
      let patch: Record<string, unknown> | null = null
      let companionQuery = false
      const query = {
        select: () => query,
        update: (value: Record<string, unknown>) => {
          patch = value
          return query
        },
        eq: (column: string, value: string) => {
          if (column === 'companion_of') companionQuery = true
          if (column === 'id' && patch) updates.push({ id: value, patch })
          return query
        },
        is: () => query,
        maybeSingle: async () => ({ data: RANKED, error: null }),
        then: (resolve: (value: unknown) => unknown) => {
          if (companionQuery) return Promise.resolve({ data: options.companions ?? [], error: null }).then(resolve)
          // The token-matched hand-over of the RANKED bib returns the updated row.
          return Promise.resolve({ data: [{ id: 'ranked-1' }], error: null }).then(resolve)
        },
      }
      return query
    },
  }
  return { admin, updates, signatures }
}

const post = () =>
  POST(
    Object.assign(new Request('http://localhost/api/account/tickets/claim', { method: 'POST', body: JSON.stringify(submission) }), {
      nextUrl: { origin: 'http://localhost' },
    }) as unknown as import('next/server').NextRequest,
  )

describe('POST /api/account/tickets/claim, OPEN companion bib', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createSupabaseServerMock.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'buyer', email: 'buyer@example.com' } } }) },
    })
    unlockedMock.mockResolvedValue(true)
    notifyMock.mockResolvedValue(undefined)
    redactMock.mockResolvedValue(undefined)
    consumeMock.mockResolvedValue(undefined)
  })

  it('hands the companion bib to the new holder with a fresh QR, a waiver per bib, and no transfer left to buy', async () => {
    const { admin, updates, signatures } = fakeAdmin({ companions: [COMPANION] })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await post()

    expect(response.status).toBe(200)
    const companionUpdate = updates.find((update) => update.id === 'open-1')
    expect(companionUpdate?.patch).toMatchObject({
      user_id: 'buyer',
      transfer_token: null,
      claim_status: 'claimed',
      guarantor_user_id: 'seller',
      flexible_refund: false,
    })
    expect(companionUpdate?.patch.qr_code_token).not.toBe('qr-open')
    expect(signatures.map((signature) => signature.registration_id)).toEqual(['ranked-1', 'open-1'])
    expect(redactMock.mock.calls.map(([, id]) => id)).toEqual(['ranked-1', 'open-1'])
  })

  it('gives every bib back when the waiver cannot be saved', async () => {
    const { admin, updates } = fakeAdmin({ companions: [COMPANION], signatureError: { message: 'down' } })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await post()

    expect(response.status).toBe(500)
    const restoredCompanion = updates.filter((update) => update.id === 'open-1').at(-1)
    expect(restoredCompanion?.patch).toMatchObject({ user_id: 'seller', qr_code_token: 'qr-open', flexible_refund: true })
    const restoredRanked = updates.filter((update) => update.id === 'ranked-1').at(-1)
    expect(restoredRanked?.patch).toMatchObject({ user_id: 'seller', transfer_token: TOKEN })
  })

  it('transfers a plain RANKED bib exactly as before when it has no companion', async () => {
    const { admin, updates, signatures } = fakeAdmin()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await post()

    expect(response.status).toBe(200)
    expect(updates.map((update) => update.id)).toEqual(['ranked-1'])
    expect(signatures).toHaveLength(1)
  })
})
