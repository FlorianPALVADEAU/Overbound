import { describe, expect, it } from 'vitest'
import { hasProvenConsent, LEGACY_UNPROVEN_SOURCE, RECONSENT_SOURCE } from './consent'

describe('hasProvenConsent', () => {
  it.each(['signup', 'preferences', 'preferences_page', 'popup-123', 'admin', RECONSENT_SOURCE])(
    'accepts a traced source: %s',
    (source) => {
      expect(hasProvenConsent(source)).toBe(true)
    },
  )

  it.each([null, undefined, '', '   ', LEGACY_UNPROVEN_SOURCE, `${LEGACY_UNPROVEN_SOURCE}:popup-123`])(
    'rejects a missing or legacy source: %s',
    (source) => {
      expect(hasProvenConsent(source)).toBe(false)
    },
  )
})
