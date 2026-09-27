import { describe, expect, it } from 'vitest'
import { externalUpsellImagesSchema, getLegacyImageUrl } from './media'

describe('externalUpsellImagesSchema', () => {
  it('accepts ordered HTTPS external images', () => {
    const parsed = externalUpsellImagesSchema.safeParse([
      { source: 'external', external_url: 'https://cdn.example.com/front.jpg', position: 0 },
      { source: 'external', external_url: 'https://cdn.example.com/back.jpg', alt_text: 'Dos', position: 1 },
    ])

    expect(parsed.success).toBe(true)
  })

  it('rejects an insecure URL and duplicate positions', () => {
    const parsed = externalUpsellImagesSchema.safeParse([
      { source: 'external', external_url: 'http://cdn.example.com/front.jpg', position: 0 },
      { source: 'external', external_url: 'https://cdn.example.com/back.jpg', position: 0 },
    ])

    expect(parsed.success).toBe(false)
  })
})

describe('getLegacyImageUrl', () => {
  it('keeps an explicit legacy URL before deriving one from the gallery', () => {
    expect(getLegacyImageUrl([
      { source: 'external', external_url: 'https://cdn.example.com/second.jpg', position: 1 },
      { source: 'external', external_url: 'https://cdn.example.com/first.jpg', position: 0 },
    ], 'https://legacy.example.com/image.jpg')).toBe('https://legacy.example.com/image.jpg')
  })
})
