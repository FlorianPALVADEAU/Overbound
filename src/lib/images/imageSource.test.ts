import { readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveImageSource } from './imageSource'

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

describe('resolveImageSource', () => {
  it('keeps local paths optimizable and serves AVIF through its WebP twin', () => {
    expect(resolveImageSource('/images/obstacles/tire-flip.webp')).toEqual({
      src: '/images/obstacles/tire-flip.webp',
      optimizable: true,
    })
    expect(resolveImageSource('/images/obstacles/tire-flip.avif').src).toBe('/images/obstacles/tire-flip.webp')
    expect(resolveImageSource('/videos/poster.avif').src).toBe('/videos/poster.avif')
  })

  it('has a WebP twin for every AVIF under public/images', () => {
    const missing = walk(join(process.cwd(), 'public/images'))
      .filter((path) => path.endsWith('.avif'))
      .filter((path) => !existsSync(path.replace(/\.avif$/, '.webp')))
    expect(missing).toEqual([])
  })

  it('rewrites our own absolute URLs to local paths', () => {
    expect(resolveImageSource('https://www.overbound-race.com/images/obstacles/log-carry2.avif')).toEqual({
      src: '/images/obstacles/log-carry2.webp',
      optimizable: true,
    })
    expect(resolveImageSource('https://overbound-race.com/images/a.avif').src).toBe('/images/a.webp')
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
