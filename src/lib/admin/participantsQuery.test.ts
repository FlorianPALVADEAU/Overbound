import { describe, expect, it } from 'vitest'
import { applyParticipantFilters, participantFiltersSchema } from './participantsQuery'

/** Records the PostgREST calls the filters make, in order. */
const recorder = () => {
  const calls: Array<[string, ...unknown[]]> = []
  const chain = {
    eq: (...args: unknown[]) => (calls.push(['eq', ...args]), chain),
    is: (...args: unknown[]) => (calls.push(['is', ...args]), chain),
    not: (...args: unknown[]) => (calls.push(['not', ...args]), chain),
    or: (...args: unknown[]) => (calls.push(['or', ...args]), chain),
  }
  return { chain, calls }
}

describe('participant sex filter', () => {
  it('filters on the sex of the bib when a sex is chosen', () => {
    const { chain, calls } = recorder()
    applyParticipantFilters(chain, participantFiltersSchema.parse({ sex: 'femme' }))
    expect(calls).toEqual([['eq', 'sex', 'femme']])
  })

  it('lists the bibs whose sex was never recorded with `none`', () => {
    const { chain, calls } = recorder()
    applyParticipantFilters(chain, participantFiltersSchema.parse({ sex: 'none' }))
    expect(calls).toEqual([['is', 'sex', null]])
  })

  it('adds no sex clause when the filter is not set', () => {
    const { chain, calls } = recorder()
    applyParticipantFilters(chain, participantFiltersSchema.parse({}))
    expect(calls.some(([, column]) => column === 'sex')).toBe(false)
  })

  it('refuses any value outside homme, femme and none', () => {
    expect(participantFiltersSchema.safeParse({ sex: 'autre' }).success).toBe(false)
    expect(participantFiltersSchema.safeParse({ sex: 'homme' }).success).toBe(true)
  })
})
