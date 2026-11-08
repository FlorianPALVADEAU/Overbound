import { describe, expect, it } from 'vitest'
import { isPubliclyListed, normalizeBio, publicPhotoUrl, toPublicName } from './publicProfile'

const UPLOADED = 'https://x.supabase.co/storage/v1/object/public/avatars/user-1/1700000000000.webp'

describe('isPubliclyListed', () => {
  it('lists an active, opted-in, unblocked ambassador', () => {
    expect(isPubliclyListed({ is_active: true, public_opt_in: true, public_blocked: false })).toBe(true)
  })

  it('does not list without opt-in', () => {
    expect(isPubliclyListed({ is_active: true, public_opt_in: false, public_blocked: false })).toBe(false)
  })

  it('does not list a blocked ambassador even with opt-in', () => {
    expect(isPubliclyListed({ is_active: true, public_opt_in: true, public_blocked: true })).toBe(false)
  })

  it('does not list an inactive ambassador', () => {
    expect(isPubliclyListed({ is_active: false, public_opt_in: true, public_blocked: false })).toBe(false)
  })
})

describe('toPublicName', () => {
  it('keeps the first name and the initial of the last one', () => {
    expect(toPublicName({ first_name: 'Marie', last_name: 'Dupont' })).toBe('Marie D.')
    expect(toPublicName({ first_name: '  jean ', last_name: ' de la Tour ' })).toBe('jean D.')
  })

  it('shows a single name as is and falls back when empty', () => {
    expect(toPublicName({ first_name: 'Marie', last_name: null })).toBe('Marie')
    expect(toPublicName({ first_name: '   ', last_name: 'Dupont' })).toBe('Ambassadeur')
    expect(toPublicName(null)).toBe('Ambassadeur')
  })
})

describe('publicPhotoUrl', () => {
  it('returns an uploaded photo', () => {
    expect(publicPhotoUrl(UPLOADED)).toBe(UPLOADED)
  })

  it('hides a provider photo and a missing one', () => {
    expect(publicPhotoUrl('https://lh3.googleusercontent.com/a/abc')).toBeNull()
    expect(publicPhotoUrl(null)).toBeNull()
  })
})

describe('normalizeBio', () => {
  it('trims and collapses spaces and line breaks', () => {
    expect(normalizeBio('  Je cours\n\nen  groupe  ')).toBe('Je cours en groupe')
  })

  it('turns an empty text into null', () => {
    expect(normalizeBio('   \n ')).toBeNull()
    expect(normalizeBio(null)).toBeNull()
  })
})
