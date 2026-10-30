import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: vi.fn() }))

import { resolveQrImageUrl } from './upload'

describe('resolveQrImageUrl', () => {
  it('returns the stored image URL when the upload works', async () => {
    const upload = vi.fn().mockResolvedValue('https://cdn.example/qr-abc.png')

    await expect(resolveQrImageUrl('abc', 'https://overbound-race.com', upload)).resolves.toBe(
      'https://cdn.example/qr-abc.png',
    )
    expect(upload).toHaveBeenCalledWith('abc')
  })

  it('falls back to the on-demand QR route when the upload fails', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('storage down'))

    await expect(resolveQrImageUrl('a/b c', 'https://overbound-race.com/', upload)).resolves.toBe(
      'https://overbound-race.com/api/qr/a%2Fb%20c',
    )
  })
})
