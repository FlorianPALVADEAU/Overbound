import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createSupabaseServerMock,
  supabaseAdminMock,
  paymentIntentsRetrieveMock,
  sendTicketEmailMock,
  sendReceiptEmailMock,
  notifyAmbassadorRewardsForOrderMock,
  sendAdminPushNotificationMock,
  sendMetaCapiEventMock,
  markResendContactAsRegisteredMock,
  qrCodeToDataURLMock,
} = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  paymentIntentsRetrieveMock: vi.fn(),
  sendTicketEmailMock: vi.fn(),
  sendReceiptEmailMock: vi.fn(),
  notifyAmbassadorRewardsForOrderMock: vi.fn(),
  sendAdminPushNotificationMock: vi.fn(),
  sendMetaCapiEventMock: vi.fn(),
  markResendContactAsRegisteredMock: vi.fn(),
  qrCodeToDataURLMock: vi.fn(),
}))

vi.mock('stripe', () => ({
  default: class StripeMock {
    paymentIntents = { retrieve: paymentIntentsRetrieveMock }
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: createSupabaseServerMock,
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/email', () => ({
  sendTicketEmail: sendTicketEmailMock,
  sendReceiptEmail: sendReceiptEmailMock,
}))

vi.mock('@/lib/ambassadors/rewardsNotifications', () => ({
  notifyAmbassadorRewardsForOrder: notifyAmbassadorRewardsForOrderMock,
}))

vi.mock('@/lib/push', () => ({
  sendAdminPushNotification: sendAdminPushNotificationMock,
}))

vi.mock('@/lib/analytics/metaCapi', () => ({
  sendMetaCapiEvent: sendMetaCapiEventMock,
}))

vi.mock('@/lib/email/resendAudiences', () => ({
  markResendContactAsRegistered: markResendContactAsRegisteredMock,
}))

vi.mock('qrcode', () => ({
  toDataURL: qrCodeToDataURLMock,
}))

process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'

import { POST } from './route'

const EVENT_ROW = {
  id: 'event-1',
  title: 'Ultra Arena',
  date: '2026-09-12T06:00:00.000Z',
  location: 'SQY',
  capacity: 6000,
  ranked_bib_capacity: 1000,
  minimum_age: 18,
  price_tiers: [],
}

const RANKED_TICKET_ROW = {
  id: 'ticket-1',
  name: 'Fury RANKED',
  race: { id: 'race-1', name: 'Fury' },
  final_price_cents: 5000,
  base_price_cents: 5000,
  currency: 'eur',
}

const OPEN_TICKET_ROW = {
  id: 'ticket-1',
  name: 'Primal OPEN',
  race: { id: 'race-1', name: 'Primal' },
  final_price_cents: 5000,
  base_price_cents: 5000,
  currency: 'eur',
}

function baseBody(overrides: Record<string, unknown> = {}) {
  return {
    paymentIntentId: 'pi_1',
    eventId: 'event-1',
    userId: 'user-1',
    ticketSelections: [{ ticketId: 'ticket-1', quantity: 1 }],
    participants: [
      {
        ticketId: 'ticket-1',
        firstName: 'Alice',
        lastName: 'Runner',
        email: 'alice@example.com',
        birthDate: '1990-05-04',
      },
    ],
    upsells: [],
    signatureImage: 'data:image/png;base64,abc',
    signatureMetadata: {},
    disclaimer: { read: true, accepted: true, rulebookAccepted: true },
    ...overrides,
  }
}

function jsonRequest(body: unknown) {
  const request = new Request('http://localhost/api/registrations/create', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return Object.assign(request, {
    cookies: { get: () => undefined },
  }) as unknown as import('next/server').NextRequest
}

function mockAuthedUser(userId: string | null) {
  createSupabaseServerMock.mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user: userId ? { id: userId, email: 'alice@example.com' } : null } }),
    },
    from(table: string) {
      if (table === 'registrations') {
        return {
          select() {
            return {
              or() {
                return { maybeSingle: async () => ({ data: null }) }
              },
            }
          },
        }
      }
      throw new Error(`Unexpected table on user-scoped client: ${table}`)
    },
  })
}

function createAdmin(
  overrides: {
    existingRegistration?: { id: string } | null
    existingRegistrationError?: { code: string; message: string } | null
    eventOverrides?: Record<string, unknown>
    rpcOverrides?: Record<string, (...args: any[]) => Promise<{ data?: unknown; error: unknown }>>
    ticketRows?: Array<Record<string, unknown>>
    groupRow?: Record<string, unknown> | null
    upsellRows?: Array<Record<string, unknown>>
    upsellInserts?: Array<Record<string, unknown>>
    registrationInserts?: Array<Record<string, unknown>>
    signatureInserts?: Array<Record<string, unknown>>
  } = {},
) {
  let registrationCount = 0
  const eventRow = { ...EVENT_ROW, ...overrides.eventOverrides }
  const ticketRows = overrides.ticketRows ?? [RANKED_TICKET_ROW]

  return {
    from(table: string) {
      if (table === 'events') {
        return {
          select() {
            return { eq() { return { single: async () => ({ data: eventRow, error: null }) } } }
          },
        }
      }
      if (table === 'tickets') {
        return {
          select() {
            const byIds = async (_column: string, ids: string[]) => ({
              data: ticketRows.filter((ticket) => ids.includes(ticket.id as string)),
              error: null,
            })
            return { in: byIds, eq: () => ({ in: byIds }) }
          },
        }
      }
      if (table === 'groups') {
        return {
          select() {
            return {
              eq() {
                return { maybeSingle: async () => ({ data: overrides.groupRow ?? null }) }
              },
            }
          },
          update() {
            return { eq: async () => ({ error: null }) }
          },
        }
      }
      if (table === 'upsells') {
        return {
          select() {
            return { eq() { return { or: async () => ({ data: overrides.upsellRows ?? [], error: null }) } } }
          },
        }
      }
      if (table === 'orders') {
        return {
          insert(payload: Record<string, unknown>) {
            return {
              select() {
                return {
                  single: async () => ({
                    data: { id: 'order-1', created_at: '2026-06-01T00:00:00.000Z', ...payload },
                    error: null,
                  }),
                }
              },
            }
          },
        }
      }
      if (table === 'registrations') {
        return {
          // Already-registered lookup for this PaymentIntent (admin: a session cannot see other requests' rows).
          select() {
            return {
              or() {
                return {
                  limit() {
                    return {
                      maybeSingle: async () => ({
                        data: overrides.existingRegistration ?? null,
                        error: overrides.existingRegistrationError ?? null,
                      }),
                    }
                  },
                }
              },
            }
          },
          insert(payload: Record<string, unknown>) {
            overrides.registrationInserts?.push(payload)
            return {
              select() {
                return {
                  single: async () => ({
                    data: { id: `reg-${++registrationCount}`, email: payload.email, ...payload },
                    error: null,
                  }),
                }
              },
            }
          },
          update() {
            return { eq: async () => ({ error: null }) }
          },
        }
      }
      if (table === 'registration_signatures') {
        return {
          insert: async (row: Record<string, unknown>) => {
            overrides.signatureInserts?.push(row)
            return { error: null }
          },
        }
      }
      if (table === 'registration_upsells') {
        return {
          insert: async (rows: Array<Record<string, unknown>>) => {
            overrides.upsellInserts?.push(...rows)
            return { error: null }
          },
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
    rpc: async (fn: string, args: unknown) => {
      if (overrides.rpcOverrides?.[fn]) return overrides.rpcOverrides[fn](args)
      if (fn === 'assign_bib_number') return { data: 1, error: null }
      if (fn === 'assign_selected_wave_to_registration') {
        return {
          data: { wave_index: 5, start_time: '2026-09-12T10:50:00.000Z', wave_capacity: 50, wave_position: 1 },
          error: null,
        }
      }
      if (fn === 'sync_registration_to_group_anchor') {
        return {
          data: { wave_index: 3, start_time: '2026-09-12T10:30:00.000Z', wave_capacity: 50, wave_position: 2 },
          error: null,
        }
      }
      return { error: null }
    },
  }
}

describe('POST /api/registrations/create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    qrCodeToDataURLMock.mockResolvedValue('data:image/png;base64,qr')
    sendMetaCapiEventMock.mockResolvedValue(undefined)
    sendAdminPushNotificationMock.mockResolvedValue(undefined)
    markResendContactAsRegisteredMock.mockResolvedValue(undefined)
    notifyAmbassadorRewardsForOrderMock.mockResolvedValue(undefined)
  })

  it('returns 400 when required fields are missing', async () => {
    mockAuthedUser('user-1')

    const response = await POST(jsonRequest(baseBody({ eventId: '' })))

    expect(response.status).toBe(400)
  })

  it('returns 422 when the signature or disclaimer acceptance is missing', async () => {
    mockAuthedUser('user-1')

    const response = await POST(
      jsonRequest(baseBody({ disclaimer: { read: true, accepted: false, rulebookAccepted: true } })),
    )

    expect(response.status).toBe(422)
  })

  it('returns 401 when the authenticated user does not match the userId in the body', async () => {
    mockAuthedUser('someone-else')

    const response = await POST(jsonRequest(baseBody()))

    expect(response.status).toBe(401)
  })

  it('returns 409 when a registration already exists for this PaymentIntent', async () => {
    paymentIntentsRetrieveMock.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      amount: 5000,
      currency: 'eur',
      metadata: {},
      payment_method_types: ['card'],
    })
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(createAdmin({ existingRegistration: { id: 'existing-reg' } }))

    const response = await POST(jsonRequest(baseBody()))

    expect(response.status).toBe(409)
  })

  it('fails closed when the already-registered lookup cannot run (never creates a second set of bibs)', async () => {
    paymentIntentsRetrieveMock.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      amount: 5000,
      currency: 'eur',
      metadata: {},
      payment_method_types: ['card'],
    })
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(
      createAdmin({ existingRegistrationError: { code: '42501', message: 'permission denied for table registrations' } }),
    )

    const response = await POST(jsonRequest(baseBody()))

    expect(response.status).toBe(500)
  })

  it('returns 400 when the PaymentIntent is not confirmed', async () => {
    mockAuthedUser('user-1')
    paymentIntentsRetrieveMock.mockResolvedValue({ id: 'pi_1', status: 'requires_payment_method' })

    const response = await POST(jsonRequest(baseBody()))

    expect(response.status).toBe(400)
  })

  it('returns 202 (pending) when the PaymentIntent is still processing', async () => {
    mockAuthedUser('user-1')
    paymentIntentsRetrieveMock.mockResolvedValue({ id: 'pi_1', status: 'processing' })

    const response = await POST(jsonRequest(baseBody()))
    const body = await response.json()

    expect(response.status).toBe(202)
    expect(body.pending).toBe(true)
  })

  it('creates a RANKED registration for a free order and sends the ticket email', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(createAdmin())

    const response = await POST(
      jsonRequest(
        baseBody({
          paymentIntentId: 'free_abc123',
          freeOrderMetadata: { currency: 'eur' },
        }),
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(sendTicketEmailMock).toHaveBeenCalledTimes(1)
    expect(sendTicketEmailMock.mock.calls[0][0]).toMatchObject({
      to: 'alice@example.com',
      eventTitle: EVENT_ROW.title,
      ticketName: RANKED_TICKET_ROW.name,
    })
    // Free orders have no receipt to send (amount is 0).
    expect(paymentIntentsRetrieveMock).not.toHaveBeenCalled()
  })

  describe('free T-shirt size', () => {
    const orderWithSize = (tshirtSize?: string) =>
      baseBody({
        paymentIntentId: 'free_abc123',
        freeOrderMetadata: { currency: 'eur' },
        participants: [{ ...baseBody().participants[0], ...(tshirtSize ? { tshirtSize } : {}) }],
      })

    it('stores the size the participant chose', async () => {
      mockAuthedUser('user-1')
      const registrationInserts: Array<Record<string, unknown>> = []
      supabaseAdminMock.mockReturnValue(createAdmin({ registrationInserts }))

      const response = await POST(jsonRequest(orderWithSize('L')))

      expect(response.status).toBe(200)
      expect(registrationInserts[0]).toMatchObject({ tshirt_size: 'L' })
    })

    it('ignores a size that is not on the list and writes nothing when none is sent', async () => {
      mockAuthedUser('user-1')
      const registrationInserts: Array<Record<string, unknown>> = []
      supabaseAdminMock.mockReturnValue(createAdmin({ registrationInserts }))

      await POST(jsonRequest(orderWithSize('XXXL')))
      await POST(jsonRequest(orderWithSize()))

      expect(registrationInserts).toHaveLength(2)
      for (const insert of registrationInserts) expect(insert).not.toHaveProperty('tshirt_size')
    })
  })

  it('creates a paid RANKED registration via a confirmed Stripe PaymentIntent', async () => {
    mockAuthedUser('user-1')
    paymentIntentsRetrieveMock.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      amount: 5000,
      currency: 'eur',
      metadata: {},
      payment_method_types: ['card'],
    })
    supabaseAdminMock.mockReturnValue(createAdmin())

    const response = await POST(jsonRequest(baseBody()))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(sendTicketEmailMock).toHaveBeenCalledTimes(1)
    expect(sendReceiptEmailMock).toHaveBeenCalledTimes(1)
  })

  describe('options chosen per participant', () => {
    const TSHIRT = { id: 'tshirt-1', name: 'T-shirt', type: 'tshirt', price_cents: 1200, currency: 'eur' }
    const twoParticipants = [
      { ticketId: 'ticket-1', firstName: 'Alice', lastName: 'Runner', email: 'alice@example.com', birthDate: '1990-05-04' },
      { ticketId: 'ticket-1', firstName: 'Bob', lastName: 'Runner', email: 'bob@example.com', birthDate: '1992-01-15' },
    ]
    const paidIntent = {
      id: 'pi_1',
      status: 'succeeded',
      amount: 5000,
      currency: 'eur',
      metadata: {},
      payment_method_types: ['card'],
    }

    it('stores each option on the registration of the participant who takes it', async () => {
      mockAuthedUser('user-1')
      paymentIntentsRetrieveMock.mockResolvedValue(paidIntent)
      const upsellInserts: Array<Record<string, unknown>> = []
      supabaseAdminMock.mockReturnValue(createAdmin({ upsellRows: [TSHIRT], upsellInserts }))

      const response = await POST(
        jsonRequest(
          baseBody({
            ticketSelections: [{ ticketId: 'ticket-1', quantity: 2 }],
            participants: twoParticipants,
            upsells: [
              {
                upsellId: 'tshirt-1',
                quantity: 1,
                meta: { assignments: [{ participantIndex: 1, quantity: 1, size: 'L' }] },
              },
            ],
          }),
        ),
      )

      expect(response.status).toBe(200)
      // Bob is the second participant: his registration is the second one created.
      expect(upsellInserts).toEqual([
        expect.objectContaining({ registration_id: 'reg-2', quantity: 1, meta: { sizes: ['L'] } }),
      ])
    })

    it('rejects a distribution that does not add up, before creating anything', async () => {
      mockAuthedUser('user-1')
      paymentIntentsRetrieveMock.mockResolvedValue(paidIntent)
      const upsellInserts: Array<Record<string, unknown>> = []
      supabaseAdminMock.mockReturnValue(createAdmin({ upsellRows: [TSHIRT], upsellInserts }))

      const response = await POST(
        jsonRequest(
          baseBody({
            ticketSelections: [{ ticketId: 'ticket-1', quantity: 2 }],
            participants: twoParticipants,
            upsells: [
              { upsellId: 'tshirt-1', quantity: 2, meta: { assignments: [{ participantIndex: 0, quantity: 1 }] } },
            ],
          }),
        ),
      )

      expect(response.status).toBe(422)
      expect(upsellInserts).toEqual([])
    })
  })

  it('assigns a bib number via the atomic RPC for a RANKED registration', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(createAdmin())

    const response = await POST(
      jsonRequest(baseBody({ paymentIntentId: 'free_abc123', freeOrderMetadata: { currency: 'eur' } })),
    )

    expect(response.status).toBe(200)
  })

  it('returns 422 without creating a registration when the event has no bib capacity configured', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(
      createAdmin({
        eventOverrides: { ranked_bib_capacity: null },
      }),
    )

    const response = await POST(
      jsonRequest(baseBody({ paymentIntentId: 'free_abc123', freeOrderMetadata: { currency: 'eur' } })),
    )
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body.error).toMatch(/dossard/i)
  })

  it('assigns the participant-selected SAS OPEN via the atomic RPC', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(createAdmin({ ticketRows: [OPEN_TICKET_ROW] }))

    const response = await POST(
      jsonRequest(
        baseBody({
          paymentIntentId: 'free_abc123',
          freeOrderMetadata: { currency: 'eur' },
          participants: [
            {
              ticketId: 'ticket-1',
              firstName: 'Alice',
              lastName: 'Runner',
              email: 'alice@example.com',
              birthDate: '1990-05-04',
              distanceIdealKm: '20',
              distanceMinKm: '10',
              selectedWaveIndex: 5,
            },
          ],
        }),
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
  })

  describe('minors', () => {
    const MINOR = {
      ticketId: 'ticket-1',
      firstName: 'Léa',
      lastName: 'Runner',
      email: 'lea@example.com',
      birthDate: '2009-09-13',
      guardianName: 'Anne Runner',
      guardianPhone: '0612345678',
      referentName: 'Anne Runner',
      referentPhone: '0612345678',
      selectedWaveIndex: 5,
    }
    const freeOrder = (participant: Record<string, unknown>, minorAttestation = true) =>
      baseBody({
        paymentIntentId: 'free_abc123',
        freeOrderMetadata: { currency: 'eur' },
        participants: [participant],
        disclaimer: { read: true, accepted: true, rulebookAccepted: true, minorAttestation },
      })

    it('registers a 17 year old on OPEN as a minor and keeps the contacts with the waiver', async () => {
      mockAuthedUser('user-1')
      const registrationInserts: Array<Record<string, unknown>> = []
      const signatureInserts: Array<Record<string, unknown>> = []
      supabaseAdminMock.mockReturnValue(
        createAdmin({ ticketRows: [OPEN_TICKET_ROW], eventOverrides: { minimum_age: 16 }, registrationInserts, signatureInserts }),
      )

      const response = await POST(jsonRequest(freeOrder(MINOR)))

      expect(response.status).toBe(200)
      expect(registrationInserts[0]).toMatchObject({ is_minor: true })
      const signed = JSON.parse(signatureInserts[0].signature_data as string)
      expect(signed.participant).toMatchObject({ guardianName: 'Anne Runner', referentPhone: '0612345678' })
      expect(signed.disclaimer).toMatchObject({ minorAttestation: true })
    })

    it('refuses a minor when the signer did not attest being the legal representative, and creates nothing', async () => {
      mockAuthedUser('user-1')
      const registrationInserts: Array<Record<string, unknown>> = []
      supabaseAdminMock.mockReturnValue(
        createAdmin({ ticketRows: [OPEN_TICKET_ROW], eventOverrides: { minimum_age: 16 }, registrationInserts }),
      )

      const response = await POST(jsonRequest(freeOrder(MINOR, false)))

      expect(response.status).toBe(422)
      expect((await response.json()).error).toContain('représentant légal')
      expect(registrationInserts).toHaveLength(0)
    })

    it('marks an adult as not a minor and stores no minor contact', async () => {
      mockAuthedUser('user-1')
      const registrationInserts: Array<Record<string, unknown>> = []
      const signatureInserts: Array<Record<string, unknown>> = []
      supabaseAdminMock.mockReturnValue(
        createAdmin({ ticketRows: [OPEN_TICKET_ROW], eventOverrides: { minimum_age: 16 }, registrationInserts, signatureInserts }),
      )

      const response = await POST(jsonRequest(freeOrder({ ...MINOR, birthDate: '1990-05-04', guardianName: undefined, guardianPhone: undefined, referentName: undefined, referentPhone: undefined })))

      expect(response.status).toBe(200)
      expect(registrationInserts[0]).toMatchObject({ is_minor: false })
      expect(JSON.parse(signatureInserts[0].signature_data as string).participant).not.toHaveProperty('guardianName')
    })

    it('refuses a minor when the edition is limited to adults, and creates nothing', async () => {
      mockAuthedUser('user-1')
      const registrationInserts: Array<Record<string, unknown>> = []
      supabaseAdminMock.mockReturnValue(createAdmin({ ticketRows: [OPEN_TICKET_ROW], registrationInserts }))

      const response = await POST(jsonRequest(freeOrder(MINOR)))

      expect(response.status).toBe(422)
      expect((await response.json()).error).toContain('18 ans')
      expect(registrationInserts).toHaveLength(0)
    })

    it('refuses a minor on the RANKED format', async () => {
      mockAuthedUser('user-1')
      supabaseAdminMock.mockReturnValue(createAdmin({ ticketRows: [RANKED_TICKET_ROW], eventOverrides: { minimum_age: 16 } }))

      const response = await POST(jsonRequest(freeOrder(MINOR)))

      expect(response.status).toBe(422)
      expect((await response.json()).error).toContain('OPEN')
    })

    it('refuses a minor without the adult on site', async () => {
      mockAuthedUser('user-1')
      supabaseAdminMock.mockReturnValue(createAdmin({ ticketRows: [OPEN_TICKET_ROW], eventOverrides: { minimum_age: 16 } }))

      const response = await POST(jsonRequest(freeOrder({ ...MINOR, referentName: '', referentPhone: '' })))

      expect(response.status).toBe(422)
      expect((await response.json()).error).toContain('adulte référent')
    })

    it('names the signer on the waiver, who is not a participant when a parent orders for minors', async () => {
      mockAuthedUser('user-1')
      const signatureInserts: Array<Record<string, unknown>> = []
      supabaseAdminMock.mockReturnValue(
        createAdmin({ ticketRows: [OPEN_TICKET_ROW], eventOverrides: { minimum_age: 16 }, signatureInserts }),
      )

      await POST(jsonRequest(freeOrder(MINOR)))

      const signed = JSON.parse(signatureInserts[0].signature_data as string)
      expect(signed.signer).toEqual({ userId: 'user-1', email: 'alice@example.com' })
      expect(signed.participant.email).toBe('lea@example.com')
    })

    describe('orders with several participants', () => {
      const SECOND_MINOR = { ...MINOR, firstName: 'Noé', email: 'noe@example.com', birthDate: '2010-01-20', selectedWaveIndex: 6 }
      const ADULT = {
        ticketId: 'ticket-1',
        firstName: 'Anne',
        lastName: 'Runner',
        email: 'anne@example.com',
        birthDate: '1980-02-10',
        selectedWaveIndex: 5,
      }
      const groupOrder = (participants: Array<Record<string, unknown>>, minorAttestation?: boolean) =>
        baseBody({
          paymentIntentId: 'free_abc123',
          freeOrderMetadata: { currency: 'eur' },
          ticketSelections: [{ ticketId: 'ticket-1', quantity: participants.length }],
          participants,
          disclaimer: { read: true, accepted: true, rulebookAccepted: true, groupAttestation: true, minorAttestation },
        })

      it('registers two minors with one attestation, one bib and one waiver each, all naming the same signer', async () => {
        mockAuthedUser('user-1')
        const registrationInserts: Array<Record<string, unknown>> = []
        const signatureInserts: Array<Record<string, unknown>> = []
        supabaseAdminMock.mockReturnValue(
          createAdmin({ ticketRows: [OPEN_TICKET_ROW], eventOverrides: { minimum_age: 16 }, registrationInserts, signatureInserts }),
        )

        const response = await POST(jsonRequest(groupOrder([MINOR, SECOND_MINOR], true)))

        expect(response.status).toBe(200)
        expect(registrationInserts.map((row) => row.is_minor)).toEqual([true, true])
        const signed = signatureInserts.map((row) => JSON.parse(row.signature_data as string))
        expect(signed.map((item) => item.participant.firstName)).toEqual(['Léa', 'Noé'])
        expect(signed.every((item) => item.signer.userId === 'user-1' && item.disclaimer.minorAttestation === true)).toBe(true)
      })

      it('flags only the minor in a parent and child order, and keeps minor contacts off the adult', async () => {
        mockAuthedUser('user-1')
        const registrationInserts: Array<Record<string, unknown>> = []
        const signatureInserts: Array<Record<string, unknown>> = []
        supabaseAdminMock.mockReturnValue(
          createAdmin({ ticketRows: [OPEN_TICKET_ROW], eventOverrides: { minimum_age: 16 }, registrationInserts, signatureInserts }),
        )

        const response = await POST(jsonRequest(groupOrder([ADULT, MINOR], true)))

        expect(response.status).toBe(200)
        expect(registrationInserts.map((row) => row.is_minor)).toEqual([false, true])
        const signed = signatureInserts.map((row) => JSON.parse(row.signature_data as string))
        expect(signed[0].participant).not.toHaveProperty('guardianName')
        expect(signed[1].participant).toMatchObject({ guardianName: 'Anne Runner' })
      })

      it('needs the attestation as soon as one of the participants is a minor', async () => {
        mockAuthedUser('user-1')
        const registrationInserts: Array<Record<string, unknown>> = []
        supabaseAdminMock.mockReturnValue(
          createAdmin({ ticketRows: [OPEN_TICKET_ROW], eventOverrides: { minimum_age: 16 }, registrationInserts }),
        )

        const response = await POST(jsonRequest(groupOrder([ADULT, MINOR], false)))

        expect(response.status).toBe(422)
        expect(registrationInserts).toHaveLength(0)
      })

      it('does not ask for the attestation when every participant is an adult', async () => {
        mockAuthedUser('user-1')
        supabaseAdminMock.mockReturnValue(
          createAdmin({ ticketRows: [OPEN_TICKET_ROW], eventOverrides: { minimum_age: 16 } }),
        )

        const response = await POST(jsonRequest(groupOrder([ADULT, { ...ADULT, email: 'paul@example.com' }])))

        expect(response.status).toBe(200)
      })

      it('refuses the whole order when one of the minors is under 16, and creates nothing', async () => {
        mockAuthedUser('user-1')
        const registrationInserts: Array<Record<string, unknown>> = []
        supabaseAdminMock.mockReturnValue(
          createAdmin({ ticketRows: [OPEN_TICKET_ROW], eventOverrides: { minimum_age: 16 }, registrationInserts }),
        )

        const response = await POST(jsonRequest(groupOrder([MINOR, { ...SECOND_MINOR, birthDate: '2012-03-01' }], true)))

        expect(response.status).toBe(422)
        expect((await response.json()).error).toContain('Participant 2')
        expect(registrationInserts).toHaveLength(0)
      })

      it('refuses the whole order when the second minor lacks the adult on site', async () => {
        mockAuthedUser('user-1')
        const registrationInserts: Array<Record<string, unknown>> = []
        supabaseAdminMock.mockReturnValue(
          createAdmin({ ticketRows: [OPEN_TICKET_ROW], eventOverrides: { minimum_age: 16 }, registrationInserts }),
        )

        const response = await POST(jsonRequest(groupOrder([MINOR, { ...SECOND_MINOR, referentName: '', referentPhone: '' }], true)))

        expect(response.status).toBe(422)
        expect((await response.json()).error).toContain('Participant 2')
        expect(registrationInserts).toHaveLength(0)
      })
    })
  })

  it('returns 422 when an OPEN participant submits no selectedWaveIndex and has no group anchor', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(createAdmin({ ticketRows: [OPEN_TICKET_ROW] }))

    const response = await POST(
      jsonRequest(
        baseBody({
          paymentIntentId: 'free_abc123',
          freeOrderMetadata: { currency: 'eur' },
          participants: [
            {
              ticketId: 'ticket-1',
              firstName: 'Alice',
              lastName: 'Runner',
              email: 'alice@example.com',
              birthDate: '1990-05-04',
              distanceIdealKm: '20',
              distanceMinKm: '10',
            },
          ],
        }),
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body.error).toMatch(/SAS_SELECTION_REQUIRED/)
  })

  it('returns 422 when the selected wave is no longer available at confirmation time', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(
      createAdmin({
        ticketRows: [OPEN_TICKET_ROW],
        rpcOverrides: {
          assign_selected_wave_to_registration: async () => ({
            data: null,
            error: new Error('SELECTED_WAVE_UNAVAILABLE: wave 5 is full'),
          }),
        },
      }),
    )

    const response = await POST(
      jsonRequest(
        baseBody({
          paymentIntentId: 'free_abc123',
          freeOrderMetadata: { currency: 'eur' },
          participants: [
            {
              ticketId: 'ticket-1',
              firstName: 'Alice',
              lastName: 'Runner',
              email: 'alice@example.com',
              birthDate: '1990-05-04',
              distanceIdealKm: '20',
              distanceMinKm: '10',
              selectedWaveIndex: 5,
            },
          ],
        }),
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body.error).toMatch(/SAS choisi indisponible/)
  })

  it('forces a group-anchored member onto the anchor wave, ignoring any submitted selectedWaveIndex', async () => {
    mockAuthedUser('user-1')
    let syncCalledWithWaveIndex: number | null = null
    supabaseAdminMock.mockReturnValue(
      createAdmin({
        ticketRows: [OPEN_TICKET_ROW],
        groupRow: { id: 'group-1', anchor_event_id: 'event-1', anchor_wave_index: 3 },
        rpcOverrides: {
          sync_registration_to_group_anchor: async (args: any) => {
            syncCalledWithWaveIndex = args.p_wave_index
            return {
              data: { wave_index: 3, start_time: '2026-09-12T10:30:00.000Z', wave_capacity: 50, wave_position: 2 },
              error: null,
            }
          },
        },
      }),
    )

    const response = await POST(
      jsonRequest(
        baseBody({
          paymentIntentId: 'free_abc123',
          freeOrderMetadata: { currency: 'eur' },
          groupId: 'group-1',
          participants: [
            {
              ticketId: 'ticket-1',
              firstName: 'Alice',
              lastName: 'Runner',
              email: 'alice@example.com',
              birthDate: '1990-05-04',
              distanceIdealKm: '20',
              distanceMinKm: '10',
              // Deliberately different from the anchor (3) — must be ignored server-side.
              selectedWaveIndex: 9,
            },
          ],
        }),
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(syncCalledWithWaveIndex).toBe(3)
  })

  it('returns 422 when the bib RPC reports capacity exhaustion', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(
      createAdmin({
        rpcOverrides: {
          assign_bib_number: async () => ({
            data: null,
            error: new Error('BIB_CAPACITY_EXHAUSTED: no bib number available'),
          }),
        },
      }),
    )

    const response = await POST(
      jsonRequest(baseBody({ paymentIntentId: 'free_abc123', freeOrderMetadata: { currency: 'eur' } })),
    )
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body.error).toMatch(/dossard/i)
  })

  describe('open companion bib', () => {
    const COMPANION_RANKED_ROW = {
      ...RANKED_TICKET_ROW,
      operations_config: {
        open_companion: { ticket_id: 'open-1', price_cents: 2900, ranked_max_duration_minutes: 230, min_gap_minutes: 20 },
      },
    }
    const COMPANION_OPEN_ROW = { ...OPEN_TICKET_ROW, id: 'open-1', operations_config: { departure_mode: 'wave' } }
    const companionIntent = (metadata: Record<string, string>) => ({
      id: 'pi_1',
      status: 'succeeded',
      amount: 9900,
      currency: 'eur',
      metadata: { ticket_prices: '7000', ...metadata },
      payment_method_types: ['card'],
    })
    const PAID_COMPANION = { companion_participants: '0', companion_waves: '7', companion_prices: '2900' }

    it('creates a second OPEN registration linked to the RANKED one, on the SAS paid for', async () => {
      mockAuthedUser('user-1')
      paymentIntentsRetrieveMock.mockResolvedValue(companionIntent(PAID_COMPANION))
      const registrationInserts: Array<Record<string, unknown>> = []
      const waveCalls: Array<Record<string, unknown>> = []
      supabaseAdminMock.mockReturnValue(
        createAdmin({
          ticketRows: [COMPANION_RANKED_ROW, COMPANION_OPEN_ROW],
          registrationInserts,
          rpcOverrides: {
            assign_selected_wave_to_registration: async (args) => {
              waveCalls.push(args as Record<string, unknown>)
              return {
                data: { wave_index: 7, start_time: '2026-09-12T11:10:00.000Z', wave_capacity: 50, wave_position: 4 },
                error: null,
              }
            },
          },
        }),
      )

      const response = await POST(jsonRequest(baseBody()))

      expect(response.status).toBe(200)
      expect(registrationInserts).toHaveLength(2)
      expect(registrationInserts[1]).toMatchObject({
        ticket_id: 'open-1',
        companion_of: 'reg-1',
        paid_ticket_cents: 2900,
        flexible_refund: false,
        promotional_code_id: null,
        event_price_tier_id: null,
        email: 'alice@example.com',
      })
      expect(waveCalls).toEqual([{ p_event_id: 'event-1', p_registration_id: 'reg-2', p_wave_index: 7 }])
      // One ticket email per bib, and the receipt carries the companion on its own line.
      expect(sendTicketEmailMock).toHaveBeenCalledTimes(2)
      expect(sendTicketEmailMock.mock.calls.map(([mail]) => mail.ticketName).sort()).toEqual(['Fury RANKED', 'Primal OPEN'])
      const receipt = sendReceiptEmailMock.mock.calls[0][0]
      expect(receipt.participants[0].lines.map((line: { description: string }) => line.description)).toEqual([
        'Fury RANKED',
        'Option OPEN : Primal OPEN',
      ])
      expect(receipt.subtotal).toBe(79)
    })

    it('never forces the group anchor onto the companion bib', async () => {
      mockAuthedUser('user-1')
      paymentIntentsRetrieveMock.mockResolvedValue(companionIntent(PAID_COMPANION))
      const waveCalls: string[] = []
      supabaseAdminMock.mockReturnValue(
        createAdmin({
          ticketRows: [COMPANION_RANKED_ROW, COMPANION_OPEN_ROW],
          groupRow: { id: 'group-1', anchor_event_id: 'event-1', anchor_wave_index: 3 },
          rpcOverrides: {
            sync_registration_to_group_anchor: async () => {
              waveCalls.push('anchor')
              return { error: null }
            },
          },
        }),
      )

      const response = await POST(jsonRequest(baseBody({ groupId: 'group-1' })))

      expect(response.status).toBe(200)
      expect(waveCalls).toEqual([])
    })

    it('creates no companion when the payment did not include one, whatever the request says', async () => {
      mockAuthedUser('user-1')
      paymentIntentsRetrieveMock.mockResolvedValue(companionIntent({}))
      const registrationInserts: Array<Record<string, unknown>> = []
      supabaseAdminMock.mockReturnValue(
        createAdmin({ ticketRows: [COMPANION_RANKED_ROW, COMPANION_OPEN_ROW], registrationInserts }),
      )

      const response = await POST(
        jsonRequest(baseBody({ participants: [{ ...baseBody().participants[0], companionWaveIndex: 7 }] })),
      )

      expect(response.status).toBe(200)
      expect(registrationInserts).toHaveLength(1)
    })

    it('refuses with 422 when the SAS filled up between payment and registration', async () => {
      mockAuthedUser('user-1')
      paymentIntentsRetrieveMock.mockResolvedValue(companionIntent(PAID_COMPANION))
      supabaseAdminMock.mockReturnValue(
        createAdmin({
          ticketRows: [COMPANION_RANKED_ROW, COMPANION_OPEN_ROW],
          rpcOverrides: {
            assign_selected_wave_to_registration: async () => ({
              error: new Error('SELECTED_WAVE_UNAVAILABLE: wave 7 unavailable'),
            }),
          },
        }),
      )

      const response = await POST(jsonRequest(baseBody()))

      expect(response.status).toBe(422)
    })
  })
})
