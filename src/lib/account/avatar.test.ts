import { describe, expect, it } from 'vitest'
import {
  AVATAR_MAX_BYTES,
  buildAvatarPath,
  detectImageType,
  pickProviderAvatar,
  storagePathFromPublicUrl,
  validateAvatarUpload,
} from './avatar'

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0]
const WEBP = [0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]

describe('detectImageType / validateAvatarUpload', () => {
  it('recognises JPEG, PNG and WebP from their header', () => {
    expect(detectImageType(new Uint8Array(JPEG))).toBe('jpeg')
    expect(detectImageType(new Uint8Array(PNG))).toBe('png')
    expect(detectImageType(new Uint8Array(WEBP))).toBe('webp')
    expect(validateAvatarUpload(new Uint8Array(WEBP))).toEqual({ ok: true, type: 'webp' })
  })

  it('rejects anything else, whatever its name or declared type', () => {
    const html = new TextEncoder().encode('<script>alert(1)</script>')
    expect(validateAvatarUpload(html)).toMatchObject({ ok: false })
    expect(validateAvatarUpload(new Uint8Array([0x47, 0x49, 0x46, 0x38]))).toMatchObject({ ok: false }) // GIF
  })

  it('rejects empty and oversized files', () => {
    expect(validateAvatarUpload(new Uint8Array())).toMatchObject({ ok: false })
    const big = new Uint8Array(AVATAR_MAX_BYTES + 1)
    big.set(JPEG)
    expect(validateAvatarUpload(big)).toMatchObject({ ok: false, error: expect.stringContaining('2 Mo') })
  })
})

describe('buildAvatarPath', () => {
  it('namespaces by user and changes with every upload', () => {
    expect(buildAvatarPath('u1', 'jpeg', new Date(1000))).toBe('u1/1000.jpg')
    expect(buildAvatarPath('u1', 'webp', new Date(2000))).toBe('u1/2000.webp')
  })
})

describe('pickProviderAvatar', () => {
  it('reads Google metadata, accepting https URLs only', () => {
    expect(pickProviderAvatar({ avatar_url: 'https://lh3.googleusercontent.com/a' })).toBe('https://lh3.googleusercontent.com/a')
    expect(pickProviderAvatar({ picture: 'https://x.test/p.png' })).toBe('https://x.test/p.png')
    expect(pickProviderAvatar({ avatar_url: 'javascript:alert(1)' })).toBeNull()
    expect(pickProviderAvatar(null)).toBeNull()
  })
})

describe('storagePathFromPublicUrl', () => {
  it('extracts our own object path and ignores external URLs', () => {
    expect(storagePathFromPublicUrl('https://x.supabase.co/storage/v1/object/public/avatars/u1/1000.webp')).toBe('u1/1000.webp')
    expect(storagePathFromPublicUrl('https://lh3.googleusercontent.com/a')).toBeNull()
    expect(storagePathFromPublicUrl(null)).toBeNull()
  })
})
