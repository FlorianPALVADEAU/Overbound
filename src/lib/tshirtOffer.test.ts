import { describe, expect, it } from 'vitest'
import {
  buildTshirtOffer,
  isParticipantOffered,
  isTshirtSize,
  parseTshirtQuota,
  tshirtHeadline,
  tshirtUrgency,
} from './tshirtOffer'

describe('parseTshirtQuota', () => {
  it('keeps a positive integer', () => {
    expect(parseTshirtQuota(60)).toBe(60)
    expect(parseTshirtQuota('60')).toBe(60)
  })

  it('turns anything else into "no offer"', () => {
    for (const value of [0, -3, '', 'abc', null, undefined, 2.5]) expect(parseTshirtQuota(value)).toBeNull()
  })
})

describe('buildTshirtOffer', () => {
  it('returns null when the event has no quota', () => {
    expect(buildTshirtOffer(null, 12)).toBeNull()
  })

  it('counts what is left', () => {
    expect(buildTshirtOffer(60, 45)).toEqual({ quota: 60, claimed: 45, remaining: 15 })
  })

  it('never goes below zero once the stock is gone', () => {
    expect(buildTshirtOffer(60, 80)?.remaining).toBe(0)
  })
})

describe('isParticipantOffered', () => {
  const offer = buildTshirtOffer(60, 58)

  it('covers the first participants of the order only', () => {
    expect([0, 1, 2].map((index) => isParticipantOffered(offer, index))).toEqual([true, true, false])
  })

  it('offers nothing without an offer or without stock', () => {
    expect(isParticipantOffered(null, 0)).toBe(false)
    expect(isParticipantOffered(buildTshirtOffer(60, 60), 0)).toBe(false)
  })
})

describe('tshirtUrgency', () => {
  it('sharpens as the stock runs out', () => {
    expect(tshirtUrgency(buildTshirtOffer(60, 5)!)).toBe('open')
    expect(tshirtUrgency(buildTshirtOffer(60, 45)!)).toBe('low')
    expect(tshirtUrgency(buildTshirtOffer(60, 55)!)).toBe('last')
  })
})

describe('isTshirtSize', () => {
  it('accepts a listed size and rejects the rest', () => {
    expect(isTshirtSize('M')).toBe(true)
    expect(isTshirtSize('XXXL')).toBe(false)
    expect(isTshirtSize(undefined)).toBe(false)
  })
})

describe('tshirtHeadline', () => {
  it('announces the offer while stock is wide', () => {
    expect(tshirtHeadline(buildTshirtOffer(60, 5)!)).toBe('T-shirt offert aux 60 premiers')
  })

  it('switches to what is left once it runs low', () => {
    expect(tshirtHeadline(buildTshirtOffer(60, 45)!)).toBe('T-shirt offert : plus que 15')
    expect(tshirtHeadline(buildTshirtOffer(60, 59)!)).toBe('T-shirt offert : plus que 1')
  })

  it('says nothing once sold out', () => {
    expect(tshirtHeadline(buildTshirtOffer(60, 60)!)).toBeNull()
  })
})
