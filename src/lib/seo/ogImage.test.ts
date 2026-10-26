import { describe, expect, it } from 'vitest'
import { isOgPhotoKey, OG_PHOTOS } from '@/constants/coverImages'
import { DEFAULT_OG_IMAGE_URL, ogImageUrl } from './ogImage'

describe('ogImageUrl', () => {
  it('encodes title, kicker and photo as a /og query', () => {
    const url = new URL(ogImageUrl({ title: 'Les obstacles', kicker: 'Overbound', photo: 'tire' }), 'https://x.test')
    expect(url.pathname).toBe('/og')
    expect(url.searchParams.get('title')).toBe('Les obstacles')
    expect(url.searchParams.get('kicker')).toBe('Overbound')
    expect(url.searchParams.get('photo')).toBe('tire')
  })

  it('omits the kicker when absent and defaults the photo', () => {
    const url = new URL(ogImageUrl({ title: 'Contact' }), 'https://x.test')
    expect(url.searchParams.has('kicker')).toBe(false)
    expect(url.searchParams.get('photo')).toBe('crowd')
  })

  it('exposes a default card', () => {
    expect(DEFAULT_OG_IMAGE_URL.startsWith('/og?')).toBe(true)
  })
})

describe('isOgPhotoKey', () => {
  it('accepts every declared key and rejects anything else', () => {
    for (const key of Object.keys(OG_PHOTOS)) expect(isOgPhotoKey(key)).toBe(true)
    expect(isOgPhotoKey('../../etc/passwd')).toBe(false)
    expect(isOgPhotoKey('toString')).toBe(false)
    expect(isOgPhotoKey(null)).toBe(false)
  })
})
