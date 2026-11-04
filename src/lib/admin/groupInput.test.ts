import { describe, expect, it } from 'vitest'
import { groupDelegateSchema, groupFromPromocodeSchema, groupMemberAddSchema, groupUpdateSchema } from './groupInput'

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

describe('group command schemas', () => {
  it('delegate: accepts a uuid captain, refuses a missing or invalid one', () => {
    const id = '5b6c7d8e-9f0a-4b1c-8d2e-3f4a5b6c7d8e'
    expect(groupDelegateSchema.parse({ new_captain_id: id }).new_captain_id).toBe(id)
    expect(groupDelegateSchema.safeParse({}).success).toBe(false)
    expect(groupDelegateSchema.safeParse({ new_captain_id: 'abc' }).success).toBe(false)
  })

  it('member add: accepts a uuid profile, refuses a blank one', () => {
    expect(groupMemberAddSchema.safeParse({ profile_id: '5b6c7d8e-9f0a-4b1c-8d2e-3f4a5b6c7d8e' }).success).toBe(true)
    expect(groupMemberAddSchema.safeParse({ profile_id: '' }).success).toBe(false)
  })

  it('from promocode: trims name and code, refuses a missing code or captain', () => {
    const parsed = groupFromPromocodeSchema.parse({
      name: '  Team Acme ',
      promotional_code: ' ACME20 ',
      captain_profile_id: '5b6c7d8e-9f0a-4b1c-8d2e-3f4a5b6c7d8e',
    })
    expect(parsed.name).toBe('Team Acme')
    expect(parsed.promotional_code).toBe('ACME20')
    expect(groupFromPromocodeSchema.safeParse({ name: 'x', captain_profile_id: '5b6c7d8e-9f0a-4b1c-8d2e-3f4a5b6c7d8e' }).success).toBe(false)
    expect(groupFromPromocodeSchema.safeParse({ name: 'x', promotional_code: 'A' }).success).toBe(false)
  })
})
