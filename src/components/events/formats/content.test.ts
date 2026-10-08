import { describe, expect, it } from 'vitest'
import { pickFormat } from './content'

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
