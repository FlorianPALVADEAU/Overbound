import { describe, expect, it } from 'vitest'
import { joinBirthDate, splitBirthDate } from './birthDateParts'

describe('birthDateParts', () => {
  it('joins three parts into an ISO date and pads day and month', () => {
    expect(joinBirthDate({ day: '4', month: '5', year: '1990' })).toBe('1990-05-04')
  })

  it('returns an empty string for an incomplete or impossible date', () => {
    expect(joinBirthDate({ day: '31', month: '02', year: '1990' })).toBe('')
    expect(joinBirthDate({ day: '12', month: '', year: '1990' })).toBe('')
    expect(joinBirthDate({ day: '12', month: '05', year: '90' })).toBe('')
  })

  it('splits a stored ISO date, and gives empty parts for anything else', () => {
    expect(splitBirthDate('1990-05-04')).toEqual({ day: '04', month: '05', year: '1990' })
    expect(splitBirthDate('')).toEqual({ day: '', month: '', year: '' })
  })
})
