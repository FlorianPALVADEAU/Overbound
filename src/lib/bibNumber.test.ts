import { describe, expect, it, vi } from 'vitest'
import { assignBibNumber, transferBibNumber, getBibRange, BibCapacityExhaustedError } from './bibNumber'

const buildAdmin = (rpcImpl: (...args: any[]) => any) => ({
  rpc: vi.fn(rpcImpl),
})

describe('assignBibNumber', () => {
  it('returns the assigned bib number on success', async () => {
    const admin = buildAdmin(() => Promise.resolve({ data: 42, error: null }))

    const result = await assignBibNumber({
      admin,
      eventId: 'event-1',
      registrationId: 'reg-1',
      raceFormat: 'open',
      bibRange: { min: 1001, max: 6000 },
    })

    expect(result).toBe(42)
    expect(admin.rpc).toHaveBeenCalledWith('assign_bib_number', {
      p_event_id: 'event-1',
      p_registration_id: 'reg-1',
      p_race_format: 'open',
      p_min_number: 1001,
      p_max_number: 6000,
    })
  })

  it('throws BibCapacityExhaustedError when the RPC reports capacity exhaustion', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({ data: null, error: new Error('BIB_CAPACITY_EXHAUSTED: no bib number available') }),
    )

    await expect(
      assignBibNumber({
        admin,
        eventId: 'event-1',
        registrationId: 'reg-1',
        raceFormat: 'ranked',
        bibRange: { min: 1, max: 10 },
      }),
    ).rejects.toBeInstanceOf(BibCapacityExhaustedError)
  })

  it('rethrows unrelated RPC errors unchanged', async () => {
    const admin = buildAdmin(() => Promise.resolve({ data: null, error: new Error('connection reset') }))

    await expect(
      assignBibNumber({
        admin,
        eventId: 'event-1',
        registrationId: 'reg-1',
        raceFormat: 'open',
        bibRange: { min: 1, max: 10 },
      }),
    ).rejects.toThrow('connection reset')
  })
})

describe('transferBibNumber', () => {
  it('returns the new bib number on success', async () => {
    const admin = buildAdmin(() => Promise.resolve({ data: 7, error: null }))

    const result = await transferBibNumber({
      admin,
      registrationId: 'reg-1',
      eventId: 'event-1',
      targetFormat: 'open',
      bibRange: { min: 1001, max: 6000 },
    })

    expect(result).toBe(7)
    expect(admin.rpc).toHaveBeenCalledWith('transfer_bib_number', {
      p_registration_id: 'reg-1',
      p_event_id: 'event-1',
      p_target_format: 'open',
      p_min_number: 1001,
      p_max_number: 6000,
    })
  })

  it('throws BibCapacityExhaustedError when target format has no capacity left', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({ data: null, error: new Error('BIB_CAPACITY_EXHAUSTED: no bib number available') }),
    )

    await expect(
      transferBibNumber({
        admin,
        registrationId: 'reg-1',
        eventId: 'event-1',
        targetFormat: 'ranked',
        bibRange: { min: 1, max: 10 },
      }),
    ).rejects.toBeInstanceOf(BibCapacityExhaustedError)
  })
})

describe('getBibRange', () => {
  const event = { capacity: 6000, ranked_bib_capacity: 1000 }

  it('RANKED prend 1..ranked, OPEN prend ranked+1..capacité totale', () => {
    expect(getBibRange(event, 'ranked')).toEqual({ min: 1, max: 1000 })
    expect(getBibRange(event, 'open')).toEqual({ min: 1001, max: 6000 })
  })

  it('OPEN prend toute la plage quand aucun RANKED n\'est réservé', () => {
    expect(getBibRange({ capacity: 300, ranked_bib_capacity: null }, 'open')).toEqual({ min: 1, max: 300 })
    expect(getBibRange({ capacity: 300, ranked_bib_capacity: null }, 'ranked')).toBeNull()
  })

  it('renvoie null si la capacité est absente, ou si ranked dépasse le total', () => {
    expect(getBibRange({ capacity: 0, ranked_bib_capacity: 10 }, 'open')).toBeNull()
    expect(getBibRange({ capacity: 100, ranked_bib_capacity: 150 }, 'ranked')).toBeNull()
  })

  it('renvoie null pour OPEN quand RANKED consomme toute la capacité', () => {
    expect(getBibRange({ capacity: 100, ranked_bib_capacity: 100 }, 'open')).toBeNull()
  })
})
