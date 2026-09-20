import { describe, expect, it, vi } from 'vitest'
import { assignBibNumber, transferBibNumber, BibCapacityExhaustedError } from './bibNumber'

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
      maxBibNumber: 500,
    })

    expect(result).toBe(42)
    expect(admin.rpc).toHaveBeenCalledWith('assign_bib_number', {
      p_event_id: 'event-1',
      p_registration_id: 'reg-1',
      p_race_format: 'open',
      p_max_number: 500,
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
        maxBibNumber: 10,
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
        maxBibNumber: 10,
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
      maxBibNumber: 500,
    })

    expect(result).toBe(7)
    expect(admin.rpc).toHaveBeenCalledWith('transfer_bib_number', {
      p_registration_id: 'reg-1',
      p_event_id: 'event-1',
      p_target_format: 'open',
      p_max_number: 500,
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
        maxBibNumber: 10,
      }),
    ).rejects.toBeInstanceOf(BibCapacityExhaustedError)
  })
})
