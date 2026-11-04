import { describe, expect, it } from 'vitest'
import { groupUpdateSchema } from './groupInput'

describe('groupUpdateSchema', () => {
  it('accepts an empty patch: nothing to change', () => {
    expect(groupUpdateSchema.parse({})).toEqual({})
  })

  it('accepts a null anchor to clear it', () => {
    expect(groupUpdateSchema.parse({ anchor_wave_index: null, anchor_event_id: null }).anchor_wave_index).toBeNull()
  })

  it('refuses a wave outside 1 to 24', () => {
    expect(groupUpdateSchema.safeParse({ anchor_wave_index: 0 }).success).toBe(false)
    expect(groupUpdateSchema.safeParse({ anchor_wave_index: 25 }).success).toBe(false)
  })

  it('refuses a fractional wave', () => {
    expect(groupUpdateSchema.safeParse({ anchor_wave_index: 3.5 }).success).toBe(false)
  })

  it('refuses a blank name', () => {
    expect(groupUpdateSchema.safeParse({ name: '   ' }).success).toBe(false)
  })

  it('refuses a captain or event id that is not a uuid', () => {
    expect(groupUpdateSchema.safeParse({ captain_id: 'abc' }).success).toBe(false)
    expect(groupUpdateSchema.safeParse({ anchor_event_id: 'abc' }).success).toBe(false)
  })
})
