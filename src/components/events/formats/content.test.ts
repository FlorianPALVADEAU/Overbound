import { describe, expect, it } from 'vitest'
import { OPEN_FORMAT_RULES, RANKED_FORMAT_RULES } from '@/constants/raceFormatRules'
import { COMPARE_ROWS, FORMAT_FAQS, pickFormat } from './content'

describe('pickFormat', () => {
  it('returns null until every question is answered', () => {
    expect(pickFormat({ goal: 'open' })).toBeNull()
  })
  it('recommends ranked on a ranked majority', () => {
    expect(pickFormat({ goal: 'ranked', pressure: 'ranked', penalty: 'open' })).toBe('ranked')
  })
  it('recommends open on an open majority', () => {
    expect(pickFormat({ goal: 'open', pressure: 'ranked', penalty: 'open' })).toBe('open')
  })
})

describe('OPEN failed obstacle penalty', () => {
  it('is lighter than RANKED but not zero', () => {
    expect(OPEN_FORMAT_RULES.failedObstacleBurpees).toBeGreaterThan(0)
    expect(OPEN_FORMAT_RULES.failedObstacleBurpees).toBeLessThan(RANKED_FORMAT_RULES.failedObstacleBurpees)
  })
  it('is stated in the comparison table and the FAQ', () => {
    const row = COMPARE_ROWS.find((r) => r.label === 'Obstacle raté')
    expect(row?.open).toContain(String(OPEN_FORMAT_RULES.failedObstacleBurpees))
    const faq = FORMAT_FAQS.find((f) => f.id === 'penalty')
    expect(faq?.answer).toContain(String(OPEN_FORMAT_RULES.failedObstacleBurpees))
  })
  it('never claims OPEN has no penalty', () => {
    const copy = [...COMPARE_ROWS.map((r) => r.open), ...FORMAT_FAQS.map((f) => f.answer)].join(' ')
    expect(copy).not.toMatch(/(sans|aucune) pénalité/i)
  })
})
