import { describe, expect, it } from 'vitest'
import { applySegment, type SegmentIdentity } from './segments'

const recipients = [
  { email: 'account@x.fr', userId: 'u1' },
  { email: 'Popup@X.fr', userId: null },
  { email: 'other@x.fr', userId: 'u2' },
  { email: 'stranger@x.fr' },
]

const identity: SegmentIdentity = {
  userIds: new Set(['u1']),
  emails: new Set(['popup@x.fr']),
}

describe('applySegment', () => {
  it('keeps everyone for the all segment', () => {
    expect(applySegment(recipients, 'all', identity)).toHaveLength(4)
  })

  it('registered keeps accounts matched by id and email-only people matched by address', () => {
    expect(applySegment(recipients, 'registered', identity).map((r) => r.email)).toEqual([
      'account@x.fr',
      'Popup@X.fr',
    ])
  })

  it('volunteers uses the same matching on its own identity', () => {
    const volunteers: SegmentIdentity = { userIds: new Set(), emails: new Set(['stranger@x.fr']) }

    expect(applySegment(recipients, 'volunteers', volunteers).map((r) => r.email)).toEqual(['stranger@x.fr'])
  })

  it('not_registered is exactly the complement of registered', () => {
    const registered = applySegment(recipients, 'registered', identity)
    const notRegistered = applySegment(recipients, 'not_registered', identity)

    expect(notRegistered.map((r) => r.email)).toEqual(['other@x.fr', 'stranger@x.fr'])
    expect(registered.length + notRegistered.length).toBe(recipients.length)
  })

  it('an empty identity makes everyone not registered and nobody registered', () => {
    const empty: SegmentIdentity = { userIds: new Set(), emails: new Set() }

    expect(applySegment(recipients, 'registered', empty)).toEqual([])
    expect(applySegment(recipients, 'not_registered', empty)).toHaveLength(4)
  })

  it('does not mutate its input', () => {
    const input = [...recipients]
    applySegment(input, 'registered', identity)
    expect(input).toEqual(recipients)
  })
})
