import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock } = vi.hoisted(() => ({ supabaseAdminMock: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))

import { loadPublicEventDetail } from './loadEventDetail'

const EVENT_ID = '3d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'

function mockDatabase({
  event,
  eventError = null,
  count = 0,
  countError = null,
}: {
  event: Record<string, unknown> | null
  eventError?: unknown
  count?: number
  countError?: unknown
}) {
  const eventQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: event, error: eventError }),
  }
  const countQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockResolvedValue({ count, error: countError }),
  }
  supabaseAdminMock.mockReturnValue({
    from: vi.fn((table: string) => (table === 'events' ? eventQuery : countQuery)),
  })
  return { eventQuery }
}

const onSaleEvent = {
  id: EVENT_ID,
  slug: 'overbound-paris',
  status: 'on_sale',
  capacity: 100,
  date: '2099-09-12T08:00:00.000Z',
  tickets: [{ id: 'ticket-1', name: 'OPEN', requires_document: true, document_types: ['medical'] }],
}

describe('loadPublicEventDetail', () => {
  beforeEach(() => {
    supabaseAdminMock.mockReset()
  })

  it('returns the event with its remaining spots, looked up by slug', async () => {
    const { eventQuery } = mockDatabase({ event: onSaleEvent, count: 30 })

    const detail = await loadPublicEventDetail('overbound-paris')

    expect(eventQuery.eq).toHaveBeenCalledWith('slug', 'overbound-paris')
    expect(detail?.availableSpots).toBe(70)
    expect(detail?.event.tickets?.[0]).toMatchObject({ requires_document: false, document_types: [] })
  })

  it('looks the event up by id when given a UUID', async () => {
    const { eventQuery } = mockDatabase({ event: onSaleEvent })

    await loadPublicEventDetail(EVENT_ID)

    expect(eventQuery.eq).toHaveBeenCalledWith('id', EVENT_ID)
  })

  it('never reports negative remaining spots', async () => {
    mockDatabase({ event: onSaleEvent, count: 130 })

    await expect(loadPublicEventDetail(EVENT_ID)).resolves.toMatchObject({ availableSpots: 0 })
  })

  it('returns null when the event does not exist', async () => {
    mockDatabase({ event: null })

    await expect(loadPublicEventDetail('unknown')).resolves.toBeNull()
  })

  it('throws on a database error', async () => {
    const dbError = new Error('connection refused')
    mockDatabase({ event: null, eventError: dbError })

    await expect(loadPublicEventDetail(EVENT_ID)).rejects.toBe(dbError)
  })

  it('throws when the registration count fails', async () => {
    const countError = new Error('timeout')
    mockDatabase({ event: onSaleEvent, countError })

    await expect(loadPublicEventDetail(EVENT_ID)).rejects.toBe(countError)
  })
})
