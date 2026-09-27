import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { POST } from './route'

const EVENT_ID = 'aaaaaaaa-1111-4111-8111-111111111111'
const UPSELL_ID = 'bbbbbbbb-2222-4222-8222-222222222222'

function buildRequest(body: unknown) {
  return new Request('http://localhost/api/promotions/validate', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as any
}

type PromoRow = {
  id: string
  code: string
  description?: string | null
  discount_percent?: number | null
  discount_amount?: number | null
  currency?: string
  valid_from?: string | null
  valid_until?: string | null
  is_active?: boolean
  usage_limit?: number | null
  used_count?: number
  target_upsell_id?: string | null
  events?: Array<{ event_id: string }>
  ambassadors?: Array<{ id: string }>
}

const BASE_PROMO: PromoRow = {
  id: 'promo-1',
  code: 'PRODUCT20',
  discount_percent: 20,
  discount_amount: null,
  currency: 'eur',
  valid_from: null,
  valid_until: null,
  is_active: true,
  usage_limit: null,
  used_count: 0,
  target_upsell_id: null,
  events: [],
  ambassadors: [],
}

/**
 * Builds a chainable admin stub covering:
 * - promotional_codes lookup by the incoming code (.ilike)
 * - upsells lookup for the target-upsell-sold-on-event check
 * - promotional_codes lookup by existingCodes (.in), for the quota check
 */
function buildAdmin({
  promo,
  upsellSoldOnEvent = true,
  existingPromoRows = [],
}: {
  promo: PromoRow | null
  upsellSoldOnEvent?: boolean
  existingPromoRows?: PromoRow[]
}) {
  return {
    from: (table: string) => {
      if (table === 'promotional_codes') {
        return {
          select: (columns: string) => {
            // Distinguish the incoming-code lookup (.ilike chain) from the
            // existingCodes lookup (.in chain) by the selected columns,
            // same as the two real call sites in the route.
            if (columns.includes('discount_percent')) {
              return { ilike: () => ({ maybeSingle: async () => ({ data: promo, error: null }) }) }
            }
            return { in: async () => ({ data: existingPromoRows, error: null }) }
          },
        }
      }
      if (table === 'upsells') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                or: () => ({
                  maybeSingle: async () => ({
                    data: upsellSoldOnEvent ? { id: UPSELL_ID } : null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'event_price_tiers') {
        return { select: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }) }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }
}

beforeEach(() => {
  supabaseAdminMock.mockReset()
})

describe('POST /api/promotions/validate — product-line discount targeting (FDR-0014 addendum)', () => {
  it('accepts a product-scoped code whose target upsell is sold on this event', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({ promo: { ...BASE_PROMO, target_upsell_id: UPSELL_ID }, upsellSoldOnEvent: true }),
    )

    const response = await POST(buildRequest({ code: 'PRODUCT20', eventId: EVENT_ID }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.promotionalCode).toMatchObject({ code: 'PRODUCT20', target_upsell_id: UPSELL_ID })
  })

  // FDR-0014 addendum §6: rejected explicitly -- distinct from "sold but
  // not in the cart", which is a silent 0-discount at pricing time, not an
  // error here.
  it('rejects a product-scoped code with an explicit error when its target upsell is not sold on this event', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({ promo: { ...BASE_PROMO, target_upsell_id: UPSELL_ID }, upsellSoldOnEvent: false }),
    )

    const response = await POST(buildRequest({ code: 'PRODUCT20', eventId: EVENT_ID }))
    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.error).toMatch(/pas applicable pour cet événement/)
  })

  it('accepts one ticket-scoped code and one product-scoped code together', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({
        promo: { ...BASE_PROMO, code: 'PRODUCT20', target_upsell_id: UPSELL_ID },
        upsellSoldOnEvent: true,
        existingPromoRows: [{ ...BASE_PROMO, code: 'TICKET10', target_upsell_id: null }],
      }),
    )

    const response = await POST(
      buildRequest({ code: 'PRODUCT20', eventId: EVENT_ID, existingCodes: ['TICKET10'] }),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.promotionalCode.code).toBe('PRODUCT20')
  })

  it('rejects a second product-scoped code when one is already applied', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({
        promo: { ...BASE_PROMO, code: 'PRODUCT20', target_upsell_id: UPSELL_ID },
        upsellSoldOnEvent: true,
        existingPromoRows: [
          { ...BASE_PROMO, code: 'PRODUCTOTHER', target_upsell_id: 'other-upsell-id' },
        ],
      }),
    )

    const response = await POST(
      buildRequest({ code: 'PRODUCT20', eventId: EVENT_ID, existingCodes: ['PRODUCTOTHER'] }),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error).toMatch(/code promo produit/)
  })

  it('rejects a second ticket-scoped code when one is already applied, independent of any product code quota', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({
        promo: { ...BASE_PROMO, code: 'TICKET20', target_upsell_id: null },
        existingPromoRows: [{ ...BASE_PROMO, code: 'TICKET10', target_upsell_id: null }],
      }),
    )

    const response = await POST(
      buildRequest({ code: 'TICKET20', eventId: EVENT_ID, existingCodes: ['TICKET10'] }),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error).toMatch(/code promo billet/)
  })
})
