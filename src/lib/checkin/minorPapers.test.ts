import { describe, expect, it } from 'vitest'
import { decideMinorPapers, minorPapersChecksSchema } from './minorPapers'

const checks = { authorizationSigned: true, identityChecked: true, referentIdentified: true, healthAttestationSeen: true } as const

describe('decideMinorPapers', () => {
  it('lets an adult through whatever was sent', () => {
    expect(decideMinorPapers({ isMinor: false, verifiedAt: null, checks: undefined })).toBe('not_a_minor')
  })

  it('refuses a minor whose papers were never controlled and who has no checks', () => {
    expect(decideMinorPapers({ isMinor: true, verifiedAt: null, checks: undefined })).toBe('papers_required')
  })

  it('verifies a minor when the volunteer sends the four checks', () => {
    expect(decideMinorPapers({ isMinor: true, verifiedAt: null, checks })).toBe('verify_now')
  })

  it('does not ask again once the papers were controlled', () => {
    expect(decideMinorPapers({ isMinor: true, verifiedAt: '2027-09-11T07:30:00.000Z', checks: undefined })).toBe('already_verified')
  })
})

describe('minorPapersChecksSchema', () => {
  it('accepts the four checks', () => {
    expect(minorPapersChecksSchema.safeParse(checks).success).toBe(true)
  })

  it('refuses a missing or false check', () => {
    expect(minorPapersChecksSchema.safeParse({ ...checks, identityChecked: false }).success).toBe(false)
    expect(minorPapersChecksSchema.safeParse({ authorizationSigned: true }).success).toBe(false)
  })
})
