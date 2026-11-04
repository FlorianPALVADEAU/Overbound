import { describe, expect, it } from 'vitest'
import { listAmbassadorCodeIds, pickCurrentCodeId } from './currentCode'

describe('pickCurrentCodeId', () => {
  it('returns the code flagged current among the junction rows', () => {
    const links = [
      { promotional_code_id: 'c1', is_current: false },
      { promotional_code_id: 'c2', is_current: true },
    ]
    expect(pickCurrentCodeId(links, 'legacy')).toBe('c2')
  })

  it('falls back to the first junction row when none is flagged', () => {
    const links = [{ promotional_code_id: 'c1', is_current: false }]
    expect(pickCurrentCodeId(links, null)).toBe('c1')
  })

  it('uses the legacy code only when there is no junction row', () => {
    expect(pickCurrentCodeId([], 'legacy')).toBe('legacy')
    expect(pickCurrentCodeId([], null)).toBeNull()
  })
})

describe('listAmbassadorCodeIds', () => {
  it('lists the junction codes, and the legacy code only without junction rows', () => {
    expect(listAmbassadorCodeIds([{ promotional_code_id: 'c1', is_current: true }], 'legacy')).toEqual(['c1'])
    expect(listAmbassadorCodeIds([], 'legacy')).toEqual(['legacy'])
    expect(listAmbassadorCodeIds([], null)).toEqual([])
  })
})
