import { describe, expect, it } from 'vitest'
import { parseEuroInput } from './CancelRegistrationDialog'

describe('parseEuroInput', () => {
  it.each([
    ['25', 2500],
    ['25,5', 2550],
    ['12.50', 1250],
    [' 0,99 ', 99],
  ])('reads %s as %d cents', (input, cents) => {
    expect(parseEuroInput(input)).toBe(cents)
  })

  it.each(['', '0', '0,00', '-5', 'abc', '12,345', '1 000'])('rejects %j', (input) => {
    expect(parseEuroInput(input)).toBeNull()
  })
})
