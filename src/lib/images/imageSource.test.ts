import { describe, expect, it } from 'vitest'
import { resolveImageSource } from './imageSource'

describe('resolveImageSource', () => {
  it('keeps local paths optimizable', () => {
    expect(resolveImageSource('/images/obstacles/tire-flip.avif')).toEqual({
      src: '/images/obstacles/tire-flip.avif',
      optimizable: true,
    })
  })

  it('rewrites our own absolute URLs to local paths', () => {
    expect(resolveImageSource('https://www.overbound-race.com/images/obstacles/log-carry2.avif')).toEqual({
      src: '/images/obstacles/log-carry2.avif',
      optimizable: true,
    })
    expect(resolveImageSource('https://overbound-race.com/images/a.avif').src).toBe('/images/a.avif')
  })

  it('accepts allowlisted remote hosts, including wildcard subdomains', () => {
    expect(
      resolveImageSource('https://abc.supabase.co/storage/v1/object/public/obstacles/x.jpg').optimizable,
    ).toBe(true)
    expect(resolveImageSource('https://cdn.sanity.io/images/p/d/x.jpg').optimizable).toBe(true)
  })

  it('refuses hosts or paths outside the allowlist', () => {
    expect(resolveImageSource('https://example.com/x.jpg')).toEqual({
      src: 'https://example.com/x.jpg',
      optimizable: false,
    })
    expect(resolveImageSource('https://abc.supabase.co/storage/v1/object/sign/x.jpg').optimizable).toBe(false)
    expect(resolveImageSource('//example.com/x.jpg').optimizable).toBe(false)
  })

  it('passes malformed URLs through without optimizing them', () => {
    expect(resolveImageSource('not a url')).toEqual({ src: 'not a url', optimizable: false })
  })
})
