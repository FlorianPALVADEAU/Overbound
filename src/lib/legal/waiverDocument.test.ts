import { describe, expect, it } from 'vitest'
import { REGULATION_VERSION } from '@/constants/registration'
import { fingerprintWaiver } from './waiverDocument'

describe('fingerprintWaiver', () => {
  it('fingerprints the current waiver with the current regulation version', () => {
    const reference = fingerprintWaiver()
    expect(reference.version).toBe(REGULATION_VERSION)
    expect(reference.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(fingerprintWaiver().sha256).toBe(reference.sha256)
  })

  it('changes when a single word of the text changes', () => {
    expect(fingerprintWaiver('Je reconnais les risques.', 'v1').sha256).not.toBe(
      fingerprintWaiver('Je reconnais des risques.', 'v1').sha256,
    )
  })

  it('changes when only the version changes', () => {
    expect(fingerprintWaiver('Texte', 'v1').sha256).not.toBe(fingerprintWaiver('Texte', 'v2').sha256)
  })
})
