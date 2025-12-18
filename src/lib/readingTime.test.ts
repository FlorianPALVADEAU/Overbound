import { describe, expect, it } from 'vitest'

import { estimateReadingTime } from '@/lib/readingTime'

describe('estimateReadingTime', () => {
  it('returns zeros when no text is provided', () => {
    expect(estimateReadingTime(undefined)).toEqual({ minutes: 0, words: 0 })
    expect(estimateReadingTime('')).toEqual({ minutes: 0, words: 0 })
  })

  it('counts words after trimming whitespace and collapses gaps', () => {
    const input = '   This   sentence\nhas irregular   spacing today.\n'
    expect(estimateReadingTime(input)).toEqual({ minutes: 1, words: 6 })
  })

  it('rounds to the nearest minute but never below one for non-empty text', () => {
    const words = Array.from({ length: 760 }, () => 'word').join(' ')
    expect(estimateReadingTime(words)).toEqual({ minutes: 4, words: 760 })
  })
})
