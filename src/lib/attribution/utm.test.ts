import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { captureUtmParams, readUtmParams, serializeUtmParams } from './utm'

describe('captureUtmParams / readUtmParams', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const withUrl = (search: string) => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search },
      writable: true,
    })
  }

  it('captures utm params from the current URL into localStorage', () => {
    withUrl('?utm_source=facebook&utm_campaign=ultra_arena_2026&utm_medium=paid_social')

    captureUtmParams()

    expect(readUtmParams()).toEqual({
      utm_source: 'facebook',
      utm_campaign: 'ultra_arena_2026',
      utm_medium: 'paid_social',
    })
  })

  it('does not overwrite stored params when the URL has no UTM params', () => {
    withUrl('?utm_source=facebook')
    captureUtmParams()

    withUrl('/events/ultra-arena-2026')
    captureUtmParams()

    expect(readUtmParams()).toEqual({ utm_source: 'facebook' })
  })

  it('overwrites stored params on a later visit carrying new UTM params (last touch)', () => {
    withUrl('?utm_source=facebook&utm_campaign=first')
    captureUtmParams()

    withUrl('?utm_source=google&utm_campaign=second')
    captureUtmParams()

    expect(readUtmParams()).toEqual({ utm_source: 'google', utm_campaign: 'second' })
  })

  it('returns null and clears storage once the captured params expire (30 days)', () => {
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    window.localStorage.setItem(
      'overbound-utm',
      JSON.stringify({ params: { utm_source: 'facebook' }, capturedAt: old }),
    )

    expect(readUtmParams()).toBeNull()
    expect(window.localStorage.getItem('overbound-utm')).toBeNull()
  })

  it('returns null when nothing was ever captured', () => {
    expect(readUtmParams()).toBeNull()
  })
})

describe('serializeUtmParams', () => {
  it('serializes valid UTM params into a query-string-like value', () => {
    const result = serializeUtmParams({ utm_source: 'facebook', utm_campaign: 'ultra_arena_2026' })

    expect(result).toBe('utm_source=facebook&utm_campaign=ultra_arena_2026')
  })

  it('returns an empty string for null, non-object, or empty input', () => {
    expect(serializeUtmParams(null)).toBe('')
    expect(serializeUtmParams('not-an-object')).toBe('')
    expect(serializeUtmParams({})).toBe('')
  })

  it('ignores unknown keys and non-string values (untrusted client input)', () => {
    const result = serializeUtmParams({
      utm_source: 'facebook',
      utm_evil: 'ignored',
      utm_campaign: 12345,
    })

    expect(result).toBe('utm_source=facebook')
  })

  it('trims and URL-encodes values, and truncates overly long input', () => {
    const result = serializeUtmParams({ utm_source: '  face,book&x=1  ' })

    expect(result).toBe(`utm_source=${encodeURIComponent('face,book&x=1')}`)
  })
})
