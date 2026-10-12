import { describe, expect, it } from 'vitest'
import { applyTierDiscount, priceParticipants } from './participantPricing'
import { openTicket, participantsOn, rankedTicket, tier } from './testFixtures'

describe('priceParticipants', () => {
  const tickets = [openTicket(), rankedTicket()]

  it('applies each participant their own tier', () => {
    const result = priceParticipants(participantsOn('open', 'ranked'), tickets, [tier()], ['early', null])
    expect(result.ok && result.value.map((p) => p.unitPriceCents)).toEqual([4000, 7000])
  })

  it('keeps the format resolved by the caller', () => {
    const result = priceParticipants(participantsOn('ranked'), tickets, [], [null])
    expect(result.ok && result.value[0]?.isOpenFormat).toBe(false)
  })

  it('fails on a ticket that is not part of the event', () => {
    const result = priceParticipants(participantsOn('ghost'), tickets, [], [null])
    expect(result).toEqual({ ok: false, error: { kind: 'UNKNOWN_TICKET', ticketId: 'ghost' } })
  })

  it('fails on a ticket without a price', () => {
    const result = priceParticipants(participantsOn('open'), [openTicket({ finalPriceCents: null })], [], [null])
    expect(result.ok ? null : result.error.kind).toBe('TICKET_PRICE_MISSING')
  })
})

describe('applyTierDiscount', () => {
  it('rounds to the nearest cent', () => {
    expect(applyTierDiscount(4999, 15)).toBe(4249)
  })
})
